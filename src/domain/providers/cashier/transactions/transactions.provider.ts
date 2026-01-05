import { DataSource, EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { FoundAndCounted, RecordEntity } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import {
  CreateOpenBalanceObligationTransaction,
  CreateTransaction,
  LoanRepaymentTransaction,
  LoanTransaction
} from './transactions.types';

@Injectable()
export class TransactionsProvider extends CommonPostgresqlProvider<TransactionEntity> {
  constructor(
    private readonly transactionsDb: TransactionsDb,
    private readonly dataSource: DataSource,
  ) {
    super(transactionsDb);
  }

  public async getTransactionsList(): Promise<FoundAndCounted<TransactionEntity>> {
    return super.findAndCount({
      pagination: {
        page: 1,
        pageSize: 10,
      },
      relations: ['debitAccount', 'creditAccount']
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

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Open Balance create error. Amount ${amount} isn't correct`);
    }

    if (!debitId) {
      throw new InternalServerErrorException(`Open Balance create error. Account ${debitId} should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [debitId, creditId].filter(Boolean)
        })
        .getMany();

      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!debitAccount) {
        throw new BadRequestException(`Debit account ${debitId} not found`);
      }

      if (debitAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Debit account ${debitId} should be active`);
      }

      const formattedAmount = BigInt(amount);
      const debitAvailable = BigInt(debitAccount.available);
      const debitBalance = BigInt(debitAccount.balance);

      if (debitAvailable !== 0n || debitBalance !== 0n) {
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

        const creditAvailable = BigInt(creditAccount.available);
        const creditBalance = BigInt(creditAccount.balance);

        if (creditAvailable < formattedAmount) {
          throw new BadRequestException(
            `Insufficient funds. Available: ${creditAccount.available}, Required: ${amount}`
          );
        }

        const newCreditAvailable = creditAvailable - formattedAmount;
        const newCreditBalance = creditBalance - formattedAmount;

        await manager.update(AccountEntity, creditId, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        });
      }

      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;

      await manager.update(AccountEntity, debitId, {
        available: newDebitAvailable.toString(),
        balance: newDebitBalance.toString(),
      });

      const transaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        amount: formattedAmount.toString(),
        debitId: debitId,
        creditId: creditId ?? null,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.OPENING_BALANCE,
        executionDate: new Date(),
        description: description ?? null,
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
      amount,
      obligationStorageId,
      description,
      debitName,
      currencyId,
    } = data;

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Open Balance create error. Amount ${amount} isn't correct`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
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

      const transaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        amount: formattedAmount.toString(),
        debitId: newObligationAccount.id,
        creditId: null,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.OPENING_BALANCE,
        executionDate: new Date(),
        description: description ?? null,
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
      amount,
      debitId,
      creditId,
      description,
    } = data;

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Cash Out create error. Amount ${amount} isn't correct`);
    }

    if (!creditId) {
      throw new InternalServerErrorException(`Cash Out create error. Account ${creditId} should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [debitId, creditId].filter(Boolean)
        })
        .getMany();

      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!creditAccount) {
        throw new BadRequestException(`Credit account ${creditId} not found`);
      }

      if (creditAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Credit account ${creditId} should be active`);
      }

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditBalance = BigInt(creditAccount.balance);

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      if (debitAccount) {
        if (debitAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Debit account ${debitId} should be active`);
        }

        if (debitAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        const debitAvailable = BigInt(debitAccount.available);
        const debitBalance = BigInt(debitAccount.balance);

        const newDebitAvailable = debitAvailable + formattedAmount;
        const newDebitBalance = debitBalance + formattedAmount;

        await manager.update(AccountEntity, debitId, {
          available: newDebitAvailable.toString(),
          balance: newDebitBalance.toString(),
        });
      }

      const newCreditAvailable = creditAvailable - formattedAmount;
      const newCreditBalance = creditBalance - formattedAmount;

      await manager.update(AccountEntity, creditId, {
        available: newCreditAvailable.toString(),
        balance: newCreditBalance.toString(),
      });

      const transaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        amount: formattedAmount.toString(),
        debitId: debitId ?? null,
        creditId: creditId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.CASH_OUT,
        executionDate: new Date(),
        description: description ?? null,
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
      amount,
      debitId,
      creditId,
      description,
    } = data;

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Open Balance create error. Amount ${amount} isn't correct`);
    }

    if (!debitId) {
      throw new InternalServerErrorException(`Open Balance create error. Account ${debitId} should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [debitId, creditId].filter(Boolean)
        })
        .getMany();

      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!debitAccount) {
        throw new BadRequestException(`Debit account ${debitId} not found`);
      }

      if (debitAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Debit account ${debitId} should be active`);
      }

      const formattedAmount = BigInt(amount);
      const debitAvailable = BigInt(debitAccount.available);
      const debitBalance = BigInt(debitAccount.balance);

      if (creditAccount) {
        if (creditAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Credit account ${creditId} should be active`);
        }

        if (debitAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        const creditAvailable = BigInt(creditAccount.available);
        const creditBalance = BigInt(creditAccount.balance);

        if (creditAvailable < formattedAmount) {
          throw new BadRequestException(
            `Insufficient funds. Available: ${creditAccount.available}, Required: ${amount}`
          );
        }

        const newCreditAvailable = creditAvailable - formattedAmount;
        const newCreditBalance = creditBalance - formattedAmount;

        await manager.update(AccountEntity, creditId, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        });
      }

      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;

      await manager.update(AccountEntity, debitId, {
        available: newDebitAvailable.toString(),
        balance: newDebitBalance.toString(),
      });

      const transaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        amount: formattedAmount.toString(),
        debitId: debitId,
        creditId: creditId ?? null,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.RECEIPT,
        executionDate: new Date(),
        description: description ?? null,
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
      amount,
      debitId,
      creditId,
      obligationStorageId,
      description,
    } = data;

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Loan create error. Amount ${amount} isn't correct`);
    }

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Loan create error. debitId and creditId and should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [debitId, creditId].filter(Boolean)
        })
        .getMany();

      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

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

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditBalance = BigInt(creditAccount.balance);
      const debitAvailable = BigInt(debitAccount.available);
      const debitBalance = BigInt(debitAccount.balance);
      const moveTransactionId = this.generateTransactionId();

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      const transaction = manager.create(TransactionEntity, {
        transactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        debitId: debitId,
        creditId: creditId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LOAN,
        executionDate: new Date(),
        description: description ?? null,
      });

      let obligationAccount = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('LOWER(account.name) = LOWER(:name)', { name: creditAccount.name })
        .andWhere('account.moneyStorageId = :storageId', { storageId: obligationStorageId })
        .getOne();

      if (obligationAccount) {
        if (obligationAccount.status !== AccountStatus.ACTIVE) {
          throw new BadRequestException(`Obligation account ${obligationAccount.id} should be active`);
        }

        if (obligationAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Obligation account must have the same currency');
        }

        const newObligationAvailable = BigInt(obligationAccount.available) + formattedAmount;
        const newObligationBalance = BigInt(obligationAccount.balance) + formattedAmount;

        await manager.update(AccountEntity, obligationAccount.id, {
          available: newObligationAvailable.toString(),
          balance: newObligationBalance.toString(),
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

      const obligationTransaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        parentTransactionId: transaction.transactionId,
        amount: formattedAmount.toString(),
        debitId: obligationAccount.id,
        creditId: null,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LOAN,
        executionDate: new Date(),
        description: description ?? null,
      });

      const newCreditAvailable = creditAvailable - formattedAmount;
      const newCreditBalance = creditBalance - formattedAmount;
      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;

      await Promise.all([
        manager.update(AccountEntity, creditId, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        }),
        manager.update(AccountEntity, debitId, {
          available: newDebitAvailable.toString(),
          balance: newDebitBalance.toString(),
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
      amount,
      creditObligationAccountId,
      creditId,
      description,
    } = data;

    if (Number.isNaN(amount) || amount < 0) {
      throw new InternalServerErrorException(`Loan Repayment create error. Amount ${amount} isn't correct`);
    }

    if (!creditObligationAccountId || !creditId) {
      throw new InternalServerErrorException(`Loan Repayment create error. creditObligationAccountId and creditId should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [creditObligationAccountId, creditId].filter(Boolean)
        })
        .getMany();

      const creditObligationAccountAccount = accounts.find(({ id }) => id === creditObligationAccountId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!creditObligationAccountAccount || creditObligationAccountAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(
          `Credit Obligation account ${creditObligationAccountId} not found or not active`
        );
      }

      if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Credit account ${creditId} not found or not active`);
      }

      if (creditObligationAccountAccount.currencyId !== creditAccount.currencyId) {
        throw new BadRequestException('Accounts must have the same currency');
      }

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditBalance = BigInt(creditAccount.balance);
      const creditObligationAvailable = BigInt(creditObligationAccountAccount.available);
      const creditObligationBalance = BigInt(creditObligationAccountAccount.balance);
      const moveTransactionId = this.generateTransactionId();

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      if (creditObligationAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the Obligation account ${creditObligationAccountId}`);
      }

      const newCreditAvailable = creditAvailable - formattedAmount;
      const newCreditBalance = creditBalance - formattedAmount;
      const newCreditObligationAvailable = creditObligationAvailable - formattedAmount;
      const newCreditObligationBalance = creditObligationBalance - formattedAmount;

      await Promise.all([
        manager.update(AccountEntity, creditId, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        }),
        manager.update(AccountEntity, creditObligationAccountId, {
          available: newCreditObligationAvailable.toString(),
          balance: newCreditObligationBalance.toString(),
        }),
      ]);

      const transaction = manager.create(TransactionEntity, {
        transactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        debitId: null,
        creditId: creditId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LOAN_REPAYMENT,
        executionDate: new Date(),
        description: description ?? null,
      });

      const obligationTransaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        parentTransactionId: moveTransactionId,
        amount: formattedAmount.toString(),
        debitId: null,
        creditId: creditObligationAccountId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.LOAN_REPAYMENT,
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
      amount,
      debitId,
      creditId,
      description,
    } = data;

    if (Number.isNaN(amount) || amount <= 0) {
      throw new InternalServerErrorException(`Transfer create error. Amount ${amount} isn't correct`);
    }

    if (!debitId || !creditId) {
      throw new InternalServerErrorException(`Transfer create error. debitId and creditId and should be exist`);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const accounts = await manager
        .createQueryBuilder(AccountEntity, 'account')
        .setLock('pessimistic_write')
        .where('account.id IN (:...ids)', {
          ids: [debitId, creditId].filter(Boolean)
        })
        .getMany();

      const debitAccount = accounts.find(({ id }) => id === debitId) ?? null;
      const creditAccount = accounts.find(({ id }) => id === creditId) ?? null;

      if (!debitAccount || debitAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Debit account ${debitId} not found or not active`);
      }

      if (!creditAccount || creditAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(`Credit account ${creditId} not found or not active`);
      }

      if (debitAccount.currencyId !== creditAccount.currencyId) {
        throw new BadRequestException('Accounts must have the same currency');
      }

      const formattedAmount = BigInt(amount);
      const creditAvailable = BigInt(creditAccount.available);
      const creditBalance = BigInt(creditAccount.balance);
      const debitAvailable = BigInt(debitAccount.available);
      const debitBalance = BigInt(debitAccount.balance);

      if (creditAvailable < formattedAmount) {
        throw new BadRequestException(`Insufficient funds in the account ${creditId}`);
      }

      const newCreditAvailable = creditAvailable - formattedAmount;
      const newCreditBalance = creditBalance - formattedAmount;
      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;

      await Promise.all([
        manager.update(AccountEntity, creditId, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        }),
        manager.update(AccountEntity, debitId, {
          available: newDebitAvailable.toString(),
          balance: newDebitBalance.toString(),
        }),
      ]);

      const transaction = manager.create(TransactionEntity, {
        transactionId: this.generateTransactionId(),
        amount: formattedAmount.toString(),
        debitId: debitId,
        creditId: creditId,
        status: TransactionStatus.COMPLETED,
        operationType: OperationType.TRANSFER,
        executionDate: new Date(),
        description: description ?? null,
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
}