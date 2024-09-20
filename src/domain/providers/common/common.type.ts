export type ID = number;

export type WithID<Type> = Type & {
  id: ID;
};

export type RecordEntity<T> = Omit<T, 'id'>;

export interface Pagination {
  page: number;
  pageSize: number;
}
