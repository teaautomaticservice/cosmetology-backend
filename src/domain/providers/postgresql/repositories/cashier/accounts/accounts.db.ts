import { DeleteResult, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AccountEntity } from './accounts.entity';
import { CommonDb } from '../../common/common.db';

@Injectable()
export class AccountsDb extends CommonDb<AccountEntity> {
  constructor(
    @InjectRepository(AccountEntity) private readonly accountsEntity: Repository<AccountEntity>,
  ) {
    super(accountsEntity);
  }

  public async deleteById(id: AccountEntity['id']): Promise<DeleteResult> {
    this.logger.info('Delete one account by id', {
      id,
    });
    return await this.accountsEntity.delete(id);
  }
}