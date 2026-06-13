import {
  DataSource,
  FindOptionsWhere,
  IsNull,
  Not,
  Repository
} from 'typeorm';

import { Resources } from '@commonConstants/resources';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@postgresql/repositories/cashier/currencies/currencies.types';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus,
  MoneyStorageType
} from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { CashierService } from '@services/cashier/cashier.service';
import { CashierServiceModule } from '@services/cashier/cashierService.module';

import { TestDatabase } from './utils/test-database';

const ENTITIES = [TransactionEntity, AccountEntity, CurrencyEntity, MoneyStoragesEntity];
const TABLES = ['transaction', 'accounts', 'money_storages', 'currencies'];

const LOGGER_MOCK = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const ASYNC_CONTEXT_MOCK = {
  getUser: (): undefined => undefined,
};

describe('CashierService transactions (integration)', () => {
  jest.setTimeout(120_000);

  const testDb = new TestDatabase();
  let module: TestingModule;
  let service: CashierService;
  let dataSource: DataSource;
  let accountRepo: Repository<AccountEntity>;
  let transactionRepo: Repository<TransactionEntity>;
  let currency: CurrencyEntity;
  let storage: MoneyStoragesEntity;
  let obligationStorage: MoneyStoragesEntity;

  beforeAll(async () => {
    await testDb.start();

    module = await Test.createTestingModule({
      imports: [
        testDb.getTypeOrmModule(ENTITIES),
        CashierServiceModule,
      ],
    })
      .overrideProvider(Resources.LOGGER)
      .useValue(LOGGER_MOCK)
      .overrideProvider(Resources.AsyncContext)
      .useValue(ASYNC_CONTEXT_MOCK)
      .compile();

    service = module.get(CashierService);
    dataSource = module.get(DataSource);
    accountRepo = dataSource.getRepository(AccountEntity);
    transactionRepo = dataSource.getRepository(TransactionEntity);
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

  /**
   * Returns the only transaction matching the filter. Throws if zero or more than one
   * transactions are found — we want to assert exact uniqueness in tests.
   */
  const getOneTransaction = async (
    where: FindOptionsWhere<TransactionEntity>,
  ): Promise<TransactionEntity> => {
    const list = await transactionRepo.find({ where });
    if (list.length !== 1) {
      throw new Error(
        `Expected exactly 1 transaction matching ${JSON.stringify(where)}, got ${list.length}`,
      );
    }
    return list[0];
  };

  /** Returns all transactions matching filter ordered by id ASC (insertion order). */
  const findTransactions = async (
    where: FindOptionsWhere<TransactionEntity>,
  ): Promise<TransactionEntity[]> => {
    return transactionRepo.find({ where, order: { id: 'ASC' } });
  };

  // ─── openBalanceTransaction ───────────────────────────────────

  describe('openBalanceTransaction', () => {
    it('should create opening balance for debit account without credit', async () => {
      const debitAccount = await createAccount();

      const ok = await service.openBalanceTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: null,
          description: 'Initial balance',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.OPENING_BALANCE,
        debitId: debitAccount.id,
      });
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(tx.amount).toBe('10000');
      expect(tx.debitId).toBe(debitAccount.id);
      expect(tx.creditId).toBeNull();
      expect(tx.transactionId).toMatch(/^TXN-/);
      expect(tx.executionDate).toBeInstanceOf(Date);

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

      const ok = await service.openBalanceTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Balance from credit',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.OPENING_BALANCE,
        debitId: debitAccount.id,
        creditId: creditAccount.id,
      });
      expect(tx.amount).toBe('10000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('10000');
      expect(updatedDebit.available).toBe('10000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('40000');
      expect(updatedCredit.available).toBe('40000');
    });

    it('should throw when debit account is not found', async () => {
      await expect(
        service.openBalanceTransaction({
          data: { amount: 100, debitId: 999999, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when debit account is not active', async () => {
      const debitAccount = await createAccount({ status: AccountStatus.FREEZED });

      await expect(
        service.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when debit account is not empty', async () => {
      const debitAccount = await createAccount({ balance: '5000', available: '5000' });

      await expect(
        service.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit account has insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });
      const debitAccount = await createAccount();

      await expect(
        service.openBalanceTransaction({
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
        service.openBalanceTransaction({
          data: { amount: 100, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when last debit transaction is not CLOSING_BALANCE', async () => {
      const debitAccount = await createAccount();

      await service.openBalanceTransaction({
        data: { amount: 1000, debitId: debitAccount.id, creditId: null, description: null },
      });

      await accountRepo.update(debitAccount.id, { balance: '0', available: '0' });

      await expect(
        service.openBalanceTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── openBalanceObligationTransaction ─────────────────────────

  describe('openBalanceObligationTransaction', () => {
    it('should create new obligation account with opening balance', async () => {
      const ok = await service.openBalanceObligationTransaction({
        data: {
          amount: 15000,
          obligationStorageId: obligationStorage.id,
          debitName: 'New Obligation',
          currencyId: currency.id,
          description: 'Opening obligation balance',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.OPENING_BALANCE,
      });
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(tx.amount).toBe('15000');
      expect(tx.creditId).toBeNull();
      expect(tx.debitId).not.toBeNull();

      const obligationAccount = await getAccount(tx.debitId as number);
      expect(obligationAccount.name).toBe('New Obligation');
      expect(obligationAccount.balance).toBe('15000');
      expect(obligationAccount.available).toBe('15000');
      expect(obligationAccount.moneyStorageId).toBe(obligationStorage.id);
    });

    it('should throw when obligation account with same name already exists', async () => {
      await service.openBalanceObligationTransaction({
        data: {
          amount: 10000,
          obligationStorageId: obligationStorage.id,
          debitName: 'Duplicate',
          currencyId: currency.id,
          description: null,
        },
      });

      await expect(
        service.openBalanceObligationTransaction({
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
        service.openBalanceObligationTransaction({
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
        service.openBalanceObligationTransaction({
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

      const ok = await service.cashOutTransaction({
        data: {
          amount: 15000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Cash withdrawal',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.CASH_OUT,
        debitId: debitAccount.id,
        creditId: creditAccount.id,
      });
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(tx.amount).toBe('15000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('35000');
      expect(updatedCredit.available).toBe('35000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');
    });

    it('should work without debit account (cash out to nowhere)', async () => {
      const creditAccount = await createAccount({ balance: '50000', available: '50000' });

      const ok = await service.cashOutTransaction({
        data: {
          amount: 10000,
          debitId: null,
          creditId: creditAccount.id,
          description: 'Cash out without debit',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.CASH_OUT,
        creditId: creditAccount.id,
      });
      expect(tx.debitId).toBeNull();

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('40000');
      expect(updatedCredit.available).toBe('40000');
    });

    it('should throw when credit account has insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        service.cashOutTransaction({
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
        service.cashOutTransaction({
          data: { amount: 100, debitId: null, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── receiptTransaction ───────────────────────────────────────

  describe('receiptTransaction', () => {
    it('should add to debit account without credit', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });

      const ok = await service.receiptTransaction({
        data: {
          amount: 5000,
          debitId: debitAccount.id,
          creditId: null,
          description: 'Payment received',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.RECEIPT,
        debitId: debitAccount.id,
      });
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(tx.amount).toBe('5000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');
    });

    it('should add to debit and deduct from credit', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });
      const creditAccount = await createAccount({ balance: '20000', available: '20000' });

      const ok = await service.receiptTransaction({
        data: {
          amount: 5000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Transfer receipt',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.RECEIPT,
        debitId: debitAccount.id,
        creditId: creditAccount.id,
      });
      expect(tx.amount).toBe('5000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('15000');
      expect(updatedDebit.available).toBe('15000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('15000');
      expect(updatedCredit.available).toBe('15000');
    });

    it('should throw when debit account not found', async () => {
      await expect(
        service.receiptTransaction({
          data: { amount: 100, debitId: 999999, creditId: null, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit has insufficient funds', async () => {
      const debitAccount = await createAccount();
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        service.receiptTransaction({
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

      const ok = await service.transferTransaction({
        data: {
          amount: 12000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Internal transfer',
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({
        operationType: OperationType.TRANSFER,
        debitId: debitAccount.id,
        creditId: creditAccount.id,
      });
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(tx.amount).toBe('12000');

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
        service.transferTransaction({
          data: { amount: 500, debitId: debitAccount.id, creditId: creditAccount.id, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is zero', async () => {
      const creditAccount = await createAccount({ balance: '30000', available: '30000' });
      const debitAccount = await createAccount();

      await expect(
        service.transferTransaction({
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
        service.transferTransaction({
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

      const ok = await service.loanTransaction({
        data: {
          amount: 25000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Loan from John',
        },
      });
      expect(ok).toBe(true);

      const mainTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: IsNull(),
      });
      expect(mainTx.status).toBe(TransactionStatus.COMPLETED);
      expect(mainTx.amount).toBe('25000');
      expect(mainTx.debitId).toBe(debitAccount.id);
      expect(mainTx.creditId).toBe(creditAccount.id);

      const obligationTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: mainTx.transactionId,
      });
      expect(obligationTx.creditId).toBeNull();
      expect(obligationTx.debitId).not.toBeNull();

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

      await service.loanTransaction({
        data: {
          amount: 10000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'First loan',
        },
      });

      const firstObligationsList = await findTransactions({
        operationType: OperationType.LOAN,
        parentTransactionId: Not(IsNull()),
      });
      expect(firstObligationsList).toHaveLength(1);
      const firstObligationTx = firstObligationsList[0];

      await service.loanTransaction({
        data: {
          amount: 15000,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Second loan',
        },
      });

      const allObligations = await findTransactions({
        operationType: OperationType.LOAN,
        parentTransactionId: Not(IsNull()),
      });
      expect(allObligations).toHaveLength(2);
      const secondObligationTx = allObligations[1];

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
        service.loanTransaction({
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

      await service.loanTransaction({
        data: {
          amount: 30000,
          debitId: borrowerAccount.id,
          creditId: lenderAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Initial loan',
        },
      });

      const loanMainTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: IsNull(),
      });
      const loanObligationTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: loanMainTx.transactionId,
      });
      const obligationAccountId = loanObligationTx.debitId as number;

      const ok = await service.loanRepaymentTransaction({
        data: {
          amount: 10000,
          creditObligationAccountId: obligationAccountId,
          debitId: lenderAccount.id,
          creditId: borrowerAccount.id,
          description: 'Partial repayment',
        },
      });
      expect(ok).toBe(true);

      const repayMainTx = await getOneTransaction({
        operationType: OperationType.LOAN_REPAYMENT,
        parentTransactionId: IsNull(),
      });
      expect(repayMainTx.status).toBe(TransactionStatus.COMPLETED);

      const repayObligationTx = await getOneTransaction({
        operationType: OperationType.LOAN_REPAYMENT,
        parentTransactionId: repayMainTx.transactionId,
      });
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

      await service.loanTransaction({
        data: {
          amount: 30000,
          debitId: borrowerAccount.id,
          creditId: lenderAccount.id,
          obligationStorageId: obligationStorage.id,
          description: 'Loan',
        },
      });

      const mainLoanTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: IsNull(),
      });
      const obligationLoanTx = await getOneTransaction({
        operationType: OperationType.LOAN,
        parentTransactionId: mainLoanTx.transactionId,
      });

      await accountRepo.update(borrowerAccount.id, { balance: '5000', available: '5000' });

      await expect(
        service.loanRepaymentTransaction({
          data: {
            amount: 10000,
            creditObligationAccountId: obligationLoanTx.debitId as number,
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

      const ok = await service.lentTransaction({
        data: {
          amount: 20000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent to friend',
        },
      });
      expect(ok).toBe(true);

      const mainTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: IsNull(),
      });
      expect(mainTx.status).toBe(TransactionStatus.COMPLETED);
      expect(mainTx.amount).toBe('20000');

      const obligationTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: mainTx.transactionId,
      });
      expect(obligationTx.creditId).not.toBeNull();

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

      await service.lentTransaction({
        data: {
          amount: 10000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'First lent',
        },
      });

      const firstObligationsList = await findTransactions({
        operationType: OperationType.LENT,
        parentTransactionId: Not(IsNull()),
      });
      expect(firstObligationsList).toHaveLength(1);
      const firstObligationTx = firstObligationsList[0];

      await service.lentTransaction({
        data: {
          amount: 15000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Second lent',
        },
      });

      const allObligations = await findTransactions({
        operationType: OperationType.LENT,
        parentTransactionId: Not(IsNull()),
      });
      expect(allObligations).toHaveLength(2);
      const secondObligationTx = allObligations[1];

      expect(secondObligationTx.creditId).toBe(firstObligationTx.creditId);

      const obligationAccount = await getAccount(secondObligationTx.creditId as number);
      expect(obligationAccount.balance).toBe('-25000');
      expect(obligationAccount.available).toBe('-25000');
    });

    it('should throw when insufficient funds', async () => {
      const creditAccount = await createAccount({ balance: '100', available: '100' });

      await expect(
        service.lentTransaction({
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

      await service.lentTransaction({
        data: {
          amount: 20000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent',
        },
      });

      const lentMainTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: IsNull(),
      });
      const lentObligationTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: lentMainTx.transactionId,
      });
      const obligationAccountId = lentObligationTx.creditId as number;

      const debitAccount = await createAccount();

      const ok = await service.lentRepaymentTransaction({
        data: {
          amount: 10000,
          obligationAccountId,
          debitId: debitAccount.id,
          description: 'Partial lent repayment',
        },
      });
      expect(ok).toBe(true);

      const repayMainTx = await getOneTransaction({
        operationType: OperationType.LENT_REPAYMENT,
        parentTransactionId: IsNull(),
      });
      expect(repayMainTx.status).toBe(TransactionStatus.COMPLETED);

      const repayObligationTx = await getOneTransaction({
        operationType: OperationType.LENT_REPAYMENT,
        parentTransactionId: repayMainTx.transactionId,
      });
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

      await service.lentTransaction({
        data: {
          amount: 15000,
          creditId: creditAccount.id,
          creditObligationStorageId: obligationStorage.id,
          description: 'Lent',
        },
      });

      const lentMainTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: IsNull(),
      });
      const lentObligationTx = await getOneTransaction({
        operationType: OperationType.LENT,
        parentTransactionId: lentMainTx.transactionId,
      });
      const obligationAccountId = lentObligationTx.creditId as number;
      const debitAccount = await createAccount();

      await service.lentRepaymentTransaction({
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

      await service.receiptTransaction({
        data: {
          amount,
          debitId: debitAccount.id,
          creditId: creditAccount.id,
          description: 'Original receipt',
        },
      });

      const receiptTx = await getOneTransaction({
        operationType: OperationType.RECEIPT,
        debitId: debitAccount.id,
        creditId: creditAccount.id,
      });

      return { receiptTx, debitAccount, creditAccount };
    };

    it('should reverse a receipt transaction and create REFUND_OUT', async () => {
      const { receiptTx, debitAccount, creditAccount } = await createReceiptForRefund();

      const ok = await service.refundOutTransaction({
        data: {
          amount: 20000,
          transactionId: receiptTx.transactionId,
          description: 'Full refund',
        },
      });
      expect(ok).toBe(true);

      const refundTx = await getOneTransaction({
        operationType: OperationType.REFUND_OUT,
        parentTransactionId: receiptTx.transactionId,
      });
      expect(refundTx.status).toBe(TransactionStatus.COMPLETED);
      expect(refundTx.amount).toBe('20000');
      expect(refundTx.creditId).toBe(debitAccount.id);
      expect(refundTx.debitId).toBe(creditAccount.id);
      expect(refundTx.transactionId).toMatch(/^TXN-/);

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('0');
      expect(updatedDebit.available).toBe('0');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');
    });

    it('should allow partial refund', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();

      const ok = await service.refundOutTransaction({
        data: {
          amount: 8000,
          transactionId: receiptTx.transactionId,
          description: 'Partial refund',
        },
      });
      expect(ok).toBe(true);

      const refundTx = await getOneTransaction({
        operationType: OperationType.REFUND_OUT,
        parentTransactionId: receiptTx.transactionId,
      });
      expect(refundTx.amount).toBe('8000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('12000');
      expect(updatedDebit.available).toBe('12000');
    });

    it('should allow multiple partial refunds up to original amount', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();

      await service.refundOutTransaction({
        data: { amount: 8000, transactionId: receiptTx.transactionId, description: null },
      });

      await service.refundOutTransaction({
        data: { amount: 7000, transactionId: receiptTx.transactionId, description: null },
      });

      const refunds = await findTransactions({
        operationType: OperationType.REFUND_OUT,
        parentTransactionId: receiptTx.transactionId,
      });
      expect(refunds).toHaveLength(2);
      expect(refunds[0].amount).toBe('8000');
      expect(refunds[1].amount).toBe('7000');

      const updatedDebit = await getAccount(debitAccount.id);
      expect(updatedDebit.balance).toBe('5000');
      expect(updatedDebit.available).toBe('5000');
    });

    it('should throw when cumulative refunds exceed original amount', async () => {
      const { receiptTx } = await createReceiptForRefund();

      await service.refundOutTransaction({
        data: { amount: 15000, transactionId: receiptTx.transactionId, description: null },
      });

      await expect(
        service.refundOutTransaction({
          data: { amount: 10000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when original transaction is not found', async () => {
      await expect(
        service.refundOutTransaction({
          data: { amount: 100, transactionId: 'TXN-NONEXISTENT', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when original transaction is not RECEIPT', async () => {
      const creditAccount = await createAccount({ balance: '50000', available: '50000' });

      await service.cashOutTransaction({
        data: { amount: 10000, debitId: null, creditId: creditAccount.id, description: null },
      });

      const cashOutTx = await getOneTransaction({
        operationType: OperationType.CASH_OUT,
        creditId: creditAccount.id,
      });

      await expect(
        service.refundOutTransaction({
          data: { amount: 5000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when debit account is not active', async () => {
      const { receiptTx, debitAccount } = await createReceiptForRefund();
      await accountRepo.update(debitAccount.id, { status: AccountStatus.DEACTIVATED });

      await expect(
        service.refundOutTransaction({
          data: { amount: 5000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is negative', async () => {
      await expect(
        service.refundOutTransaction({
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

      await service.cashOutTransaction({
        data: {
          amount,
          debitId: debitAccount?.id ?? null,
          creditId: creditAccount.id,
          description: 'Original cash out',
        },
      });

      const cashOutTx = await getOneTransaction({
        operationType: OperationType.CASH_OUT,
        creditId: creditAccount.id,
      });

      return { cashOutTx, creditAccount, debitAccount };
    };

    it('should reverse a cash out transaction and create REFUND_IN', async () => {
      const { cashOutTx, creditAccount, debitAccount } = await createCashOutForRefund();

      const ok = await service.refundInTransaction({
        data: {
          amount: 20000,
          transactionId: cashOutTx.transactionId,
          description: 'Full refund',
        },
      });
      expect(ok).toBe(true);

      const refundTx = await getOneTransaction({
        operationType: OperationType.REFUND_IN,
        parentTransactionId: cashOutTx.transactionId,
      });
      expect(refundTx.status).toBe(TransactionStatus.COMPLETED);
      expect(refundTx.amount).toBe('20000');
      expect(refundTx.debitId).toBe(creditAccount.id);
      expect(refundTx.creditId).toBe(debitAccount?.id);
      expect(refundTx.transactionId).toMatch(/^TXN-/);

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');

      const updatedDebit = await getAccount(debitAccount?.id as number);
      expect(updatedDebit.balance).toBe('0');
      expect(updatedDebit.available).toBe('0');
    });

    it('should refund cash out that had no debit account', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund({ withDebit: false });

      const ok = await service.refundInTransaction({
        data: {
          amount: 20000,
          transactionId: cashOutTx.transactionId,
          description: 'Refund without debit',
        },
      });
      expect(ok).toBe(true);

      const refundTx = await getOneTransaction({
        operationType: OperationType.REFUND_IN,
        parentTransactionId: cashOutTx.transactionId,
      });
      expect(refundTx.creditId).toBeNull();

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('50000');
      expect(updatedCredit.available).toBe('50000');
    });

    it('should allow partial refund', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();

      const ok = await service.refundInTransaction({
        data: {
          amount: 8000,
          transactionId: cashOutTx.transactionId,
          description: 'Partial refund',
        },
      });
      expect(ok).toBe(true);

      const refundTx = await getOneTransaction({
        operationType: OperationType.REFUND_IN,
        parentTransactionId: cashOutTx.transactionId,
      });
      expect(refundTx.amount).toBe('8000');

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('38000');
      expect(updatedCredit.available).toBe('38000');
    });

    it('should allow multiple partial refunds up to original amount', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();

      await service.refundInTransaction({
        data: { amount: 8000, transactionId: cashOutTx.transactionId, description: null },
      });

      await service.refundInTransaction({
        data: { amount: 7000, transactionId: cashOutTx.transactionId, description: null },
      });

      const refunds = await findTransactions({
        operationType: OperationType.REFUND_IN,
        parentTransactionId: cashOutTx.transactionId,
      });
      expect(refunds).toHaveLength(2);

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('45000');
      expect(updatedCredit.available).toBe('45000');
    });

    it('should throw when cumulative refunds exceed original amount', async () => {
      const { cashOutTx } = await createCashOutForRefund();

      await service.refundInTransaction({
        data: { amount: 15000, transactionId: cashOutTx.transactionId, description: null },
      });

      await expect(
        service.refundInTransaction({
          data: { amount: 10000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when original transaction is not found', async () => {
      await expect(
        service.refundInTransaction({
          data: { amount: 100, transactionId: 'TXN-NONEXISTENT', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when original transaction is not CASH_OUT', async () => {
      const debitAccount = await createAccount({ balance: '10000', available: '10000' });

      await service.receiptTransaction({
        data: { amount: 5000, debitId: debitAccount.id, creditId: null, description: null },
      });

      const receiptTx = await getOneTransaction({
        operationType: OperationType.RECEIPT,
        debitId: debitAccount.id,
      });

      await expect(
        service.refundInTransaction({
          data: { amount: 3000, transactionId: receiptTx.transactionId, description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when credited account is not active', async () => {
      const { cashOutTx, creditAccount } = await createCashOutForRefund();
      await accountRepo.update(creditAccount.id, { status: AccountStatus.DEACTIVATED });

      await expect(
        service.refundInTransaction({
          data: { amount: 5000, transactionId: cashOutTx.transactionId, description: null },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is negative', async () => {
      await expect(
        service.refundInTransaction({
          data: { amount: -100, transactionId: 'TXN-ANY', description: null },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── distributionTransactions ─────────────────────────────────

  describe('distributionTransactions', () => {
    it('should distribute funds from credit to multiple debit accounts', async () => {
      const creditAccount = await createAccount({ balance: '100000', available: '100000' });
      const debit1 = await createAccount();
      const debit2 = await createAccount();
      const debit3 = await createAccount();

      const ok = await service.distributionTransactions({
        data: {
          creditId: creditAccount.id,
          description: 'Salary distribution',
          distributedAccounts: [
            { debitId: debit1.id, amount: 20000 },
            { debitId: debit2.id, amount: 30000 },
            { debitId: debit3.id, amount: 10000 },
          ],
        },
      });
      expect(ok).toBe(true);

      const transfers = await findTransactions({ operationType: OperationType.TRANSFER });
      expect(transfers).toHaveLength(3);
      transfers.forEach((tx) => {
        expect(tx.status).toBe(TransactionStatus.COMPLETED);
        expect(tx.creditId).toBe(creditAccount.id);
        expect(tx.description).toBe('Salary distribution');
        expect(tx.transactionId).toMatch(/^TXN-/);
      });

      const updatedCredit = await getAccount(creditAccount.id);
      expect(updatedCredit.balance).toBe('40000');
      expect(updatedCredit.available).toBe('40000');

      expect((await getAccount(debit1.id)).balance).toBe('20000');
      expect((await getAccount(debit2.id)).balance).toBe('30000');
      expect((await getAccount(debit3.id)).balance).toBe('10000');
    });

    it('should link created transactions as a chain (linked list)', async () => {
      const creditAccount = await createAccount({ balance: '100000', available: '100000' });
      const debit1 = await createAccount();
      const debit2 = await createAccount();
      const debit3 = await createAccount();

      await service.distributionTransactions({
        data: {
          creditId: creditAccount.id,
          description: null,
          distributedAccounts: [
            { debitId: debit1.id, amount: 1000 },
            { debitId: debit2.id, amount: 2000 },
            { debitId: debit3.id, amount: 3000 },
          ],
        },
      });

      const transfers = await findTransactions({ operationType: OperationType.TRANSFER });
      expect(transfers).toHaveLength(3);

      expect(transfers[0].parentTransactionId).toBeNull();
      expect(transfers[1].parentTransactionId).toBe(transfers[0].transactionId);
      expect(transfers[2].parentTransactionId).toBe(transfers[1].transactionId);

      expect(transfers[0].debitId).toBe(debit1.id);
      expect(transfers[1].debitId).toBe(debit2.id);
      expect(transfers[2].debitId).toBe(debit3.id);
    });

    it('should distribute to a single debit account', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      const ok = await service.distributionTransactions({
        data: {
          creditId: creditAccount.id,
          description: null,
          distributedAccounts: [{ debitId: debit.id, amount: 5000 }],
        },
      });
      expect(ok).toBe(true);

      const tx = await getOneTransaction({ operationType: OperationType.TRANSFER });
      expect(tx.parentTransactionId).toBeNull();
      expect(tx.amount).toBe('5000');

      expect((await getAccount(creditAccount.id)).balance).toBe('0');
      expect((await getAccount(debit.id)).balance).toBe('5000');
    });

    it('should throw when distributedAccounts is empty', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });

      await expect(
        service.distributionTransactions({
          data: { creditId: creditAccount.id, description: null, distributedAccounts: [] },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when creditId is among distribution targets', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [
              { debitId: debit.id, amount: 1000 },
              { debitId: creditAccount.id, amount: 1000 },
            ],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a debitId is duplicated', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [
              { debitId: debit.id, amount: 1000 },
              { debitId: debit.id, amount: 2000 },
            ],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when an amount is zero', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 0 }],
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when an amount is negative', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: -1000 }],
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when an amount is not an integer', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 10.5 }],
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when credit account is not found', async () => {
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: 999999,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 1000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when credit account has insufficient funds and roll back', async () => {
      const creditAccount = await createAccount({ balance: '1000', available: '1000' });
      const debit = await createAccount();

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 5000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect((await getAccount(creditAccount.id)).balance).toBe('1000');
      expect((await getAccount(debit.id)).balance).toBe('0');
      const transfers = await findTransactions({ operationType: OperationType.TRANSFER });
      expect(transfers).toHaveLength(0);
    });

    it('should throw when a debit account is not found', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: 999999, amount: 1000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a debit account is not active', async () => {
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount({ status: AccountStatus.FREEZED });

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 1000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a debit account has a different currency', async () => {
      const eur = await dataSource.getRepository(CurrencyEntity).save({
        name: 'Euro',
        status: CurrencyStatus.ACTIVE,
        code: 'EUR',
      });
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount({ currencyId: eur.id });

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 1000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a debit account is in a different money storage', async () => {
      const otherStorage = await dataSource.getRepository(MoneyStoragesEntity).save({
        name: 'Other Storage',
        status: MoneyStorageStatus.ACTIVE,
        code: 'OTHER',
        type: MoneyStorageType.COMMON,
      });
      const creditAccount = await createAccount({ balance: '5000', available: '5000' });
      const debit = await createAccount({ moneyStorageId: otherStorage.id });

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [{ debitId: debit.id, amount: 1000 }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should roll back the whole distribution when one target is invalid', async () => {
      const eur = await dataSource.getRepository(CurrencyEntity).save({
        name: 'Euro2',
        status: CurrencyStatus.ACTIVE,
        code: 'EU2',
      });
      const creditAccount = await createAccount({ balance: '100000', available: '100000' });
      const validDebit = await createAccount();
      const invalidDebit = await createAccount({ currencyId: eur.id });

      await expect(
        service.distributionTransactions({
          data: {
            creditId: creditAccount.id,
            description: null,
            distributedAccounts: [
              { debitId: validDebit.id, amount: 10000 },
              { debitId: invalidDebit.id, amount: 5000 },
            ],
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect((await getAccount(creditAccount.id)).balance).toBe('100000');
      expect((await getAccount(validDebit.id)).balance).toBe('0');
      const transfers = await findTransactions({ operationType: OperationType.TRANSFER });
      expect(transfers).toHaveLength(0);
    });
  });

  // ─── swapTransactions ─────────────────────────────────────────

  describe('swapTransactions', () => {
    /**
     * Builds a valid two-storage swap setup:
     *   storage X (default `storage`): firstCredit (funded), secondDebit
     *   storage Y (created here):      firstDebit, secondCredit (funded)
     */
    const setupSwap = async (overrides: {
      firstCredit?: Partial<AccountEntity>;
      firstDebit?: Partial<AccountEntity>;
      secondCredit?: Partial<AccountEntity>;
      secondDebit?: Partial<AccountEntity>;
    } = {}): Promise<{
      storageY: MoneyStoragesEntity;
      firstCredit: AccountEntity;
      firstDebit: AccountEntity;
      secondCredit: AccountEntity;
      secondDebit: AccountEntity;
    }> => {
      const storageY = await dataSource.getRepository(MoneyStoragesEntity).save({
        name: 'Storage Y',
        status: MoneyStorageStatus.ACTIVE,
        code: 'STORE_Y',
        type: MoneyStorageType.COMMON,
      });

      const firstCredit = await createAccount({
        balance: '100000',
        available: '100000',
        ...overrides.firstCredit,
      });
      const secondDebit = await createAccount({ ...overrides.secondDebit });
      const firstDebit = await createAccount({
        moneyStorageId: storageY.id,
        ...overrides.firstDebit,
      });
      const secondCredit = await createAccount({
        moneyStorageId: storageY.id,
        balance: '100000',
        available: '100000',
        ...overrides.secondCredit,
      });

      return {
        storageY, firstCredit, firstDebit, secondCredit, secondDebit
      };
    };

    it('should swap the same amount between two storages', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap();

      const ok = await service.swapTransactions({
        data: {
          amount: 5000,
          firstCreditId: firstCredit.id,
          firstDebitId: firstDebit.id,
          secondCreditId: secondCredit.id,
          secondDebitId: secondDebit.id,
          description: 'Storage swap',
        },
      });
      expect(ok).toBe(true);

      const firstTx = await getOneTransaction({
        operationType: OperationType.TRANSFER,
        parentTransactionId: IsNull(),
      });
      expect(firstTx.status).toBe(TransactionStatus.COMPLETED);
      expect(firstTx.amount).toBe('5000');
      expect(firstTx.creditId).toBe(firstCredit.id);
      expect(firstTx.debitId).toBe(firstDebit.id);

      const secondTx = await getOneTransaction({
        operationType: OperationType.TRANSFER,
        parentTransactionId: firstTx.transactionId,
      });
      expect(secondTx.amount).toBe('5000');
      expect(secondTx.creditId).toBe(secondCredit.id);
      expect(secondTx.debitId).toBe(secondDebit.id);
      expect(secondTx.description).toBe('Storage swap');

      expect((await getAccount(firstCredit.id)).balance).toBe('95000');
      expect((await getAccount(firstDebit.id)).balance).toBe('5000');
      expect((await getAccount(secondCredit.id)).balance).toBe('95000');
      expect((await getAccount(secondDebit.id)).balance).toBe('5000');
    });

    it('should throw when account ids are not unique', async () => {
      const { firstCredit, firstDebit, secondDebit } = await setupSwap();

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: firstCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when amount is zero', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap();

      await expect(
        service.swapTransactions({
          data: {
            amount: 0,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when amount is negative', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap();

      await expect(
        service.swapTransactions({
          data: {
            amount: -5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when amount is not an integer', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap();

      await expect(
        service.swapTransactions({
          data: {
            amount: 10.5,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw when an account is not found', async () => {
      const { firstCredit, firstDebit, secondCredit } = await setupSwap();

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: 999999,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when an account is not active', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap({
        firstDebit: { status: AccountStatus.FREEZED },
      });

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when accounts have different currencies', async () => {
      const eur = await dataSource.getRepository(CurrencyEntity).save({
        name: 'Euro',
        status: CurrencyStatus.ACTIVE,
        code: 'EUR',
      });
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap({
        firstDebit: { currencyId: eur.id },
      });

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when storage topology is violated', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap({
        secondCredit: { moneyStorageId: storage.id },
      });

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should roll back the whole swap when the second leg has insufficient funds', async () => {
      const { firstCredit, firstDebit, secondCredit, secondDebit } = await setupSwap({
        secondCredit: { balance: '100', available: '100' },
      });

      await expect(
        service.swapTransactions({
          data: {
            amount: 5000,
            firstCreditId: firstCredit.id,
            firstDebitId: firstDebit.id,
            secondCreditId: secondCredit.id,
            secondDebitId: secondDebit.id,
            description: null,
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect((await getAccount(firstCredit.id)).balance).toBe('100000');
      expect((await getAccount(firstDebit.id)).balance).toBe('0');
      expect((await getAccount(secondCredit.id)).balance).toBe('100');
      expect((await getAccount(secondDebit.id)).balance).toBe('0');

      const transfers = await findTransactions({ operationType: OperationType.TRANSFER });
      expect(transfers).toHaveLength(0);
    });
  });

  // ─── getTransactionsList ──────────────────────────────────────

  describe('getTransactionsList', () => {
    it('should return paginated transactions', async () => {
      for (let i = 0; i < 5; i++) {
        const acc = await createAccount();
        await service.openBalanceTransaction({
          data: { amount: (i + 1) * 1000, debitId: acc.id, creditId: null, description: `Balance ${i}` },
        });
      }

      const [transactions, count] = await service.getTransactionsList({
        pagination: { page: 1, pageSize: 3 },
      });

      expect(transactions).toHaveLength(3);
      expect(count).toBe(5);
    });

    it('should filter by operation type', async () => {
      const creditAccount = await createAccount({ balance: '100000', available: '100000' });
      const debitAccount1 = await createAccount();
      const debitAccount2 = await createAccount();

      await service.openBalanceTransaction({
        data: { amount: 1000, debitId: debitAccount1.id, creditId: null, description: null },
      });

      await service.transferTransaction({
        data: { amount: 5000, debitId: debitAccount2.id, creditId: creditAccount.id, description: null },
      });

      const [transactions, count] = await service.getTransactionsList({
        pagination: { page: 1, pageSize: 10 },
        filter: { operationTypes: [OperationType.TRANSFER] },
      });

      expect(count).toBe(1);
      expect(transactions[0].operationType).toBe(OperationType.TRANSFER);
    });
  });
});
