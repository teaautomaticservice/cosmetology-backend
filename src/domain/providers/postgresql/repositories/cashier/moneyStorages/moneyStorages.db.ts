import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MoneyStoragesEntity } from './moneyStorages.entity';
import { CommonDb } from '../../common/common.db';

@Injectable()
export class MoneyStoragesDb extends CommonDb<MoneyStoragesEntity> {
  constructor(
    @InjectRepository(MoneyStoragesEntity) private readonly currenciesRepository: Repository<MoneyStoragesEntity>,
  ) {
    super(currenciesRepository);
  }
}