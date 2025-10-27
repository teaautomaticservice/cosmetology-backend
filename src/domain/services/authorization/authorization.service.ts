import { v4 as uuid } from 'uuid';

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SessionEntity } from '@providers/postgresql/repositories/sessions/session.entity';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';
import { SessionsProvider } from '@providers/sessions/sessions.provider';
import { TokensCreatedUsersProvider } from '@providers/tokensCreatedUsers/tokensCreatedUsers.provider';
import { UsersProvider } from '@providers/users/users.provider';
import { AuthorizationCookies } from '@typings/cookies.types';
import { UserStatus } from '@typings/users.types';
import { cryptoUtils } from '@utils/cryptoUtils';
import { dateUtils } from '@utils/dateUtils';

import { AuthorizationLogin } from './authorization.types';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly usersProviders: UsersProvider,
    private readonly sessionsProvider: SessionsProvider,
    private readonly tokensCreatedUsersProvider: TokensCreatedUsersProvider,
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
      throw new BadRequestException('Credentials not correct');
    }

    const isPasswordCompared = await cryptoUtils.compare(password, user.password);

    if (!isPasswordCompared) {
      throw new BadRequestException('Credentials not correct');
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

  public async loginByUserToken({
    userToken,
    cookies,
  }: {
    userToken: string;
    cookies?: AuthorizationCookies;
  }): Promise<{ user: UserEntity; session: SessionEntity } | null> {
    const userId = await this.tokensCreatedUsersProvider.getUserIdByToken(userToken);
    if (!userId) {
      throw new BadRequestException('token is expired or incorrect');
    }

    const user = await this.usersProviders.findById(userId);
    if (!user) {
      throw new BadRequestException('token is expired or incorrect');
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
      throw new BadRequestException('Session not correct');
    }

    const result = await this.sessionsProvider.deleteBySessionId(cookies.session);
    if (!result) {
      throw new BadRequestException('Session not found');
    }

    return true;
  }

  public async clearExpiredSessions(): Promise<{ count: number }> {
    return this.sessionsProvider.clearExpiredSessions();
  }

  public async setupNewPassword(
    currentUser: UserEntity,
    {
      password,
      repeatPassword,
    }: {
      password: string;
      repeatPassword: string;
    }
  ): Promise<UserEntity> {
    if (currentUser.status !== UserStatus.Pending || password !== repeatPassword) {
      throw new BadRequestException(`Passwords didn't match`);
    }

    const hashedPassword = await cryptoUtils.encryptPassword(password);

    const result = await this.usersProviders.updateById(currentUser.id, {
      status: UserStatus.Active,
      password: hashedPassword,
    });

    const updatedUser = await this.usersProviders.findById(currentUser.id);

    if (!updatedUser || !result) {
      throw new InternalServerErrorException(`Error update user: ${currentUser}`);
    }

    return updatedUser;
  }

  private async createSession(user: UserEntity): Promise<SessionEntity> {
    return this.sessionsProvider.create({
      expireAt: dateUtils.add(new Date(), 1, 'month'),
      userId: user.id,
      sessionId: uuid()
    });
  }
}