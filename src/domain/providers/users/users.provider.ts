import { Injectable } from '@nestjs/common';

import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProviders {
  constructor(private readonly usersDb: UsersDb) {}

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.usersDb.findOne({ where: { email } });
  }
}