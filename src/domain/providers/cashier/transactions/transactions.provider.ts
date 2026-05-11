import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';
import {
  And,
  DataSource,
  EntityManager,
  FindOperator,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  UpdateResult
} from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { Where } from '@postgresql/repositories/common/common.types';
import {
  FoundAndCounted,
  ID,
  Pagination,
  TxOpsDeps
} from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import { COMMON_TRANSACTION_ERROR } from './transactions.contants';
import { TransactionsTxOps } from './transactions.txOps';
import {
  LentRepaymentTransaction,
  RefundInTransaction,
  RefundOutTransaction,
  TransactionsFilter
} from './transactions.types';

@Injectable()
export class TransactionsProvider extends CommonPostgresqlProvider<TransactionEntity> {
  constructor(
    private readonly transactionsDb: TransactionsDb,
    private readonly dataSource: DataSource,
  ) {
    super(transactionsDb);
  }

  public async getTransactionsList({
    pagination,
    filter,
  }: {
    pagination: Pagination;
    filter?: TransactionsFilter;
  }): Promise<FoundAndCounted<TransactionEntity>> {
    const getStatusWhere = (): FindOperator<TransactionStatus> | undefined => {
      if (filter?.status && filter?.notStatus) {
        return And(
          In(filter.status),
          Not(In(filter.notStatus)),
        );
      }

      if (filter?.status) {
        return In(filter.status);
      }

      if (filter?.notStatus) {
        return Not(In(filter.notStatus));
      }
    };

    const getAmountWhere = (): FindOperator<string> | undefined => {
      if (filter?.amountFrom && filter?.amountTo) {
        return And(
          MoreThanOrEqual(filter.amountFrom.toString()),
          LessThanOrEqual(filter.amountTo.toString()),
        );
      }

      if (filter?.amountFrom) {
        return MoreThanOrEqual(filter.amountFrom.toString());
      }

      if (filter?.amountTo) {
        return LessThanOrEqual(filter.amountTo.toString());
      }
    };

    const baseWhere: Where<TransactionEntity> = {
      parentTransactionId: filter?.parentTransactionIds && In(filter.parentTransactionIds),
      status: getStatusWhere(),
      debitId: filter?.debitIds && In(filter.debitIds),
      creditId: filter?.creditIds && In(filter.creditIds),
      amount: getAmountWhere(),
      operationType: filter?.operationTypes && In(filter.operationTypes),
    };

    const hasAnd = filter?.query ||
      filter?.anyAccountIds ||
      filter?.anyId;

    return super.findAndCount({
      pagination,
      relations: ['debitAccount', 'creditAccount'],
      where: hasAnd ? [
        {
          ...baseWhere,
          description: filter?.query && ILike(`%${filter.query}%`),
          debitId: filter?.anyAccountIds && In(filter.anyAccountIds),
          transactionId: filter?.anyId,
        },
        {
          ...baseWhere,
          transactionId: filter?.query && ILike(`%${filter.query}%`),
          creditId: filter?.anyAccountIds && In(filter.anyAccountIds),
          parentTransactionId: filter?.anyId,
        }
      ] : baseWhere
    });
  }

