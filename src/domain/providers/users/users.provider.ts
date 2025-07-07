import { Injectable } from '@nestjs/common';

import { RecordEntity } from '../common/common.type';
import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProvider extends CommonPostgresqlProvider<UserEntity> {
  constructor(private readonly usersDb: UsersDb) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.usersDb.findOne({ where: { email } });
  }

  public async createUser(newUserData: RecordEntity<UserEntity>): Promise<UserEntity | null> {
    return this.create(newUserData);
  }
}