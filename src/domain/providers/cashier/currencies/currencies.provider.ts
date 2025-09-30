import { CommonPostgresqlProvider } from '@domain/providers/common/commonPostgresql.provider';
import { CurrenciesDb } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.db';
import { CurrencyEntity } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrenciesProvider extends CommonPostgresqlProvider<CurrencyEntity> {
  constructor(private readonly currenciesDb: CurrenciesDb) {
    super(currenciesDb);
  }

  public async findByCode(code: CurrencyEntity['code']): Promise<CurrencyEntity | null> {
    return this.currenciesDb.findOne({
      where: {
        code,
      },
    });
  }
}