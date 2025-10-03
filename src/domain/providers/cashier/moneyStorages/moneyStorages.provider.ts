import { RecordEntity } from '@domain/providers/common/common.type';
import { Injectable } from '@nestjs/common';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { MoneyStoragesDb } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.db';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

@Injectable()
export class MoneyStoragesProvider extends CommonPostgresqlProvider<MoneyStoragesEntity> {
  constructor(private readonly moneyStoragesDb: MoneyStoragesDb) {
    super(moneyStoragesDb);
  }

  public async create(data: RecordEntity<MoneyStoragesEntity>): Promise<MoneyStoragesEntity> {
    const formattedCode = data.code.toUpperCase();
    return this.moneyStoragesDb.create({
      ...data,
      code: formattedCode,
    });
  }

  public async findByCode(code: MoneyStoragesEntity['code']): Promise<MoneyStoragesEntity | null> {
    const formattedCode = code.toUpperCase();
    return this.moneyStoragesDb.findOne({
      where: {
        code: formattedCode,
      },
    });
  }
}