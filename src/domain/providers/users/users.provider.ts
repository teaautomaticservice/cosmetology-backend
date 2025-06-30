import { EMAIL_ERROR, VALIDATION_ERROR } from '@domain/constants/errors';
import { Mailer } from '@domain/services/mailer/mailer.service';
import { UserStatus } from '@domain/types/users.types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { generateRandomString } from '@utils/generateRanomString';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProvider extends CommonPostgresqlProvider<UserEntity> {
  constructor(
    private readonly usersDb: UsersDb,
    private readonly mailer: Mailer,
  ) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    return this.usersDb.findOne({ where: { email: lowerEmail } });
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

    await this.mailer.sendConfirmEmail({ email: lowerEmail });

    const resp = await this.create({
      email,
      password: newPassword,
      status: UserStatus.Pending,
      type,
      displayName,
    });

    return resp;
  }
}