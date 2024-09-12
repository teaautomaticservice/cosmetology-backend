export type RecordEntity<T> = Omit<T, 'id'>;

export interface Pagination {
  page: number;
  pageSize: number;
}
