import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { EMAIL_ERROR, entityNotFound, VALIDATION_ERROR } from '@domain/constants/errors';
import { FoundAndCounted, ID, Pagination } from '@domain/providers/common/common.type';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { TokensCreatedUsersProvider } from '@domain/providers/tokensCreatedUsers/tokensCreatedUsers.provider';
import { UsersProvider } from '@domain/providers/users/users.provider';
import { UserStatus } from '@domain/types/users.types';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { cryptoUtils } from '@utils/cryptoUtils';
import { generateRandomString } from '@utils/generateRandomString';

import { Mailer } from '../mailer/mailer.service';

@Injectable()
export class UserService {
  constructor(
    private readonly usersProvider: UsersProvider,
    private readonly mailer: Mailer,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
    private readonly tokensCreatedUsersProvider: TokensCreatedUsersProvider,
  ) { }

  public async getUsersList({
    pagination,
  }: {
    pagination: Pagination;
  }): Promise<FoundAndCounted<UserEntity>> {
    return this.usersProvider.findAndCount({ pagination });
  }

  public async getUserById(id: ID): Promise<UserEntity | null> {
    if (!id) {
      throw new InternalServerErrorException('Error find user by id. Id should be exist');
    }
    return this.usersProvider.findById(id);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    return this.usersProvider.getByEmail(lowerEmail);
  }

  public async createUserByAmin({
    email,
    type,
    displayName,
  }: Pick<UserEntity, 'email' | 'type' | 'displayName'>): Promise<UserEntity> {
    const lowerEmail = email.toLocaleLowerCase();
    const matchedByEmail = await this.getByEmail(lowerEmail);

    if (matchedByEmail) {
      throw new BadRequestException(VALIDATION_ERROR, { cause: { email: [EMAIL_ERROR] } });
    }

    const newPassword = generateRandomString();
    const newHashedPassword = await cryptoUtils.encryptPassword(newPassword);

    const newUser = await this.usersProvider.createUser({
      email,
      password: newHashedPassword,
      status: UserStatus.Pending,
      type,
      displayName,
    });

    if (!newUser) {
      throw new InternalServerErrorException('createUserByAmin. User not created.');
    }

    const userToken = generateRandomString(60, {
      isNumberChars: true,
      isSpecialChars: false,
    });
    this.tokensCreatedUsersProvider.addNewUserToken(newUser.id, userToken);

    await this.mailer.sendConfirmEmailCreatedByAdmin({
      email: newUser.email,
      displayName: UserEntity.getDisplayName(newUser),
      userToken
    });

    this.logger.info('User has been created by admin', newUser);

    return newUser;
  }

  public async initiateHardResetPassword({
    userId,
  }: {
    userId: ID;
  }): Promise<UserEntity | null> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new BadRequestException(VALIDATION_ERROR, { cause: { id: [entityNotFound('User')] } });
    }

    await this.mailer.sendInstructionsForSetNewPassword({
      email: user.email,
      displayName: UserEntity.getDisplayName(user),
    });

    const updatedUser = await this.getUserById(userId);

    this.logger.info('Admin initiated hard reset password for user', updatedUser);

    return updatedUser;
  }

  public async restartCompleteRegistration({
    userId,
  }: {
    userId: ID;
  }): Promise<UserEntity | null> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== UserStatus.Pending) {
      throw new BadRequestException('User status is not the pending');
    }

    const userToken = generateRandomString(60, {
      isNumberChars: true,
      isSpecialChars: false,
    });
    this.tokensCreatedUsersProvider.addNewUserToken(user.id, userToken);

    await this.mailer.sendConfirmEmailCreatedByAdmin({
      email: user.email,
      displayName: UserEntity.getDisplayName(user),
      userToken
    });

    this.logger.info('User has been created by admin', user);

    return user;
  }
}