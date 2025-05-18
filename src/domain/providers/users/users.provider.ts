import { UserStatus } from '@domain/types/users.types';
import { BadRequestException, Injectable } from '@nestjs/common';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProvider extends CommonPostgresqlProvider<UserEntity> {
  constructor(private readonly usersDb: UsersDb) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    return this.usersDb.findOne({ where: { email: lowerEmail } });
  }

  public async createUser({ email, type, displayName }: Pick<UserEntity, 'email' | 'type' | 'displayName'>): Promise<UserEntity | null> {
    const lowerEmail = email.toLocaleLowerCase();
    const matchedByEmail = await this.getByEmail(lowerEmail);

    if (matchedByEmail) {
      throw new BadRequestException('Incorrect email.', { cause: { email: ['Please enter a valid email address.'] } });
    }

    const resp = await this.create({
      email,
      password: 'test',
      status: UserStatus.Active,
      type,
      displayName,
    });

    return resp;
  }
}