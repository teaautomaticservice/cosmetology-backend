import { DeleteResult, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CurrencyEntity } from './currencies.entity';
import { CommonDb } from '../../common/common.db';

@Injectable()
export class CurrenciesDb extends CommonDb<CurrencyEntity> {
  constructor(
    @InjectRepository(CurrencyEntity) private readonly currenciesRepository: Repository<CurrencyEntity>,
  ) {
    super(currenciesRepository);
  }

  public async deleteById(id: CurrencyEntity['id']): Promise<DeleteResult> {
    this.logger.info('Delete one currency by id', {
      id,
    });
    return await this.currenciesRepository.delete(id);
  }
}
