import { CommonEntity } from '@providers/postgresql/repositories/common/common.entity';

export type ID = number;

export type WithID<Type> = Type & {
  id: ID;
};

export type RecordEntity<T extends CommonEntity> =
  Omit<
    T,
    Extract<
      'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy',
      keyof T>
  > &
  Partial<
    Pick<
      T,
      Extract<
        'createdBy' | 'updatedBy',
        keyof T
      >
    >
  >;

export interface Pagination {
  page: number;
  pageSize: number;
}

export type FoundAndCounted<Entity> = [Entity[], number];
