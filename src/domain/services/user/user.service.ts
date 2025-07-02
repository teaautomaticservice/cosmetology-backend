import { EMAIL_ERROR, entityNotFound, VALIDATION_ERROR } from '@domain/constants/errors';
import { FoundAndCounted, ID, Pagination } from '@domain/providers/common/common.type';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { UsersProvider } from '@domain/providers/users/users.provider';
import { UserStatus } from '@domain/types/users.types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { cryptoUtils } from '@utils/cryptoUtils';
import { generateRandomString } from '@utils/generateRanomString';

import { Mailer } from '../mailer/mailer.service';

@Injectable()
export class UserService {
  constructor(
    private readonly usersProvider: UsersProvider,
    private readonly mailer: Mailer,
  ) { }

  public async getUsersList({
    pagination,
  }: {
    pagination: Pagination;
  }): Promise<FoundAndCounted<UserEntity>> {
    return this.usersProvider.findAndCount({ pagination });
  }

  public async getUserById(id: ID): Promise<UserEntity | null> {
    return this.usersProvider.findById(id);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    return this.usersProvider.getByEmail(lowerEmail);
  }

  public async createUser({
    email,
    type,
    displayName,
  }: Pick<UserEntity, 'email' | 'type' | 'displayName'>): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    const matchedByEmail = await this.getByEmail(lowerEmail);

    if (matchedByEmail) {
      throw new BadRequestException(VALIDATION_ERROR, { cause: { email: [EMAIL_ERROR] } });
    }

    const newPassword = generateRandomString();
    const newHashedPassword = await cryptoUtils.encryptPassword(newPassword);

    await this.mailer.sendConfirmEmail({ email: lowerEmail });

    const resp = await this.usersProvider.createUser({
      email,
      password: newHashedPassword,
      status: UserStatus.Pending,
      type,
      displayName,
    });

    return resp;
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

    const { email } = user;

    await this.mailer.sendConfirmEmail({ email });

    return this.getUserById(userId);
  }
}