  public async lentRepaymentTransaction({
    data,
  }: {
    data: LentRepaymentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      obligationAccountId,
      debitId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!obligationAccountId || !debitId) {
      throw new InternalServerErrorException(`Lent Repayment create error. obligationAccountId and debitId should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [obligationAccountId, debitId]
      });

      const debitAccount = this.checkAccount(accounts[debitId], {
        context: `Debit account ${debitId}.`,
      });

      const obligationAccount = this.checkAccount(accounts[obligationAccountId], {
        context: `Obligation account ${obligationAccountId}.`,
        additionalCheck: (acc) => {
          if (debitAccount.currencyId !== acc.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          return true;
        }
      });

      await Promise.all([
        this.increaseAccountBalance({
          manager,
          account: debitAccount,
          amount,
        }),
        this.increaseAccountBalance({
          manager,
          account: obligationAccount,
          amount,
        }),
      ]);

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: null,
        operationType: OperationType.LENT_REPAYMENT,
        description,
      });

      const obligationTransaction = this.createTransaction({
        manager,
        parentTransactionId: transaction.transactionId,
        amount,
        debitId: obligationAccountId,
        creditId: null,
        operationType: OperationType.LENT_REPAYMENT,
        description,
      });

      await manager.save(transaction);
      await manager.save(obligationTransaction);

      return [transaction, obligationTransaction];
    });
  }

  public async refundOutTransaction({
    data,
  }: {
    data: RefundOutTransaction;
  }): Promise<TransactionEntity> {
    const {
      transactionId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!transactionId) {
      throw new InternalServerErrorException(
        `${COMMON_TRANSACTION_ERROR} Transaction ${transactionId} should be exist`
      );
    }

    return this.buildTransactions(async (manager) => {
      const originalTransaction = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .where('tx.transactionId = :transactionId', { transactionId })
        .getOne();

      if (!originalTransaction || originalTransaction.status !== TransactionStatus.COMPLETED) {
        throw new InternalServerErrorException(
          `${COMMON_TRANSACTION_ERROR} Transaction ${transactionId} not found or incorrect status`
        );
      }

      const {
        debitId: debitedAccountId,
        creditId: creditedAccountId,
        operationType,
        amount: originalAmount,
      } = originalTransaction;

      if (!debitedAccountId) {
        throw new InternalServerErrorException(
          `${COMMON_TRANSACTION_ERROR} Account ${debitedAccountId} should be exist`
        );
      }

      if (operationType !== OperationType.RECEIPT) {
        throw new InternalServerErrorException(
          COMMON_TRANSACTION_ERROR +
          ' Refund out should apply only for Receipt transaction'
        );
      }

      const existingRefunds = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'total')
        .where('tx.parentTransactionId = :parentId', { parentId: transactionId })
        .andWhere('tx.operationType = :opType', { opType: OperationType.REFUND_OUT })
        .getRawOne<{ total: string }>();

      const totalRefunded = BigInt(existingRefunds?.total ?? 0);
      const availableForRefund = BigInt(originalAmount) - totalRefunded;

      if (availableForRefund < BigInt(amount)) {
        throw new BadRequestException(
          `Insufficient funds for refund. Available: ${availableForRefund}, Required: ${amount}`
        );
      }

      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitedAccountId, creditedAccountId]
      });

      const currentCreditAccount = this.checkAccount(accounts[debitedAccountId], {
        context: `Debited account of account ${debitedAccountId}.`,
      });

      if (creditedAccountId) {
        const currentDebitAccount = this.checkAccount(accounts[creditedAccountId], {
          context: `Credited account of account ${creditedAccountId}.`,
          additionalCheck: (acc) => {
            if (currentCreditAccount.currencyId !== acc.currencyId) {
              throw new BadRequestException('Accounts must have the same currency');
            }

            return true;
          }
        });

        await this.increaseAccountBalance({
          manager,
          account: currentDebitAccount,
          amount,
        });
      }

      await this.decreaseAccountBalance({
        manager,
        account: currentCreditAccount,
        amount,
      });

      const transaction = this.createTransaction({
        parentTransactionId: originalTransaction.transactionId,
        manager,
        amount,
        debitId: creditedAccountId,
        creditId: debitedAccountId,
        operationType: OperationType.REFUND_OUT,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public async refundInTransaction({
    data,
  }: {
    data: RefundInTransaction;
  }): Promise<TransactionEntity> {
    const {
      transactionId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!transactionId) {
      throw new InternalServerErrorException(`${COMMON_TRANSACTION_ERROR} Transaction ${transactionId} should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const originalTransaction = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .where('tx.transactionId = :transactionId', { transactionId })
        .getOne();

      if (!originalTransaction || originalTransaction.status !== TransactionStatus.COMPLETED) {
        throw new InternalServerErrorException(
          `${COMMON_TRANSACTION_ERROR} Transaction ${transactionId} not found or incorrect status`
        );
      }

      const {
        creditId: creditedAccountId,
        debitId: debitedAccountId,
        operationType,
        amount: originalAmount,
      } = originalTransaction;

      if (!creditedAccountId) {
        throw new InternalServerErrorException(
          COMMON_TRANSACTION_ERROR
          + ` Account ${creditedAccountId} should be exist`
        );
      }

      if (operationType !== OperationType.CASH_OUT) {
        throw new InternalServerErrorException(
          COMMON_TRANSACTION_ERROR +
          ' Refund in should apply only for Cash Out transaction'
        );
      }

      const existingRefunds = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'total')
        .where('tx.parentTransactionId = :parentId', { parentId: transactionId })
        .andWhere('tx.operationType = :opType', { opType: OperationType.REFUND_IN })
        .getRawOne<{ total: string }>();

      const totalRefunded = BigInt(existingRefunds?.total ?? 0);
      const availableForRefund = BigInt(originalAmount) - totalRefunded;

      if (availableForRefund < BigInt(amount)) {
        throw new BadRequestException(
          `Insufficient funds for refund. Available: ${availableForRefund}, Required: ${amount}`
        );
      }

      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [creditedAccountId, debitedAccountId]
      });

      const currentDebitAccount = this.checkAccount(accounts[creditedAccountId], {
        context: `Credited account of account ${creditedAccountId}.`,
      });

      if (debitedAccountId) {
        const currentCreditAccount = this.checkAccount(accounts[debitedAccountId], {
          context: `Debited account of account ${debitedAccountId}.`,
          additionalCheck: (acc) => {
            if (currentDebitAccount.currencyId !== acc.currencyId) {
              throw new BadRequestException('Accounts must have the same currency');
            }

            return true;
          }
        });

        await this.decreaseAccountBalance({
          manager,
          account: currentCreditAccount,
          amount,
        });
      }

      await this.increaseAccountBalance({
        manager,
        account: currentDebitAccount,
        amount,
      });

