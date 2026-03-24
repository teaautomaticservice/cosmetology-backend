import {
  And,
  DataSource,
  EntityManager,
  FindOperator,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not
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
import { FoundAndCounted, Pagination, RecordEntity } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import {
  CreateOpenBalanceObligationTransaction,
  CreateTransaction,
  LentRepaymentTransaction,
  LentTransaction,
  LoanRepaymentTransaction,
  LoanTransaction,
  TransactionsFilter
} from './transactions.types';

type AccountBalance = {
  available: bigint;
  balance: bigint;
};

type SafeAccountView = Omit<AccountEntity, 'available' | 'balance'>;

interface CreateTransactionInput {
  operationType: OperationType;
  debitId?: TransactionEntity['debitId'];
  creditId?: TransactionEntity['creditId'];
  description?: TransactionEntity['description'];
  transactionId?: string;
  parentTransactionId?: string | null;
  amountAsString?: string;
}

interface TransactionContext {
  manager: EntityManager;
  amountAsBigInt: bigint;
  amountAsString: string;
  getAccount: (accountId?: AccountEntity['id'] | null) => SafeAccountView | null;
  registerAccount: (account: AccountEntity) => void;
  getCurrentBalance: (accountId: AccountEntity['id']) => AccountBalance;
  queueBalanceUpdate: (accountId: AccountEntity['id'], available: bigint, balance: bigint) => void;
  createTransaction: (data: CreateTransactionInput) => TransactionEntity;
}

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
      amount,
      debitId,
      creditId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Open Balance',
    });

    if (!debitId) {
      throw new InternalServerErrorException(`Open Balance create error. Account ${debitId} should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [debitId, creditId],
      execute: async ({
        amountAsBigInt,
        manager,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<TransactionEntity> => {
        const debitAccount = getAccount(debitId);
        const creditAccount = getAccount(creditId);

        if (!debitAccount) {
          throw new BadRequestException(`Debit account ${debitId} not found`);
        }

        if (debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} should be active`);
        }

        const debitBalance = getCurrentBalance(debitAccount.id);
        if (debitBalance.available !== 0n || debitBalance.balance !== 0n) {
          throw new BadRequestException(`Debit account ${debitId} should be empty`);
        }

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

        if (creditAccount) {
          if (creditAccount.status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(`Credit account ${creditId} should be active`);
          }

          if (debitAccount.currencyId !== creditAccount.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          const creditBalance = getCurrentBalance(creditAccount.id);
          if (creditBalance.available < amountAsBigInt) {
            throw new BadRequestException(
              `Insufficient funds. Available: ${creditBalance.available}, Required: ${amount}`
            );
          }

          queueBalanceUpdate(
            creditAccount.id,
            creditBalance.available - amountAsBigInt,
            creditBalance.balance - amountAsBigInt
          );
        }

        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );

        return createTransaction({
          debitId,
          creditId: creditId ?? null,
          operationType: OperationType.OPENING_BALANCE,
          description,
        });
      },
    });
  }

  public async openBalanceObligationTransaction({
    data,
  }: {
    data: CreateOpenBalanceObligationTransaction;
  }): Promise<TransactionEntity> {
    const {
      amount,
      obligationStorageId,
      description,
      debitName,
      currencyId,
    } = data;

    this.validateAmount({
      amount,
      context: 'Open Balance',
    });

    return this.buildTransaction({
      amount,
      accountIds: [],
      execute: async ({
        amountAsString,
        manager,
        createTransaction,
      }): Promise<TransactionEntity> => {
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

        const newObligationAccountData: RecordEntity<AccountEntity> = {
          name: debitName,
          moneyStorageId: obligationStorageId,
          status: AccountStatus.ACTIVE,
          balance: amountAsString,
          available: amountAsString,
          currencyId,
          description: 'Automatic create while opening balance for obligation storage',
        };

        const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
        await manager.save(newObligationAccount);

        return createTransaction({
          debitId: newObligationAccount.id,
          creditId: null,
          operationType: OperationType.OPENING_BALANCE,
          description,
        });
      },
    });
  }

  public async cashOutTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      amount,
      debitId,
      creditId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Cash Out',
    });

    if (!creditId) {
      throw new InternalServerErrorException(`Cash Out create error. Account ${creditId} should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [debitId, creditId],
      execute: async ({
        amountAsBigInt,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<TransactionEntity> => {
        const debitAccount = getAccount(debitId);
        const creditAccount = getAccount(creditId);

        if (!creditAccount) {
          throw new BadRequestException(`Credit account ${creditId} not found`);
        }

        if (creditAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Credit account ${creditId} should be active`);
        }

        const creditBalance = getCurrentBalance(creditAccount.id);
        if (creditBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
        }

        if (debitAccount) {
          if (debitAccount.status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(`Debit account ${debitId} should be active`);
          }

          if (debitAccount.currencyId !== creditAccount.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          const debitBalance = getCurrentBalance(debitAccount.id);
          queueBalanceUpdate(
            debitAccount.id,
            debitBalance.available + amountAsBigInt,
            debitBalance.balance + amountAsBigInt
          );
        }

        queueBalanceUpdate(
          creditAccount.id,
          creditBalance.available - amountAsBigInt,
          creditBalance.balance - amountAsBigInt
        );

        return createTransaction({
          debitId: debitId ?? null,
          creditId,
          operationType: OperationType.CASH_OUT,
          description,
        });
      },
    });
  }

  public async receiptTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      amount,
      debitId,
      creditId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Open Balance',
    });

    if (!debitId) {
      throw new InternalServerErrorException(`Open Balance create error. Account ${debitId} should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [debitId, creditId],
      execute: async ({
        amountAsBigInt,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<TransactionEntity> => {
        const debitAccount = getAccount(debitId);
        const creditAccount = getAccount(creditId);

        if (!debitAccount) {
          throw new BadRequestException(`Debit account ${debitId} not found`);
        }

        if (debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} should be active`);
        }

        const debitBalance = getCurrentBalance(debitAccount.id);

        if (creditAccount) {
          if (creditAccount.status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(`Credit account ${creditId} should be active`);
          }

          if (debitAccount.currencyId !== creditAccount.currencyId) {
            throw new BadRequestException('Accounts must have the same currency');
          }

          const creditBalance = getCurrentBalance(creditAccount.id);
          if (creditBalance.available < amountAsBigInt) {
            throw new BadRequestException(
              `Insufficient funds. Available: ${creditBalance.available}, Required: ${amount}`
            );
          }

          queueBalanceUpdate(
            creditAccount.id,
            creditBalance.available - amountAsBigInt,
            creditBalance.balance - amountAsBigInt
          );
        }

        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );

        return createTransaction({
          debitId,
          creditId: creditId ?? null,
          operationType: OperationType.RECEIPT,
          description,
        });
      },
    });
  }

  public async loanTransaction({
    data,
  }: {
    data: LoanTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      amount,
      debitId,
      creditId,
      obligationStorageId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Loan',
    });

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Loan create error. debitId and creditId and should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [debitId, creditId],
      execute: async ({
        amountAsBigInt,
        amountAsString,
        manager,
        getAccount,
        registerAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<[TransactionEntity, TransactionEntity]> => {
        const debitAccount = getAccount(debitId);
        const creditAccount = getAccount(creditId);

        if (!debitAccount || debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} not found or not active`);
        }

        if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Credit account ${creditId} not found or not active`);
        }

        if (debitAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        const obligationStorage = await manager
          .createQueryBuilder(MoneyStoragesEntity, 'moneyStorage')
          .where('moneyStorage.id = :id', { id: obligationStorageId })
          .getOne();

        if (!obligationStorage) {
          throw new BadRequestException(`Obligation storage ${obligationStorageId} not found`);
        }

        const creditBalance = getCurrentBalance(creditAccount.id);
        if (creditBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
        }

        const debitBalance = getCurrentBalance(debitAccount.id);
        const moveTransactionId = this.generateTransactionId();

        const transaction = createTransaction({
          transactionId: moveTransactionId,
          debitId,
          creditId,
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
          registerAccount(obligationAccount);

          if (obligationAccount.status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(`Obligation account ${obligationAccount.id} should be active`);
          }

          if (obligationAccount.currencyId !== creditAccount.currencyId) {
            throw new BadRequestException('Obligation account must have the same currency');
          }

          const obligationBalance = getCurrentBalance(obligationAccount.id);
          queueBalanceUpdate(
            obligationAccount.id,
            obligationBalance.available + amountAsBigInt,
            obligationBalance.balance + amountAsBigInt
          );
        } else {
          const newObligationAccountData: RecordEntity<AccountEntity> = {
            name: creditAccount.name,
            moneyStorageId: obligationStorageId,
            status: AccountStatus.ACTIVE,
            balance: amountAsString,
            available: amountAsString,
            currencyId: creditAccount.currencyId,
            description: 'Automatic create while taken loan',
          };

          const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
          await manager.save(newObligationAccount);
          obligationAccount = newObligationAccount;
        }

        const obligationTransaction = createTransaction({
          parentTransactionId: transaction.transactionId,
          debitId: obligationAccount.id,
          creditId: null,
          operationType: OperationType.LOAN,
          description,
        });

        queueBalanceUpdate(
          creditAccount.id,
          creditBalance.available - amountAsBigInt,
          creditBalance.balance - amountAsBigInt
        );
        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );

        return [transaction, obligationTransaction];
      },
    });
  }

  public async loanRepaymentTransaction({
    data,
  }: {
    data: LoanRepaymentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      amount,
      creditObligationAccountId,
      debitId,
      creditId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Loan Repayment',
    });

    if (!creditObligationAccountId || !creditId || !debitId) {
      throw new InternalServerErrorException(`Loan Repayment create error. creditObligationAccountId and creditId should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [creditObligationAccountId, creditId, debitId],
      execute: async ({
        amountAsBigInt,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<[TransactionEntity, TransactionEntity]> => {
        const creditObligationAccountAccount = getAccount(creditObligationAccountId);
        const creditAccount = getAccount(creditId);
        const debitAccount = getAccount(debitId);

        if (!creditObligationAccountAccount || creditObligationAccountAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(
            `Credit Obligation account ${creditObligationAccountId} not found or not active`
          );
        }

        if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Credit account ${creditId} not found or not active`);
        }

        if (!debitAccount || debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} not found or not active`);
        }

        if (
          creditObligationAccountAccount.currencyId !== creditAccount.currencyId ||
          creditObligationAccountAccount.currencyId !== debitAccount.currencyId
        ) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        const debitBalance = getCurrentBalance(debitAccount.id);
        const creditBalance = getCurrentBalance(creditAccount.id);
        const creditObligationBalance = getCurrentBalance(creditObligationAccountAccount.id);
        const moveTransactionId = this.generateTransactionId();

        if (creditBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
        }

        if (creditObligationBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the Obligation account ${creditObligationAccountId}`);
        }

        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );
        queueBalanceUpdate(
          creditAccount.id,
          creditBalance.available - amountAsBigInt,
          creditBalance.balance - amountAsBigInt
        );
        queueBalanceUpdate(
          creditObligationAccountAccount.id,
          creditObligationBalance.available - amountAsBigInt,
          creditObligationBalance.balance - amountAsBigInt
        );

        const transaction = createTransaction({
          transactionId: moveTransactionId,
          debitId,
          creditId,
          operationType: OperationType.LOAN_REPAYMENT,
          description,
        });

        const obligationTransaction = createTransaction({
          parentTransactionId: moveTransactionId,
          debitId: null,
          creditId: creditObligationAccountId,
          operationType: OperationType.LOAN_REPAYMENT,
          description,
        });

        return [transaction, obligationTransaction];
      },
    });
  }

  public async lentTransaction({
    data,
  }: {
    data: LentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      amount,
      creditId,
      creditObligationAccountId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Lent',
    });

    if (!creditId) {
      throw new InternalServerErrorException(`Lent create error. debitId and creditId and should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [creditId],
      execute: async ({
        amountAsBigInt,
        manager,
        getAccount,
        registerAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<[TransactionEntity, TransactionEntity]> => {
        const creditAccount = getAccount(creditId);

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

        const creditBalance = getCurrentBalance(creditAccount.id);
        if (creditBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
        }

        const moveTransactionId = this.generateTransactionId();
        const transaction = createTransaction({
          transactionId: moveTransactionId,
          creditId,
          operationType: OperationType.LENT,
          description,
        });

        let obligationAccount = await manager
          .createQueryBuilder(AccountEntity, 'account')
          .setLock('pessimistic_write')
          .where('LOWER(account.name) = LOWER(:name)', { name: creditAccount.name })
          .andWhere('account.moneyStorageId = :storageId', { storageId: creditObligationAccountId })
          .getOne();

        if (obligationAccount) {
          registerAccount(obligationAccount);

          if (obligationAccount.status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(`Obligation account ${obligationAccount.id} should be active`);
          }

          if (obligationAccount.currencyId !== creditAccount.currencyId) {
            throw new BadRequestException('Obligation account must have the same currency');
          }

          const obligationBalance = getCurrentBalance(obligationAccount.id);
          queueBalanceUpdate(
            obligationAccount.id,
            obligationBalance.available - amountAsBigInt,
            obligationBalance.balance - amountAsBigInt
          );
        } else {
          const negativeAmountAsString = (-amountAsBigInt).toString();
          const newObligationAccountData: RecordEntity<AccountEntity> = {
            name: creditAccount.name,
            moneyStorageId: creditObligationAccountId,
            status: AccountStatus.ACTIVE,
            balance: negativeAmountAsString,
            available: negativeAmountAsString,
            currencyId: creditAccount.currencyId,
            description: 'Automatic create while give lent',
          };

          const newObligationAccount = manager.create(AccountEntity, newObligationAccountData);
          await manager.save(newObligationAccount);
          obligationAccount = newObligationAccount;
        }

        const obligationTransaction = createTransaction({
          parentTransactionId: transaction.transactionId,
          debitId: null,
          creditId: obligationAccount.id,
          operationType: OperationType.LENT,
          description,
        });

        queueBalanceUpdate(
          creditAccount.id,
          creditBalance.available - amountAsBigInt,
          creditBalance.balance - amountAsBigInt
        );

        return [transaction, obligationTransaction];
      },
    });
  }

  public async lentRepaymentTransaction({
    data,
  }: {
    data: LentRepaymentTransaction;
  }): Promise<[TransactionEntity, TransactionEntity]> {
    const {
      amount,
      obligationAccountId,
      debitId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Lent Repayment',
    });

    if (!obligationAccountId || !debitId) {
      throw new InternalServerErrorException(`Lent Repayment create error. obligationAccountId and debitId should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [obligationAccountId, debitId],
      execute: async ({
        amountAsBigInt,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<[TransactionEntity, TransactionEntity]> => {
        const obligationAccount = getAccount(obligationAccountId);
        const debitAccount = getAccount(debitId);

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

        const debitBalance = getCurrentBalance(debitAccount.id);
        const obligationBalance = getCurrentBalance(obligationAccount.id);
        const moveTransactionId = this.generateTransactionId();

        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );
        queueBalanceUpdate(
          obligationAccount.id,
          obligationBalance.available + amountAsBigInt,
          obligationBalance.balance + amountAsBigInt
        );

        const transaction = createTransaction({
          transactionId: moveTransactionId,
          debitId,
          operationType: OperationType.LENT_REPAYMENT,
          description,
        });

        const obligationTransaction = createTransaction({
          parentTransactionId: moveTransactionId,
          debitId: obligationAccountId,
          creditId: null,
          operationType: OperationType.LENT_REPAYMENT,
          description,
        });

        return [transaction, obligationTransaction];
      },
    });
  }

  public async transferTransaction({
    data,
  }: {
    data: CreateTransaction;
  }): Promise<TransactionEntity> {
    const {
      amount,
      debitId,
      creditId,
      description,
    } = data;

    this.validateAmount({
      amount,
      context: 'Transfer',
      allowZero: false,
    });

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Transfer create error. debitId and creditId and should be exist`);
    }

    return this.buildTransaction({
      amount,
      accountIds: [debitId, creditId],
      execute: async ({
        amountAsBigInt,
        getAccount,
        getCurrentBalance,
        queueBalanceUpdate,
        createTransaction,
      }): Promise<TransactionEntity> => {
        const debitAccount = getAccount(debitId);
        const creditAccount = getAccount(creditId);

        if (!debitAccount || debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} not found or not active`);
        }

        if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Credit account ${creditId} not found or not active`);
        }

        if (debitAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        const creditBalance = getCurrentBalance(creditAccount.id);
        if (creditBalance.available < amountAsBigInt) {
          throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
        }

        const debitBalance = getCurrentBalance(debitAccount.id);
        queueBalanceUpdate(
          creditAccount.id,
          creditBalance.available - amountAsBigInt,
          creditBalance.balance - amountAsBigInt
        );
        queueBalanceUpdate(
          debitAccount.id,
          debitBalance.available + amountAsBigInt,
          debitBalance.balance + amountAsBigInt
        );

        return createTransaction({
          debitId,
          creditId,
          operationType: OperationType.TRANSFER,
          description,
        });
      },
    });
  }

  private validateAmount({
    amount,
    context,
    allowZero = true,
  }: {
    amount: number;
    context: string;
    allowZero?: boolean;
  }): void {
    const isInvalid = Number.isNaN(amount) || (allowZero ? amount < 0 : amount <= 0);

    if (isInvalid) {
      throw new InternalServerErrorException(`${context} create error. Amount ${amount} isn't correct`);
    }
  }

  private async buildTransaction<TResult>({
    amount,
    accountIds,
    execute,
  }: {
    amount: number;
    accountIds: Array<AccountEntity['id'] | null | undefined>;
    execute: (context: TransactionContext) => Promise<TResult>;
  }): Promise<TResult> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await this.getAccountsForUpdate({
        manager,
        accountIds,
      });

      const accountMap = new Map<AccountEntity['id'], AccountEntity>();
      for (const account of accounts) {
        accountMap.set(account.id, account);
      }

      const queuedBalances = new Map<AccountEntity['id'], AccountBalance>();
      const queuedTransactions: TransactionEntity[] = [];
      const amountAsBigInt = BigInt(amount);
      const amountAsString = amountAsBigInt.toString();

      const result = await execute({
        manager,
        amountAsBigInt,
        amountAsString,
        getAccount: (accountId?: AccountEntity['id'] | null): SafeAccountView | null => {
          if (accountId === null || accountId === undefined) {
            return null;
          }

          return accountMap.get(accountId) ?? null;
        },
        registerAccount: (account: AccountEntity): void => {
          accountMap.set(account.id, account);
        },
        getCurrentBalance: (accountId: AccountEntity['id']): AccountBalance => {
          const queued = queuedBalances.get(accountId);
          if (queued) {
            return queued;
          }

          const account = accountMap.get(accountId);
          if (!account) {
            throw new InternalServerErrorException(
              `Account ${accountId} not registered for balance tracking`
            );
          }

          return {
            available: BigInt(account.available),
            balance: BigInt(account.balance),
          };
        },
        queueBalanceUpdate: (
          accountId: AccountEntity['id'],
          available: bigint,
          balance: bigint
        ): void => {
          if (!accountMap.has(accountId)) {
            throw new InternalServerErrorException(
              `Cannot update balance for unregistered account ${accountId}`
            );
          }

          queuedBalances.set(accountId, { available, balance });
        },
        createTransaction: ({
          operationType,
          debitId,
          creditId,
          description,
          transactionId,
          parentTransactionId,
          amountAsString: transactionAmountAsString = amountAsString,
        }): TransactionEntity => {
          const transaction = manager.create(TransactionEntity, {
            transactionId: transactionId ?? this.generateTransactionId(),
            parentTransactionId: parentTransactionId ?? null,
            amount: transactionAmountAsString,
            debitId: debitId ?? null,
            creditId: creditId ?? null,
            status: TransactionStatus.COMPLETED,
            operationType,
            executionDate: new Date(),
            description: description ?? null,
          });

          queuedTransactions.push(transaction);
          return transaction;
        },
      });

      await Promise.all([
        ...([...queuedBalances.entries()].map(([accountId, bal]) =>
          manager.update(AccountEntity, accountId, {
            available: bal.available.toString(),
            balance: bal.balance.toString(),
          })
        )),
        ...queuedTransactions.map((transaction) => manager.save(transaction)),
      ]);

      return result;
    });
  }

  private async getAccountsForUpdate({
    manager,
    accountIds,
  }: {
    manager: EntityManager;
    accountIds: Array<AccountEntity['id'] | null | undefined>;
  }): Promise<AccountEntity[]> {
    const ids = [...new Set(accountIds.filter((id): id is AccountEntity['id'] => id !== null && id !== undefined))];

    if (!ids.length) {
      return [];
    }

    return manager
      .createQueryBuilder(AccountEntity, 'account')
      .setLock('pessimistic_write')
      .where('account.id IN (:...ids)', { ids })
      .getMany();
  }

  private generateTransactionId(): string {
    const year = new Date().getFullYear();
    const additionalId = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TXN-${year}-${timestamp}${additionalId}`;
  }
}