import { v4 as uuid } from 'uuid';

import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';
import { UserStatus, UserType } from '@typings/users.types';
import { cryptoUtils } from '@utils/cryptoUtils';

export const generateUser = async (data: Partial<UserEntity> = {}): Promise<Omit<UserEntity, 'id'>> => ({
  email: `${uuid()}@domain.cy`,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: UserStatus.Active,
  type: UserType.Client,
  password: await cryptoUtils.encryptPassword('asdf1234'),
  ...data,
});