      const transaction = this.createTransaction({
        parentTransactionId: originalTransaction.transactionId,
        manager,
        amount,
        debitId: creditedAccountId,
        creditId: debitedAccountId,
        operationType: OperationType.REFUND_IN,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public forTx(deps: TxOpsDeps): TransactionsTxOps {
    return new TransactionsTxOps(deps);
  }

  private generateTransactionId(): string {
    const year = new Date().getFullYear();
    const additionalId = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TXN-${year}-${timestamp}${additionalId}`;
  }

  private getTransactionAmountError = (amount?: number | null): InternalServerErrorException => {
    return new InternalServerErrorException(
      `${COMMON_TRANSACTION_ERROR} Amount ${amount} isn't correct`
    );
  };

  private validateAmount(
    amount?: number | null,
    {
      allowZero,
    }: {
      allowZero?: boolean;
    } = {}
  ): number {
    if (amount == null || Number.isNaN(amount)) {
      throw this.getTransactionAmountError(amount);
    }

    if (amount < 0) {
      throw this.getTransactionAmountError(amount);
    }

    if (amount === 0 && !allowZero) {
      throw this.getTransactionAmountError(amount);
    }

    return amount;
  }

  private buildTransactions<Result>(
    execute: (manager: EntityManager) => Promise<Result>
  ): Promise<Result> {
    return this.dataSource.transaction(execute);
  }

  private async getAccountsForUpdate({
    manager,
    accountIds,
  }: {
    manager: EntityManager;
    accountIds: Array<ID | null | undefined>;
  }): Promise<Record<ID, AccountEntity | undefined>> {
    const ids = accountIds.filter((val) => val != null);

    if (!ids.length) {
      return {};
    }

    const accounts = await manager
      .createQueryBuilder(AccountEntity, 'account')
      .setLock('pessimistic_write')
      .where('account.id IN (:...ids)', { ids })
      .getMany();

    return createdMapFromEntity(accounts);
  }

  private checkAccount(
    account?: AccountEntity | null,
    {
      context,
      checkCurrencyId,
      additionalCheck,
    }: {
      context?: string;
      checkCurrencyId?: ID;
      additionalCheck?: (account: AccountEntity) => boolean;
    } = {}): AccountEntity {
    if (!account) {
      throw new BadRequestException(`${COMMON_TRANSACTION_ERROR} Account not found. ${context}`);
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException(`${COMMON_TRANSACTION_ERROR} Account should be active. ${context}`);
    }

    if (checkCurrencyId && account.currencyId !== checkCurrencyId) {
      throw new BadRequestException('Accounts must have the same currency');
    }

    const additionalCheckResult = additionalCheck?.(account) ?? true;

    if (!additionalCheckResult) {
      throw new BadRequestException(`${COMMON_TRANSACTION_ERROR} Additional check failed. ${context}`);
    }

    return account;
  }

  private async increaseAccountBalance({
    manager,
    account,
    amount,
  }: {
    manager: EntityManager;
    account: AccountEntity;
    amount: number;
  }): Promise<UpdateResult> {
    const { id, available, balance } = account;

    const formattedAmount = BigInt(amount);
    const debitAvailable = BigInt(available);
    const debitBalance = BigInt(balance);

    const newAvailable = debitAvailable + formattedAmount;
    const newBalance = debitBalance + formattedAmount;

    return manager.update(AccountEntity, id, {
      available: newAvailable.toString(),
      balance: newBalance.toString(),
    });
  }

  private async decreaseAccountBalance({
    manager,
    account,
    amount,
    isMayBeNegative,
  }: {
    manager: EntityManager;
    account: AccountEntity;
    amount: number;
    isMayBeNegative?: boolean;
  }): Promise<UpdateResult> {
    const { id, available, balance } = account;

    const formattedAmount = BigInt(amount);
    const creditAvailable = BigInt(available);
    const creditBalance = BigInt(balance);

    if (!isMayBeNegative && (creditAvailable < formattedAmount)) {
      throw new BadRequestException(
        `Insufficient funds. Available: ${account.available}, Required: ${amount}`
      );
    }

    const newAvailable = creditAvailable - formattedAmount;
    const newBalance = creditBalance - formattedAmount;

    return manager.update(AccountEntity, id, {
      available: newAvailable.toString(),
      balance: newBalance.toString(),
    });
  }

  private createTransaction({
    manager,
    amount,
    operationType,
    debitId = null,
    creditId = null,
    parentTransactionId,
    description = null,
  }: {
    manager: EntityManager;
    amount: TransactionEntity['amount'] | number | bigint;
    operationType: TransactionEntity['operationType'];
    debitId?: TransactionEntity['debitId'];
    creditId?: TransactionEntity['creditId'];
    parentTransactionId?: TransactionEntity['parentTransactionId'];
    description?: TransactionEntity['description'];
  }): TransactionEntity {
    return manager.create(TransactionEntity, {
      transactionId: this.generateTransactionId(),
      parentTransactionId,
      amount: amount.toString(),
      debitId: debitId,
      creditId: creditId,
      status: TransactionStatus.COMPLETED,
      operationType,
      executionDate: new Date(),
      description,
    });
  }
}