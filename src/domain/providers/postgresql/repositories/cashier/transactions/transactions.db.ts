import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonDb } from '@postgresql/repositories/common/common.db';

import { TransactionEntity } from './transactions.entity';

@Injectable()
export class TransactionsDb extends CommonDb<TransactionEntity> {
  constructor(
    @InjectRepository(TransactionEntity) private readonly transactionEntity: Repository<TransactionEntity>,
  ) {
    super(transactionEntity);
  }
}