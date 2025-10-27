import { ID } from '@providers/common/common.type';
import { CommonEntity } from '@providers/postgresql/repositories/common/common.entity';

export const createdMapFromEntity = <T extends CommonEntity>(entities: T[], key: keyof T = 'id'): Record<ID, T | undefined> =>
  entities.reduce<Record<ID, T>>((acc, val) => {
    // eslint-disable-next-line no-param-reassign
    acc[val[key as string]] = val;
    return acc;
  }, {});