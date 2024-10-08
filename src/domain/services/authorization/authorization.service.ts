import { compare } from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { SessionEntity } from '@domain/providers/postgresql/repositories/sessions/session.entity';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { SessionsProvider } from '@domain/providers/sessions/sessions.provider';
import { UsersProviders } from '@domain/providers/users/users.provider';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AuthorizationLogin } from './authorization.types';
import { dateUtils } from '@utils/dateUtils';
import { AuthorizationCookies } from '@domain/types/cookies.types';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly usersProviders: UsersProviders,
    private readonly sessionsProvider: SessionsProvider,
  ) { }

  public async login({
    loginData,
    cookies,
  }: {
    loginData: AuthorizationLogin;
    cookies?: AuthorizationCookies;
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

    if (cookies?.session) {
      const foundSession = await this.sessionsProvider.findBySessionId(cookies.session);
      if (foundSession) {
        return { user, session: foundSession };
      }
    }

    const newSession = await this.createSession(user);

    return { user, session: newSession };
  }

  private async createSession(user: UserEntity): Promise<SessionEntity> {
    return this.sessionsProvider.create({
      expireAt: dateUtils.add(new Date(), 1, 'month'),
      userId: user.id,
      sessionId: uuid()
    });
  }
}