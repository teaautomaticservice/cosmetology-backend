import { compare } from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { SessionEntity } from '@domain/providers/postgresql/repositories/sessions/session.entity';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { SessionsProvider } from '@domain/providers/sessions/sessions.provider';
import { UsersProviders } from '@domain/providers/users/users.provider';
import { AuthorizationCookies } from '@domain/types/cookies.types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { dateUtils } from '@utils/dateUtils';

import { AuthorizationLogin } from './authorization.types';

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

  public async getUserBySessionId(sessionId: string): Promise<UserEntity | null> {
    const session = await this.sessionsProvider.findBySessionId(sessionId);

    if (session == null) {
      return null;
    }

    return this.usersProviders.findById(session.userId);
  }

  public async logOut(cookies?: AuthorizationCookies): Promise<boolean> {
    if (cookies?.session == null) {
      throw new HttpException('Session not correct', HttpStatus.FORBIDDEN);
    }

    const result = await this.sessionsProvider.deleteBySessionId(cookies.session);
    if (!result) {
      throw new HttpException('Session not found', HttpStatus.FORBIDDEN);
    }

    return true;
  }

  public async clearExpiredSessions(): Promise<{ count: number }> {
    return this.sessionsProvider.clearExpiredSessions();
  }

  private async createSession(user: UserEntity): Promise<SessionEntity> {
    return this.sessionsProvider.create({
      expireAt: dateUtils.add(new Date(), 1, 'month'),
      userId: user.id,
      sessionId: uuid()
    });
  }
}