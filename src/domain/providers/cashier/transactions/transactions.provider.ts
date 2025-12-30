import { DataSource, EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { FoundAndCounted } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import { CreateTransaction } from './transactions.types';

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
      throw new InternalServerErrorException(`Open Balance create error. Amount ${debitId} should be exist`);
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

        const creditAvailable = BigInt(creditAccount.available);
        const creditBalance = BigInt(creditAccount.balance);

        if (debitAccount.currencyId !== creditAccount.currencyId) {
          throw new BadRequestException('Accounts must have the same currency');
        }

        if (creditAvailable < formattedAmount) {
          throw new BadRequestException(
            `Insufficient funds. Available: ${creditAccount.available}, Required: ${amount}`
          );
        }

        const newCreditAvailable = creditAvailable - formattedAmount;
        const newCreditBalance = creditBalance - formattedAmount;

        await manager.update(AccountEntity, creditAccount.id, {
          available: newCreditAvailable.toString(),
          balance: newCreditBalance.toString(),
        });
      }

      const newDebitAvailable = debitAvailable + formattedAmount;
      const newDebitBalance = debitBalance + formattedAmount;

      await manager.update(AccountEntity, debitAccount.id, {
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

  private generateTransactionId(): string {
    const year = new Date().getFullYear();
    const additionalId = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TXN-${year}-${timestamp}${additionalId}`;
  }
}