import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AccountsEntity } from './accounts.entity';
import { CommonDb } from '../../common/common.db';

@Injectable()
export class AccountsDb extends CommonDb<AccountsEntity> {
  constructor(
    @InjectRepository(AccountsEntity) private readonly accountsEntity: Repository<AccountsEntity>,
  ) {
    super(accountsEntity);
  }
}