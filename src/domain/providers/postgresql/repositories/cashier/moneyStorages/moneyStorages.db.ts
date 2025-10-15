import { DeleteResult, Repository } from 'typeorm';

import { ID } from '@domain/providers/common/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MoneyStoragesEntity } from './moneyStorages.entity';
import { CommonDb } from '../../common/common.db';

@Injectable()
export class MoneyStoragesDb extends CommonDb<MoneyStoragesEntity> {
  constructor(
    @InjectRepository(MoneyStoragesEntity) private readonly moneyStoragesEntity: Repository<MoneyStoragesEntity>,
  ) {
    super(moneyStoragesEntity);
  }

  public async deleteById(id: ID): Promise<DeleteResult> {
    this.logger.info('Delete one money storage by id', {
      id,
    });
    return await this.moneyStoragesEntity.delete(id);
  }
}