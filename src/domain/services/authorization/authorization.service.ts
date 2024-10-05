import { Injectable } from '@nestjs/common';
import { UsersDb } from '@providers/postgresql/repositories/users/users.db';

import { AuthorizationLogin } from './authorization.types';

@Injectable()
export class AuthorizationService {
  constructor(private readonly usersDb: UsersDb) {}

  public async loginByPassword({
    loginData,
  }: {
    loginData: AuthorizationLogin;
  }) {
    const [users, count] = await this.usersDb.findAllSpecified({});
    console.log('loginByPassword', loginData);
    console.log('users', users, count);
  }
}