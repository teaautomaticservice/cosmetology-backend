import { compare } from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { SessionEntity } from '@domain/providers/postgresql/repositories/sessions/session.entity';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { SessionsProvider } from '@domain/providers/sessions/sessions.provider';
import { UsersProviders } from '@domain/providers/users/users.provider';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AuthorizationLogin } from './authorization.types';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly usersProviders: UsersProviders,
    private readonly sessionsProvider: SessionsProvider,
  ) {}

  public async login({
    loginData,
  }: {
    loginData: AuthorizationLogin;
  }): Promise<{ user: UserEntity; session: SessionEntity }> {
    const { email, password } = loginData;
    const user = await this.usersProviders.getByEmail(email);

    if (user == undefined) {
      throw new HttpException('Credentials not correct', HttpStatus.FORBIDDEN);
    }

    const isPasswordCompared = await compare(password, user.password);

    if (!isPasswordCompared) {
      throw new HttpException('Credentials not correct', HttpStatus.FORBIDDEN);
    }

    const session = await this.createSession(user);

    return { user, session };
  }

  private async createSession(user: UserEntity): Promise<SessionEntity> {
    return this.sessionsProvider.create({
      expireAt: new Date(),
      userId: user.id,
      sessionId: uuid()
    });
  }
}