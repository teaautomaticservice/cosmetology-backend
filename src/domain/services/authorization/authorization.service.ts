import { compare } from 'bcrypt';

import { UsersProviders } from '@domain/providers/users/users.provider';
import { Injectable } from '@nestjs/common';

import { AuthorizationLogin } from './authorization.types';

@Injectable()
export class AuthorizationService {
  constructor(private readonly usersProviders: UsersProviders) {}

  public async loginByPassword({
    loginData,
  }: {
    loginData: AuthorizationLogin;
  }) {
    const { email, password } = loginData;
    const user = await this.usersProviders.getByEmail(email);

    const passCheck = user ? await compare(password, user.password) : false;
    console.log('users', user, passCheck);
  }
}