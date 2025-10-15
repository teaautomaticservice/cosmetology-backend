import { CommonEntity } from '@providers/postgresql/repositories/common/common.entity';

export type ID = number;

export type WithID<Type> = Type & {
  id: ID;
};

type CommonEntityKeys = keyof CommonEntity

export type RecordEntity<T extends CommonEntity> =
  Omit<
    T,
    Extract<
      CommonEntityKeys,
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

export type NewData<T> = Omit<Partial<T>, CommonEntityKeys>;

export type UpdatedEntity<T extends CommonEntity> = {
  currentId: CommonEntity['id'];
  newData: NewData<T>;
}
