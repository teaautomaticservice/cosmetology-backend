/* eslint-disable no-param-reassign */
import { ID } from '@domain/providers/common/common.type';
import { CommonEntity } from '@domain/providers/postgresql/repositories/common/common.entity';

export const createdMapListFromEntity = <T extends CommonEntity>(entities: T[], key: keyof T = 'id'): Record<ID, T[] | undefined> =>
  entities.reduce<Record<ID, T[]>>((acc, val) => {
    if (Array.isArray(acc[val[key as string]])) {
      acc[val[key as string]].push(val);
    } else {
      acc[val[key as string]] = [val];
    }
    return acc;
  }, {});