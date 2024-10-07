import { Injectable } from '@nestjs/common';

import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';
import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';

@Injectable()
export class UsersProviders extends CommonPostgresqlProvider<UserEntity> {
  constructor(private readonly usersDb: UsersDb) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.usersDb.findOne({ where: { email } });
  }
}