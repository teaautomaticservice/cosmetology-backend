import { Request } from 'express';

import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';

export type RequestApp = Request & {
  user: UserEntity | null;
}