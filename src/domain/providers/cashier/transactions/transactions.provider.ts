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
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { Where } from '@postgresql/repositories/common/common.types';
import { FoundAndCounted, ID, Pagination, RecordEntity } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import { COMMON_TRANSACTION_ERROR } from './transactions.contants';
import {
  CreateOpenBalanceObligationTransaction,
  CreateTransaction,
  LentRepaymentTransaction,
  LentTransaction,
  LoanRepaymentTransaction,
  LoanTransaction,
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

  public async openBalanceTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      debitId,
      creditId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!debitId) {
      throw new InternalServerErrorException(
        `${COMMON_TRANSACTION_ERROR} Account ${debitId} should be exist`
      );
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitId, creditId]
      });

      const checkedDebitAccount = this.checkAccount(accounts[debitId], {
        context: `Debit account ${debitId}.`,
        additionalCheck: (acc) => {
          const debitAvailable = BigInt(acc.available);
          const debitBalance = BigInt(acc.balance);

          if (debitAvailable !== 0n || debitBalance !== 0n) {
            throw new BadRequestException(`Debit account ${debitId} should be empty`);
          }

          return true;
        }
      });

      const lastDebitTransaction = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .where('tx.debitId = :debitId', { debitId })
        .orderBy('tx.createdAt', 'DESC')
        .limit(1)
        .getOne();

      if (lastDebitTransaction && lastDebitTransaction.operationType !== OperationType.CLOSING_BALANCE) {
        throw new BadRequestException(
          `Cannot create Opening Balance. Last debit transaction for account ${debitId} is not CLOSING_BALANCE`
        );
      }

      if (creditId) {
        const checkedCreditAccount = this.checkAccount(accounts[creditId], {
          context: `Credit account ${debitId}.`,
          checkCurrencyId: checkedDebitAccount.currencyId,
        });

        await this.decreaseAccountBalance({
          manager,
          account: checkedCreditAccount,
          amount,
        });
      }

      await this.increaseAccountBalance({
        manager,
        account: checkedDebitAccount,
        amount,
      });

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.OPENING_BALANCE,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public async openBalanceObligationTransaction({
    data,
  }: {
    data: CreateOpenBalanceObligationTransaction;
  }): Promise<TransactionEntity> {
    const {
      obligationStorageId,
      description,
      debitName,
      currencyId,
    } = data;

    const amount = this.validateAmount(data.amount);

    return this.buildTransactions(async (manager: EntityManager) => {
      const obligationStorage = await manager
        .createQueryBuilder(MoneyStoragesEntity, 'moneyStorage')
        .where('moneyStorage.id = :id', { id: obligationStorageId })
        .getOne();

      if (!obligationStorage) {
        throw new InternalServerErrorException(`Open Balance create error. Obligation storage with id: ${obligationStorageId} not found`);
      }

      const currency = await manager
        .createQueryBuilder(CurrencyEntity, 'currency')
        .where('currency.id = :id', { id: currencyId })
        .getOne();

      if (!currency) {
        throw new InternalServerErrorException(`Open Balance create error. Currency with id: ${currencyId} not found`);
      }

      const obligationAccount = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .where('LOWER(account.name) = LOWER(:name)', { name: debitName })
        .andWhere('account.moneyStorageId = :storageId', { storageId: obligationStorageId })
        .getOne();

      if (obligationAccount) {
        throw new BadRequestException(`Debit account ${debitName} already exists`);
      }

      const formattedAmount = BigInt(amount);

      const newObligationAccountData: RecordEntity<AccountEntity> = {
        name: debitName,
        moneyStorageId: obligationStorageId,
        status: AccountStatus.ACTIVE,
        balance: formattedAmount.toString(),
        available: formattedAmount.toString(),
        currencyId,
        description: 'Automatic create while opening balance for obligation storage',
      };

      const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
      await manager.save(newObligationAccount);

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: newObligationAccount.id,
        operationType: OperationType.OPENING_BALANCE,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public async cashOutTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      debitId,
      creditId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!creditId) {
      throw new InternalServerErrorException(`Cash Out create error. Account ${creditId} should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitId, creditId]
      });

      const creditAccount = this.checkAccount(accounts[creditId], {
        context: `Credit account ${creditId}.`,
      });

      await this.decreaseAccountBalance({
        manager,
        account: creditAccount,
        amount,
      });

      if (debitId) {
        const debitAccount = this.checkAccount(accounts[debitId], {
          context: `Debit account ${debitId}.`,
        });

        await this.increaseAccountBalance({
          manager,
          account: debitAccount,
          amount,
        });
      }

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.CASH_OUT,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public async receiptTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      debitId,
      creditId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!debitId) {
      throw new InternalServerErrorException(`Open Balance create error. Account ${debitId} should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitId, creditId]
      });

      const debitAccount = this.checkAccount(accounts[debitId], {
        context: `Debit account ${debitId}.`,
      });

      await this.increaseAccountBalance({
        manager,
        account: debitAccount,
        amount,
      });

      if (creditId) {
        const creditAccount = this.checkAccount(accounts[creditId], {
          context: `Debit account ${creditId}.`,
        });

        await this.decreaseAccountBalance({
          manager,
          account: creditAccount,
          amount,
        });
      }

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.RECEIPT,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
  }

  public async loanTransaction({
    data,
  }: {
    data: LoanTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      debitId,
      creditId,
      obligationStorageId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Loan create error. debitId and creditId and should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitId, creditId]
      });

      const debitAccount = this.checkAccount(accounts[debitId], {
        context: `Debit account ${debitId}.`,
      });

      const creditAccount = this.checkAccount(accounts[creditId], {
        context: `Credit account ${creditId}.`,
        additionalCheck: (acc) => {
          if (debitAccount.currencyId !== acc.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          return true;
        }
      });

      const obligationStorage = await manager
        .createQueryBuilder(MoneyStoragesEntity, 'moneyStorage')
        .where('moneyStorage.id = :id', { id: obligationStorageId })
        .getOne();

      if (!obligationStorage) {
        throw new BadRequestException(`Obligation storage ${obligationStorageId} not found`);
      }

      const formattedAmount = BigInt(amount);

      if (BigInt(creditAccount.available) < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.LOAN,
        description,
      });

      let obligationAccount = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('LOWER(account.name) = LOWER(:name)', { name: creditAccount.name })
        .andWhere('account.moneyStorageId = :storageId', { storageId: obligationStorageId })
        .getOne();

      if (obligationAccount) {
        obligationAccount = this.checkAccount(obligationAccount, {
          context: `Obligation account ${obligationAccount.id}.`,
          additionalCheck: (acc) => {
            if (creditAccount.currencyId !== acc.currencyId) {
              throw new BadRequestException('Obligation account must have the same currency');
            }

            return true;
          }
        });

        await this.increaseAccountBalance({
          manager,
          account: obligationAccount,
          amount,
        });
      } else {
        const newObligationAccountData: RecordEntity<AccountEntity> = {
          name: creditAccount.name,
          moneyStorageId: obligationStorageId,
          status: AccountStatus.ACTIVE,
          balance: formattedAmount.toString(),
          available: formattedAmount.toString(),
          currencyId: creditAccount.currencyId,
          description: 'Automatic create while taken loan',
        };

        const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
        await manager.save(newObligationAccount);
        obligationAccount = newObligationAccount;
      }

      const obligationTransaction = this.createTransaction({
        manager,
        parentTransactionId: transaction.transactionId,
        amount,
        debitId: obligationAccount.id,
        creditId: null,
        operationType: OperationType.LOAN,
        description,
      });

      await Promise.all([
        this.decreaseAccountBalance({
          manager,
          account: creditAccount,
          amount,
        }),
        this.increaseAccountBalance({
          manager,
          account: debitAccount,
          amount,
        }),
      ]);

      await manager.save(transaction);
      await manager.save(obligationTransaction);

      return [transaction, obligationTransaction];
    });
  }

  public async loanRepaymentTransaction({
    data,
  }: {
    data: LoanRepaymentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      creditObligationAccountId,
      debitId,
      creditId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!creditObligationAccountId || !creditId || !debitId) {
      throw new InternalServerErrorException(`Loan Repayment create error. creditObligationAccountId and creditId should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [creditObligationAccountId, debitId, creditId]
      });

      const debitAccount =
        this.checkAccount(accounts[debitId], {
          context: `Debit AccountId account ${debitId}.`,
        });

      const creditAccount =
        this.checkAccount(accounts[creditId], {
          context: `Credit AccountId account ${creditId}.`,
        });

      const creditObligationAccountAccount =
        this.checkAccount(accounts[creditObligationAccountId], {
          context: `Credit Obligation AccountId account ${creditObligationAccountId}.`,
          additionalCheck: (acc) => {
            if (
              acc.currencyId !== creditAccount.currencyId ||
              acc.currencyId !== debitAccount.currencyId
            ) {
              throw new BadRequestException('Accounts must have the same currency');
            }
            return true;
          }
        });

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditObligationAvailable = BigInt(creditObligationAccountAccount.available);

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      if (creditObligationAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the Obligation account ${creditObligationAccountId}`);
      }

      await Promise.all([
        this.decreaseAccountBalance({
          manager,
          account: creditAccount,
          amount,
        }),
        this.decreaseAccountBalance({
          manager,
          account: creditObligationAccountAccount,
          amount,
        }),
        this.increaseAccountBalance({
          manager,
          account: debitAccount,
          amount,
        }),
      ]);

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.LOAN_REPAYMENT,
        description,
      });

      const obligationTransaction = this.createTransaction({
        manager,
        parentTransactionId: transaction.transactionId,
        amount,
        creditId: creditObligationAccountId,
        operationType: OperationType.LOAN_REPAYMENT,
        description,
      });

      await manager.save(transaction);
      await manager.save(obligationTransaction);

      return [transaction, obligationTransaction];
    });
  }

  public async lentTransaction({
    data,
  }: {
    data: LentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      creditId,
      creditObligationAccountId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!creditId) {
      throw new InternalServerErrorException(`Lent create error. debitId and creditId and should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [creditId].filter(Boolean)
        })
        .getMany();

      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Credit account ${creditId} not found or not active`);
      }

      const obligationStorage = await manager
        .createQueryBuilder(MoneyStoragesEntity, 'moneyStorage')
        .where('moneyStorage.id = :id', { id: creditObligationAccountId })
        .getOne();

      if (!obligationStorage) {
        throw new BadRequestException(`Obligation storage ${creditObligationAccountId} not found`);
      }

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditBalance = BigInt(creditAccount.balance);
      const moveTransactionId = this.generateTransactionId();

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      const transaction = manager.create(TransactionEntity, {
        transactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        creditId: creditId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LENT,
        executionDate: new Date(),
        description: description ?? null,
      });

      let obligationAccount = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('LOWER(account.name) = LOWER(:name)', { name: creditAccount.name })
        .andWhere('account.moneyStorageId = :storageId', { storageId: creditObligationAccountId })
        .getOne();

      if (obligationAccount) {
        if (obligationAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Obligation account ${obligationAccount.id} should be active`);
        }

        if (obligationAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Obligation account must have the same currency');
        }

        const newObligationAvailable = BigInt(obligationAccount.available) - formattedAmount;
        const newObligationBalance = BigInt(obligationAccount.balance) - formattedAmount;

        await manager.update(AccountEntity, obligationAccount.id, {
          available: newObligationAvailable.toString(),
          balance: newObligationBalance.toString(),
        });
      } else {
        const newObligationAccountData: RecordEntity<AccountEntity> = {
          name: creditAccount.name,
          moneyStorageId: creditObligationAccountId,
          status: AccountStatus.ACTIVE,
          balance: (formattedAmount * BigInt(-1)).toString(),
          available: (formattedAmount * BigInt(-1)).toString(),
          currencyId: creditAccount.currencyId,
          description: 'Automatic create while give lent',
        };

        const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
        await manager.save(newObligationAccount);
        obligationAccount = newObligationAccount;
      }

      const obligationTransaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        parentTransactionId: transaction.transactionId,
        amount: formattedAmount.toString(),
        debitId: null,
        creditId: obligationAccount.id,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LENT,
        executionDate: new Date(),
        description: description ?? null,
      });

      const newCreditAvailable = creditAvailable - formattedAmount;
      const newCreditBalance = creditBalance - formattedAmount;

      await manager.update(AccountEntity, creditId, {
        available: newCreditAvailable.toString(),
        balance: newCreditBalance.toString(),
      });

      await manager.save(transaction);
      await manager.save(obligationTransaction);

      return [transaction, obligationTransaction];
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
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [obligationAccountId, debitId].filter(Boolean)
        })
        .getMany();

      const obligationAccount = accounts.find(({ id }) => id === obligationAccountId) ?? null;
      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;

      if (!obligationAccount || obligationAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(
          `Obligation account ${obligationAccountId} not found or not active`
        );
      }

      if (!debitAccount || debitAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Debit account ${debitId} not found or not active`);
      }

      if (
        obligationAccount.currencyId !== debitAccount.currencyId
      ) {
        throw new BadRequestException('Accounts must have the same currency');
      }

      const formattedAmount = BigInt(amount);
      const debitAvailable = BigInt(debitAccount.available);
      const debitBalance = BigInt(debitAccount.balance);
      const obligationAvailable = BigInt(obligationAccount.available);
      const obligationBalance = BigInt(obligationAccount.balance);
      const moveTransactionId = this.generateTransactionId();

      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;
      const newObligationAvailable = obligationAvailable + formattedAmount;
      const newObligationBalance = obligationBalance + formattedAmount;

      await Promise.all([
        manager.update(AccountEntity, debitId, {
          available: newDebitAvailable.toString(),
          balance: newDebitBalance.toString(),
        }),
        manager.update(AccountEntity, obligationAccountId, {
          available: newObligationAvailable.toString(),
          balance: newObligationBalance.toString(),
        }),
      ]);

      const transaction = manager.create(TransactionEntity, {
        transactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        debitId: debitId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LENT_REPAYMENT,
        executionDate: new Date(),
        description: description ?? null,
      });

      const obligationTransaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        parentTransactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        debitId: obligationAccountId,
        creditId: null,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LENT_REPAYMENT,
        executionDate: new Date(),
        description: description ?? null,
      });

      await manager.save(transaction);
      await manager.save(obligationTransaction);

      return [transaction, obligationTransaction];
    });
  }

  public async transferTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      debitId,
      creditId,
      description,
    } = data;

    const amount = this.validateAmount(data.amount);

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Transfer create error. debitId and creditId and should be exist`);
    }

    return this.buildTransactions(async (manager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds: [debitId, creditId]
      });

      const debitAccount = this.checkAccount(accounts[debitId], {
        context: `Debit account ${debitId}.`,
      });

      const creditAccount = this.checkAccount(accounts[creditId], {
        context: `Credit account ${creditId}.`,
        additionalCheck: (acc) => {
          if (acc.currencyId !== debitAccount.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          return true;
        }
      });

      await this.decreaseAccountBalance({
        manager,
        account: creditAccount,
        amount,
      });

      await this.increaseAccountBalance({
        manager,
        account: debitAccount,
        amount,
      });

      const transaction = this.createTransaction({
        manager,
        amount,
        debitId: debitId,
        creditId: creditId,
        operationType: OperationType.TRANSFER,
        description,
      });

      await manager.save(transaction);

      return transaction;
    });
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
    if (amount == null) {
      throw this.getTransactionAmountError(amount);
    }

    if (amount && amount < 0) {
      throw this.getTransactionAmountError(amount);
    }

    if (!amount && !allowZero) {
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
    account,
    {
      context,
      checkCurrencyId,
      additionalCheck,
    }: {
      account?: AccountEntity | null;
      context?: string;
      checkCurrencyId?: ID;
      additionalCheck?: (account: AccountEntity) => boolean;
    }): AccountEntity {
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
  }: {
    manager: EntityManager;
    account: AccountEntity;
    amount: number;
  }): Promise<UpdateResult> {
    const { id, available, balance } = account;

    const formattedAmount = BigInt(amount);
    const creditAvailable = BigInt(available);
    const creditBalance = BigInt(balance);

    if (creditAvailable < formattedAmount) {
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
    creditId?: TransactionEntity['debitId'];
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