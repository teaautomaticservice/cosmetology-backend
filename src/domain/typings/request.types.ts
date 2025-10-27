import { Request } from 'express';

import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';

export type RequestApp = Request & {
  user: UserEntity | null;
}