import { AccountsTxOps } from './accounts/accounts.txOps';
import { CurrenciesTxOps } from './currencies/currencies.txOps';
import { MoneyStoragesTxOps } from './moneyStorages/moneyStorages.txOps';
import { TransactionsTxOps } from './transactions/transactions.txOps';

export interface CashierTxContext {
  accounts: AccountsTxOps;
  transactions: TransactionsTxOps;
  moneyStorages: MoneyStoragesTxOps;
  currencies: CurrenciesTxOps;
}