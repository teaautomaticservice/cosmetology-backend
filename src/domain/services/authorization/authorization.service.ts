import { compare } from 'bcrypt';

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
    const { email, password } = loginData;
    const user = await this.usersDb.findSpecified({
      where: {
        email,
      }
    });

    const passCheck = user ? await compare(password, user.password) : false;
    console.log('users', user, passCheck);
  }
}