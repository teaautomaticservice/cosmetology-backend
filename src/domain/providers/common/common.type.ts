import { CommonEntity } from '@providers/postgresql/repositories/common/common.entity';

export type ID = number;

export type WithID<Type> = Type & {
  id: ID;
};

export type RecordEntity<T extends CommonEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export interface Pagination {
  page: number;
  pageSize: number;
}
