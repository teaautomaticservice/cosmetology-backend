import { DataSource } from 'typeorm';

import { Resources } from '@commonConstants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { TxContext } from '@providers/common/common.type';
import { AsyncContext } from '@utils/asyncContext';

import { AccountsProvider } from './accounts/accounts.provider';
import { CurrenciesProvider } from './currencies/currencies.provider';
import { MoneyStoragesProvider } from './moneyStorages/moneyStorages.provider';
import { TransactionsProvider } from './transactions/transactions.provider';
import { CashierTxContext } from './cashier.types';

@Injectable()
export class CashierTxRunner {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(Resources.AsyncContext) private readonly asyncContext: AsyncContext,
    private readonly accountsProvider: AccountsProvider,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
    private readonly currenciesProvider: CurrenciesProvider,
  ) {}

  public async run<T>(executor: (ctx: CashierTxContext) => Promise<T>): Promise<T> {
    const currentUser = await this.asyncContext.getUser();
    const context: TxContext = { userId: currentUser?.id ?? null };

    return this.dataSource.transaction(async (manager) => {
      return executor({
        accounts: this.accountsProvider.forTx({ manager, context }),
        transactions: this.transactionsProvider.forTx({ manager, context }),
        moneyStorages: this.moneyStoragesProvider.forTx({ manager, context }),
        currencies: this.currenciesProvider.forTx({ manager, context }),
      });
    });
  }
}