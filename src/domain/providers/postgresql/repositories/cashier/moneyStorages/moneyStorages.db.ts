import { Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import { MoneyStoragesEntity } from './moneyStorages.entity';
import { CommonDb } from '../../common/common.db';

export class moneyStoragesDb extends CommonDb<MoneyStoragesEntity> {
  constructor(
    @InjectRepository(MoneyStoragesEntity) private readonly currenciesRepository: Repository<MoneyStoragesEntity>,
  ) {
    super(currenciesRepository);
  }
}