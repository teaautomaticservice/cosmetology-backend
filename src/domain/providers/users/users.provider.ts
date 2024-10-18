import { Injectable } from '@nestjs/common';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProvider extends CommonPostgresqlProvider<UserEntity> {
  constructor(private readonly usersDb: UsersDb) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    return this.usersDb.findOne({ where: { email: lowerEmail } });
  }
}