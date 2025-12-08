const commonPath = (path: string): string => `/cashier${path}`;

export const CASHIER_CURRENCIES_PATH = commonPath('/currencies');
export const CASHIER_MONEY_STORAGES_PATH = commonPath('/money-storages');
export const CASHIER_ACCOUNTS_PATH = commonPath('/accounts');
export const CASHIER_TRANSACTIONS_PATH = commonPath('/transactions');