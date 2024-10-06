import { v4 as uuid } from 'uuid';

import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { UserStatus, UserType } from '@domain/types/users.types';
import { encryptPassword } from '@utils/crypto';

export const generateUser = async (data: Partial<UserEntity> = {}): Promise<Omit<UserEntity, 'id'>> => ({
  email: `${uuid()}@domain.cy`,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: UserStatus.Active,
  type: UserType.Client,
  password: await encryptPassword('asdf1234'),
  ...data,
});