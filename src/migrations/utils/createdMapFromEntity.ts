import { ID } from '@domain/providers/common/common.type';
import { CommonEntity } from '@domain/providers/postgresql/repositories/common/common.entity';

export const createdMapFromEntity = <T extends CommonEntity>(entities: T[]): Record<ID, T | undefined> =>
  entities.reduce<Record<ID, T>>((acc, val) => {
    // eslint-disable-next-line no-param-reassign
    acc[val.id] = val;
    return acc;
  }, {});