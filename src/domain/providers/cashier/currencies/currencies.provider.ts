import { Injectable } from '@nestjs/common';
import { ID, RecordEntity } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { CurrenciesDb } from '@providers/postgresql/repositories/cashier/currencies/currencies.db';
import { CurrencyEntity } from '@providers/postgresql/repositories/cashier/currencies/currencies.entity';

@Injectable()
export class CurrenciesProvider extends CommonPostgresqlProvider<CurrencyEntity> {
  constructor(private readonly currenciesDb: CurrenciesDb) {
    super(currenciesDb);
  }

  public async create(data: RecordEntity<CurrencyEntity>): Promise<CurrencyEntity> {
    const formattedCode = data.code.toUpperCase();
    return this.currenciesDb.create({
      ...data,
      code: formattedCode,
    });
  }

  public async findByCode(code: CurrencyEntity['code']): Promise<CurrencyEntity | null> {
    const formattedCode = code.toUpperCase();
    return this.currenciesDb.findOne({
      where: {
        code: formattedCode,
      },
    });
  }

  public async deleteById(currentId: ID): Promise<boolean> {
    await this.currenciesDb.deleteById(currentId);
    return true;
  }
}