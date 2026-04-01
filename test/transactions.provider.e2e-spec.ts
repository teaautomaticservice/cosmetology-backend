import { DataSource, Repository } from 'typeorm';

import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@postgresql/repositories/cashier/currencies/currencies.types';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus,
  MoneyStorageType
} from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { TransactionsProvider } from '@providers/cashier/transactions/transactions.provider';

import { TestDatabase } from './utils/test-database';

const ENTITIES = [TransactionEntity, AccountEntity, CurrencyEntity, MoneyStoragesEntity];
const TABLES = ['transaction', 'accounts', 'money_storages', 'currencies'];

describe('TransactionsProvider (integration)', () => {
  jest.setTimeout(120_000);

  const testDb = new TestDatabase();
  let module: TestingModule;
  let provider: TransactionsProvider;
  let dataSource: DataSource;
  let accountRepo: Repository<AccountEntity>;
  let currency: CurrencyEntity;
  let storage: MoneyStoragesEntity;
  let obligationStorage: MoneyStoragesEntity;

  beforeAll(async () => {
    await testDb.start();

    module = await Test.createTestingModule({
      imports: [
        testDb.getTypeOrmModule(ENTITIES),
        TypeOrmModule.forFeature([TransactionEntity]),
      ],
      providers: [
        TransactionsDb,
        TransactionsProvider,
        ...TestDatabase.getMockProviders(),
      ],
    }).compile();

    provider = module.get(TransactionsProvider);
    dataSource = module.get(DataSource);
    accountRepo = dataSource.getRepository(AccountEntity);
  });

  afterAll(async () => {
    await module?.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    await TestDatabase.truncate(dataSource, TABLES);

    currency = await dataSource.getRepository(CurrencyEntity).save({
      name: 'US Dollar',
      status: CurrencyStatus.ACTIVE,
      code: 'USD',
    });

    storage = await dataSource.getRepository(MoneyStoragesEntity).save({
      name: 'Main Storage',
      status: MoneyStorageStatus.ACTIVE,
      code: 'MAIN',
      type: MoneyStorageType.COMMON,
    });

    obligationStorage = await dataSource.getRepository(MoneyStoragesEntity).save({
      name: 'Obligation Storage',
      status: MoneyStorageStatus.ACTIVE,
      code: 'OBLIG',
      type: MoneyStorageType.OBLIGATION,
    });
  });

  let accountCounter = 0;

  const createAccount = async (overrides: Partial<AccountEntity> = {}): Promise<AccountEntity> => {
    accountCounter++;
    return accountRepo.save({
      name: `Account-${accountCounter}-${Date.now()}`,
      moneyStorageId: storage.id,
      status: AccountStatus.ACTIVE,
      currencyId: currency.id,
      balance: '0',
      available: '0',
      ...overrides,
    });
  };

  const getAccount = async (id: number): Promise<AccountEntity> => {
    return accountRepo.findOneOrFail({ where: { id } });
  };

  // ─── openBalanceTransaction ───────────────────────────────────

  describe('openBalanceTransaction', () => {
    it('should create opening balance for debit account without credit', async () => {
      const debitAccount = await createAccount();

      const result = await provider.openBalanceTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: null,
          description: 'Initial balance',
        },
      });

      expect(result.operationType).toBe(OperationType.OPENING_BALANCE);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('10000');
      expect(result.debitId).toBe(debitAccount.id);
      expect(result.creditId).toBeNull();
      expect(result.transactionId).toMatch(/^TXN-/);
      expect(result.executionDate).toBeInstanceOf(Date);

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('10000');
      expect(updatedDebit.available).toBe('10000');
    });

    it('should create opening balance with credit account and deduct from it', async () => {
      const creditAccount = await createAccount({
        balance: '50000',
        available: '50000',
      });
      const debitAccount = await createAccount();

      const result = await provider.openBalanceTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Balance from credit',
        },
      });

      expect(result.amount).toBe('10000');
      expect(result.creditId).toBe(creditAccount.id);

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('10000');
      expect(updatedDebit.available).toBe('10000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('40000');
      expect(updatedCredit.available).toBe('40000');
    });

    it('should throw when debit account is not found', async () => {
      await expect(
        provider.openBalanceTransaction({
          data: { amount: 100, debitId: 999999, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when debit account is not active', async () => {
      const debitAccount = await createAccount({ status: AccountStatus.FREEZED });

      await expect(
        provider.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when debit account is not empty', async () => {
      const debitAccount = await createAccount({ balance: '5000', available: '5000' });

      await expect(
        provider.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit account has insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });
      const debitAccount = await createAccount();

      await expect(
        provider.openBalanceTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when accounts have different currencies', async () => {
      const anotherCurrency = await dataSource.getRepository(CurrencyEntity).save({
        name: 'Euro',
        status: CurrencyStatus.ACTIVE,
        code: 'EUR',
      });

      const creditAccount = await createAccount({
        currencyId: anotherCurrency.id,
        balance: '50000',
        available: '50000',
      });
      const debitAccount = await createAccount();

      await expect(
        provider.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when last debit transaction is not CLOSING_BALANCE', async () => {
      const debitAccount = await createAccount();

      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: debitAccount.id, creditId: null, description: null },
      });

      await accountRepo.update(debitAccount.id, { balance: '0', available: '0' });

      await expect(
        provider.openBalanceTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── openBalanceObligationTransaction ─────────────────────────

  describe('openBalanceObligationTransaction', () => {
    it('should create new obligation account with opening balance', async () => {
      const result = await provider.openBalanceObligationTransaction({
        data: {
          amount: 15000,
          obligationStorageId: obligationStorage.id,
          debitName: 'New Obligation',
          currencyId: currency.id,
          description: 'Opening obligation balance',
        },
      });

      expect(result.operationType).toBe(OperationType.OPENING_BALANCE);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('15000');
      expect(result.creditId).toBeNull();

      const obligationAccount = await getAccount(result.debitId as number);
      expect(obligationAccount.name).toBe('New Obligation');
      expect(obligationAccount.balance).toBe('15000');
      expect(obligationAccount.available).toBe('15000');
      expect(obligationAccount.moneyStorageId).toBe(obligationStorage.id);
    });

    it('should throw when obligation account with same name already exists', async () => {
      await provider.openBalanceObligationTransaction({
        data: {
          amount: 10000,
          obligationStorageId: obligationStorage.id,
          debitName: 'Duplicate',
          currencyId: currency.id,
          description: null,
        },
      });

      await expect(
        provider.openBalanceObligationTransaction({
          data: {
            amount: 5000,
            obligationStorageId: obligationStorage.id,
            debitName: 'Duplicate',
            currencyId: currency.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when obligation storage not found', async () => {
      await expect(
        provider.openBalanceObligationTransaction({
          data: {
            amount: 10000,
            obligationStorageId: 999999,
            debitName: 'Test',
            currencyId: currency.id,
            description: null,
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when currency not found', async () => {
      await expect(
        provider.openBalanceObligationTransaction({
          data: {
            amount: 10000,
            obligationStorageId: obligationStorage.id,
            debitName: 'Test',
            currencyId: 999999,
            description: null,
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── cashOutTransaction ───────────────────────────────────────

  describe('cashOutTransaction', () => {
    it('should deduct from credit and add to debit', async () => {
      const creditAccount = await createAccount({ balance: '50000', available: '50000' });
      const debitAccount = await createAccount();

      const result = await provider.cashOutTransaction({
        data: {
          amount: 15000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Cash withdrawal',
        },
      });

      expect(result.operationType).toBe(OperationType.CASH_OUT);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('15000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('35000');
      expect(updatedCredit.available).toBe('35000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');
    });

    it('should work without debit account (cash out to nowhere)', async () => {
      const creditAccount = await createAccount({ balance: '50000', available: '50000' });

      const result = await provider.cashOutTransaction({
        data: {
          amount: 10000,
          debitId: null,
          creditId: creditAccount.id,
          description: 'Cash out without debit',
        },
      });

      expect(result.operationType).toBe(OperationType.CASH_OUT);
      expect(result.debitId).toBeNull();

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('40000');
      expect(updatedCredit.available).toBe('40000');
    });

    it('should throw when credit account has insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        provider.cashOutTransaction({
          data: { amount: 500, debitId: null, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit account is not active', async () => {
      const creditAccount = await createAccount({
        balance: '50000',
        available: '50000',
        status: AccountStatus.DEACTIVATED,
      });

      await expect(
        provider.cashOutTransaction({
          data: { amount: 100, debitId: null, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── receiptTransaction ───────────────────────────────────────

  describe('receiptTransaction', () => {
    it('should add to debit account without credit', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });

      const result = await provider.receiptTransaction({
        data: {
          amount: 5000,
          debitId: debitAccount.id,
          creditId: null,
          description: 'Payment received',
        },
      });

      expect(result.operationType).toBe(OperationType.RECEIPT);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('5000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');
    });

    it('should add to debit and deduct from credit', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });
      const creditAccount = await createAccount({ balance: '20000', available: '20000' });

      const result = await provider.receiptTransaction({
        data: {
          amount: 5000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Transfer receipt',
        },
      });

      expect(result.operationType).toBe(OperationType.RECEIPT);

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('15000');
      expect(updatedCredit.available).toBe('15000');
    });

    it('should throw when debit account not found', async () => {
      await expect(
        provider.receiptTransaction({
          data: { amount: 100, debitId: 999999, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit has insufficient funds', async () => {
      const debitAccount = await createAccount();
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        provider.receiptTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── transferTransaction ──────────────────────────────────────

  describe('transferTransaction', () => {
    it('should transfer funds between two accounts', async () => {
      const creditAccount = await createAccount({ balance: '30000', available: '30000' });
      const debitAccount = await createAccount();

      const result = await provider.transferTransaction({
        data: {
          amount: 12000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Internal transfer',
        },
      });

      expect(result.operationType).toBe(OperationType.TRANSFER);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('12000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('18000');
      expect(updatedCredit.available).toBe('18000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('12000');
      expect(updatedDebit.available).toBe('12000');
    });

    it('should throw when insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });
      const debitAccount = await createAccount();

      await expect(
        provider.transferTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is zero', async () => {
      const creditAccount = await createAccount({ balance: '30000', available: '30000' });
      const debitAccount = await createAccount();

      await expect(
        provider.transferTransaction({
          data: { amount: 0, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when accounts have different currencies', async () => {
      const eur = await dataSource.getRepository(CurrencyEntity).save({
        name: 'Euro',
        status: CurrencyStatus.ACTIVE,
        code: 'EUR',
      });

      const creditAccount = await createAccount({ balance: '30000', available: '30000' });
      const debitAccount = await createAccount({ currencyId: eur.id });

      await expect(
        provider.transferTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── loanTransaction ──────────────────────────────────────────

  describe('loanTransaction', () => {
    it('should create loan and a new obligation account', async () => {
      const creditAccount = await createAccount({
        name: 'John Doe',
        balance: '100000',
        available: '100000',
      });
      const debitAccount = await createAccount();

      const [mainTx, obligationTx] = await provider.loanTransaction({
        data: {
          amount: 25000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Loan from John',
        },
      });

      expect(mainTx.operationType).toBe(OperationType.LOAN);
      expect(mainTx.status).toBe(TransactionStatus.COMPLETED);
      expect(mainTx.amount).toBe('25000');
      expect(mainTx.debitId).toBe(debitAccount.id);
      expect(mainTx.creditId).toBe(creditAccount.id);

      expect(obligationTx.operationType).toBe(OperationType.LOAN);
      expect(obligationTx.parentTransactionId).toBe(mainTx.transactionId);
      expect(obligationTx.creditId).toBeNull();

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('75000');
      expect(updatedCredit.available).toBe('75000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('25000');
      expect(updatedDebit.available).toBe('25000');

      const obligationAccount = await getAccount(obligationTx.debitId as number);
      expect(obligationAccount.name).toBe('John Doe');
      expect(obligationAccount.moneyStorageId).toBe(obligationStorage.id);
      expect(obligationAccount.balance).toBe('25000');
      expect(obligationAccount.available).toBe('25000');
    });

    it('should add to existing obligation account on second loan', async () => {
      const creditAccount = await createAccount({
        name: 'Jane Doe',
        balance: '200000',
        available: '200000',
      });
      const debitAccount = await createAccount();

      const [, firstObligationTx] = await provider.loanTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'First loan',
        },
      });

      const [, secondObligationTx] = await provider.loanTransaction({
        data: {
          amount: 15000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Second loan',
        },
      });

      expect(secondObligationTx.debitId).toBe(firstObligationTx.debitId);

      const obligationAccount = await getAccount(secondObligationTx.debitId as number);
      expect(obligationAccount.balance).toBe('25000');
      expect(obligationAccount.available).toBe('25000');
    });

    it('should throw when insufficient funds in credit account', async () => {
      const creditAccount = await createAccount({
        name: 'Poor Lender',
        balance: '100',
        available: '100',
      });
      const debitAccount = await createAccount();

      await expect(
        provider.loanTransaction({
          data: {
            amount: 500,
            debitId: debitAccount.id,
            creditId: creditAccount.id,
            obligationStorageId: obligationStorage.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── loanRepaymentTransaction ─────────────────────────────────

  describe('loanRepaymentTransaction', () => {
    it('should repay loan and reduce obligation', async () => {
      const lenderAccount = await createAccount({
        name: 'Lender',
        balance: '100000',
        available: '100000',
      });
      const borrowerAccount = await createAccount({ name: 'Borrower' });

      const [, obligationTx] = await provider.loanTransaction({
        data: {
          amount: 30000,
          debitId: borrowerAccount.id,
          creditId: lenderAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Initial loan',
        },
      });

      const obligationAccountId = obligationTx.debitId as number;

      const [repayTx, repayObligationTx] = await provider.loanRepaymentTransaction({
        data: {
          amount: 10000,
          creditObligationAccountId: obligationAccountId,
          debitId: lenderAccount.id,
          creditId: borrowerAccount.id,
          description: 'Partial repayment',
        },
      });

      expect(repayTx.operationType).toBe(OperationType.LOAN_REPAYMENT);
      expect(repayTx.status).toBe(TransactionStatus.COMPLETED);
      expect(repayObligationTx.parentTransactionId).toBe(repayTx.transactionId);
      expect(repayObligationTx.creditId).toBe(obligationAccountId);

      const updatedObligation = await getAccount(obligationAccountId);
      expect(updatedObligation.balance).toBe('20000');
      expect(updatedObligation.available).toBe('20000');

      const updatedBorrower = await getAccount(borrowerAccount.id);
      expect(updatedBorrower.balance).toBe('20000');
      expect(updatedBorrower.available).toBe('20000');

      const updatedLender = await getAccount(lenderAccount.id);
      expect(updatedLender.balance).toBe('80000');
      expect(updatedLender.available).toBe('80000');
    });

    it('should throw when borrower has insufficient funds for repayment', async () => {
      const lenderAccount = await createAccount({
        name: 'Lender2',
        balance: '100000',
        available: '100000',
      });
      const borrowerAccount = await createAccount({ name: 'Borrower2' });

      const [, obligationTx] = await provider.loanTransaction({
        data: {
          amount: 30000,
          debitId: borrowerAccount.id,
          creditId: lenderAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Loan',
        },
      });

      await accountRepo.update(borrowerAccount.id, { balance: '5000', available: '5000' });

      await expect(
        provider.loanRepaymentTransaction({
          data: {
            amount: 10000,
            creditObligationAccountId: obligationTx.debitId as number,
            debitId: lenderAccount.id,
            creditId: borrowerAccount.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── lentTransaction ──────────────────────────────────────────

  describe('lentTransaction', () => {
    it('should create lent and a negative obligation account', async () => {
      const creditAccount = await createAccount({
        name: 'My Account',
        balance: '50000',
        available: '50000',
      });

      const [mainTx, obligationTx] = await provider.lentTransaction({
        data: {
          amount: 20000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent to friend',
        },
      });

      expect(mainTx.operationType).toBe(OperationType.LENT);
      expect(mainTx.status).toBe(TransactionStatus.COMPLETED);
      expect(mainTx.amount).toBe('20000');
      expect(obligationTx.operationType).toBe(OperationType.LENT);
      expect(obligationTx.parentTransactionId).toBe(mainTx.transactionId);

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('30000');
      expect(updatedCredit.available).toBe('30000');

      const obligationAccount = await getAccount(obligationTx.creditId as number);
      expect(obligationAccount.name).toBe('My Account');
      expect(obligationAccount.balance).toBe('-20000');
      expect(obligationAccount.available).toBe('-20000');
    });

    it('should add to existing obligation on second lent', async () => {
      const creditAccount = await createAccount({
        name: 'Lender Account',
        balance: '100000',
        available: '100000',
      });

      const [, firstObligationTx] = await provider.lentTransaction({
        data: {
          amount: 10000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'First lent',
        },
      });

      const [, secondObligationTx] = await provider.lentTransaction({
        data: {
          amount: 15000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Second lent',
        },
      });

      expect(secondObligationTx.creditId).toBe(firstObligationTx.creditId);

      const obligationAccount = await getAccount(secondObligationTx.creditId as number);
      expect(obligationAccount.balance).toBe('-25000');
      expect(obligationAccount.available).toBe('-25000');
    });

    it('should throw when insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        provider.lentTransaction({
          data: {
            amount: 500,
            creditId: creditAccount.id,
            creditObligationStorageId: obligationStorage.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── lentRepaymentTransaction ─────────────────────────────────

  describe('lentRepaymentTransaction', () => {
    it('should repay lent and increase obligation balance towards zero', async () => {
      const creditAccount = await createAccount({
        name: 'Lender Acc',
        balance: '50000',
        available: '50000',
      });

      const [, lentObligationTx] = await provider.lentTransaction({
        data: {
          amount: 20000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent',
        },
      });

      const obligationAccountId = lentObligationTx.creditId as number;

      const debitAccount = await createAccount();

      const [repayTx, repayObligationTx] = await provider.lentRepaymentTransaction({
        data: {
          amount: 10000,
          obligationAccountId,
          debitId: debitAccount.id,
          description: 'Partial lent repayment',
        },
      });

      expect(repayTx.operationType).toBe(OperationType.LENT_REPAYMENT);
      expect(repayTx.status).toBe(TransactionStatus.COMPLETED);
      expect(repayObligationTx.parentTransactionId).toBe(repayTx.transactionId);
      expect(repayObligationTx.debitId).toBe(obligationAccountId);

      const updatedObligation = await getAccount(obligationAccountId);
      expect(updatedObligation.balance).toBe('-10000');
      expect(updatedObligation.available).toBe('-10000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('10000');
      expect(updatedDebit.available).toBe('10000');
    });

    it('should fully repay lent (balance goes to zero)', async () => {
      const creditAccount = await createAccount({
        name: 'Full Repay',
        balance: '50000',
        available: '50000',
      });

      const [, lentObligationTx] = await provider.lentTransaction({
        data: {
          amount: 15000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent',
        },
      });

      const obligationAccountId = lentObligationTx.creditId as number;
      const debitAccount = await createAccount();

      await provider.lentRepaymentTransaction({
        data: {
          amount: 15000,
          obligationAccountId,
          debitId: debitAccount.id,
          description: 'Full repayment',
        },
      });

      const updatedObligation = await getAccount(obligationAccountId);
      expect(updatedObligation.balance).toBe('0');
      expect(updatedObligation.available).toBe('0');
    });
  });

  // ─── refundOutTransaction ─────────────────────────────────────

  describe('refundOutTransaction', () => {
    const createReceiptForRefund = async (overrides: {
      amount?: number;
      debitBalance?: string;
      creditBalance?: string;
    } = {}): Promise<{ receiptTx: TransactionEntity; debitAccount: AccountEntity; creditAccount: AccountEntity }> => {
      const { amount = 20000, debitBalance = '0', creditBalance = '50000' } = overrides;
      const debitAccount = await createAccount({ balance: debitBalance, available: debitBalance });
      const creditAccount = await createAccount({ balance: creditBalance, available: creditBalance });

      const receiptTx = await provider.receiptTransaction({
        data: {
          amount,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Original receipt',
        },
      });

      return { receiptTx, debitAccount, creditAccount };
    };

    it('should reverse a receipt transaction and create REFUND_OUT', async () => {
      const { receiptTx, debitAccount, creditAccount } = await createReceiptForRefund();

      const result = await provider.refundOutTransaction({
        data: {
          amount: 20000,
          transactionId: receiptTx.transactionId,
          description: 'Full refund',
        },
      });

      expect(result.operationType).toBe(OperationType.REFUND_OUT);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('20000');
      expect(result.parentTransactionId).toBe(receiptTx.transactionId);
      expect(result.creditId).toBe(debitAccount.id);
      expect(result.debitId).toBe(creditAccount.id);
      expect(result.transactionId).toMatch(/^TXN-/);

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('0');
      expect(updatedDebit.available).toBe('0');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');
    });

    it('should allow partial refund', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();

      const result = await provider.refundOutTransaction({
        data: {
          amount: 8000,
          transactionId: receiptTx.transactionId,
          description: 'Partial refund',
        },
      });

      expect(result.amount).toBe('8000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('12000');
      expect(updatedDebit.available).toBe('12000');
    });

    it('should allow multiple partial refunds up to original amount', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();

      await provider.refundOutTransaction({
        data: { amount: 8000, transactionId: receiptTx.transactionId, description: null },
      });

      await provider.refundOutTransaction({
        data: { amount: 7000, transactionId: receiptTx.transactionId, description: null },
      });

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('5000');
      expect(updatedDebit.available).toBe('5000');
    });

    it('should throw when cumulative refunds exceed original amount', async () => {
      const { receiptTx } = await createReceiptForRefund();

      await provider.refundOutTransaction({
        data: { amount: 15000, transactionId: receiptTx.transactionId, description: null },
      });

      await expect(
        provider.refundOutTransaction({
          data: { amount: 10000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when original transaction is not found', async () => {
      await expect(
        provider.refundOutTransaction({
          data: { amount: 100, transactionId: 'TXN-NONEXISTENT', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when original transaction is not RECEIPT', async () => {
      const creditAccount = await createAccount({ balance: '50000', available: '50000' });

      const cashOutTx = await provider.cashOutTransaction({
        data: { amount: 10000, debitId: null, creditId: creditAccount.id, description: null },
      });

      await expect(
        provider.refundOutTransaction({
          data: { amount: 5000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when debit account is not active', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();
      await accountRepo.update(debitAccount.id, { status: AccountStatus.DEACTIVATED });

      await expect(
        provider.refundOutTransaction({
          data: { amount: 5000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is negative', async () => {
      await expect(
        provider.refundOutTransaction({
          data: { amount: -100, transactionId: 'TXN-ANY', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── refundInTransaction ──────────────────────────────────────

  describe('refundInTransaction', () => {
    const createCashOutForRefund = async (overrides: {
      amount?: number;
      creditBalance?: string;
      withDebit?: boolean;
    } = {}): Promise<{
      cashOutTx: TransactionEntity;
      creditAccount: AccountEntity;
      debitAccount: AccountEntity | null;
    }> => {
      const { amount = 20000, creditBalance = '50000', withDebit = true } = overrides;
      const creditAccount = await createAccount({ balance: creditBalance, available: creditBalance });
      const debitAccount = withDebit ? await createAccount() : null;

      const cashOutTx = await provider.cashOutTransaction({
        data: {
          amount,
          debitId: debitAccount?.id ?? null,
          creditId: creditAccount.id,
          description: 'Original cash out',
        },
      });

      return { cashOutTx, creditAccount, debitAccount };
    };

    it('should reverse a cash out transaction and create REFUND_IN', async () => {
      const { cashOutTx, creditAccount, debitAccount } = await createCashOutForRefund();

      const result = await provider.refundInTransaction({
        data: {
          amount: 20000,
          transactionId: cashOutTx.transactionId,
          description: 'Full refund',
        },
      });

      expect(result.operationType).toBe(OperationType.REFUND_IN);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.amount).toBe('20000');
      expect(result.parentTransactionId).toBe(cashOutTx.transactionId);
      expect(result.debitId).toBe(creditAccount.id);
      expect(result.creditId).toBe(debitAccount?.id);
      expect(result.transactionId).toMatch(/^TXN-/);

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');

      const updatedDebit = await getAccount(debitAccount?.id as number);
      expect(updatedDebit.balance).toBe('0');
      expect(updatedDebit.available).toBe('0');
    });

    it('should refund cash out that had no debit account', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund({ withDebit: false });

      const result = await provider.refundInTransaction({
        data: {
          amount: 20000,
          transactionId: cashOutTx.transactionId,
          description: 'Refund without debit',
        },
      });

      expect(result.operationType).toBe(OperationType.REFUND_IN);
      expect(result.creditId).toBeNull();

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');
    });

    it('should allow partial refund', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();

      const result = await provider.refundInTransaction({
        data: {
          amount: 8000,
          transactionId: cashOutTx.transactionId,
          description: 'Partial refund',
        },
      });

      expect(result.amount).toBe('8000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('38000');
      expect(updatedCredit.available).toBe('38000');
    });

    it('should allow multiple partial refunds up to original amount', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();

      await provider.refundInTransaction({
        data: { amount: 8000, transactionId: cashOutTx.transactionId, description: null },
      });

      await provider.refundInTransaction({
        data: { amount: 7000, transactionId: cashOutTx.transactionId, description: null },
      });

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('45000');
      expect(updatedCredit.available).toBe('45000');
    });

    it('should throw when cumulative refunds exceed original amount', async () => {
      const { cashOutTx } = await createCashOutForRefund();

      await provider.refundInTransaction({
        data: { amount: 15000, transactionId: cashOutTx.transactionId, description: null },
      });

      await expect(
        provider.refundInTransaction({
          data: { amount: 10000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when original transaction is not found', async () => {
      await expect(
        provider.refundInTransaction({
          data: { amount: 100, transactionId: 'TXN-NONEXISTENT', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when original transaction is not CASH_OUT', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });

      const receiptTx = await provider.receiptTransaction({
        data: { amount: 5000, debitId: debitAccount.id, creditId: null, description: null },
      });

      await expect(
        provider.refundInTransaction({
          data: { amount: 3000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when credited account is not active', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();
      await accountRepo.update(creditAccount.id, { status: AccountStatus.DEACTIVATED });

      await expect(
        provider.refundInTransaction({
          data: { amount: 5000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is negative', async () => {
      await expect(
        provider.refundInTransaction({
          data: { amount: -100, transactionId: 'TXN-ANY', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getTransactionsList ──────────────────────────────────────

  describe('getTransactionsList', () => {
    it('should return paginated transactions', async () => {
      for (let i = 0; i < 5; i++) {
        const acc = await createAccount();
        await provider.openBalanceTransaction({
          data: { amount: (i + 1) * 1000, debitId: acc.id, creditId: null, description: `Balance ${i}` },
        });
      }

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 3 },
      });

      expect(transactions).toHaveLength(3);
      expect(count).toBe(5);
    });

    it('should filter by operation type', async () => {
      const creditAccount = await createAccount({ balance: '100000', available: '100000' });
      const debitAccount1 = await createAccount();
      const debitAccount2 = await createAccount();

      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: debitAccount1.id, creditId: null, description: null },
      });

      await provider.transferTransaction({
        data: { amount: 5000, debitId: debitAccount2.id, creditId: creditAccount.id, description: null },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { operationTypes: [OperationType.TRANSFER] },
      });

      expect(count).toBe(1);
      expect(transactions[0].operationType).toBe(OperationType.TRANSFER);
    });

    it('should filter by status', async () => {
      const acc = await createAccount();
      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: acc.id, creditId: null, description: null },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { status: [TransactionStatus.COMPLETED] },
      });

      expect(count).toBeGreaterThanOrEqual(1);
      transactions.forEach((tx) => {
        expect(tx.status).toBe(TransactionStatus.COMPLETED);
      });
    });

    it('should filter by notStatus', async () => {
      const acc = await createAccount();
      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: acc.id, creditId: null, description: null },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { notStatus: [TransactionStatus.DRAFT, TransactionStatus.PENDING] },
      });

      expect(count).toBeGreaterThanOrEqual(1);
      transactions.forEach((tx) => {
        expect(tx.status).not.toBe(TransactionStatus.DRAFT);
        expect(tx.status).not.toBe(TransactionStatus.PENDING);
      });
    });

    it('should filter by amount range', async () => {
      const acc1 = await createAccount();
      const acc2 = await createAccount();
      const acc3 = await createAccount();

      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: acc1.id, creditId: null, description: null },
      });
      await provider.openBalanceTransaction({
        data: { amount: 5000, debitId: acc2.id, creditId: null, description: null },
      });
      await provider.openBalanceTransaction({
        data: { amount: 10000, debitId: acc3.id, creditId: null, description: null },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { amountFrom: 2000, amountTo: 8000 },
      });

      expect(count).toBe(1);
      expect(transactions[0].amount).toBe('5000');
    });

    it('should search by query in description', async () => {
      const acc1 = await createAccount();
      const acc2 = await createAccount();

      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: acc1.id, creditId: null, description: 'Salary payment' },
      });
      await provider.openBalanceTransaction({
        data: { amount: 2000, debitId: acc2.id, creditId: null, description: 'Rent' },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { query: 'Salary' },
      });

      expect(count).toBeGreaterThanOrEqual(1);
      expect(transactions.some((tx) => tx.description?.includes('Salary'))).toBe(true);
    });

    it('should filter by debit account ids', async () => {
      const acc1 = await createAccount();
      const acc2 = await createAccount();

      await provider.openBalanceTransaction({
        data: { amount: 1000, debitId: acc1.id, creditId: null, description: null },
      });
      await provider.openBalanceTransaction({
        data: { amount: 2000, debitId: acc2.id, creditId: null, description: null },
      });

      const [transactions, count] = await provider.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { debitIds: [acc1.id] },
      });

      expect(count).toBe(1);
      expect(transactions[0].debitId).toBe(acc1.id);
    });
  });
});
