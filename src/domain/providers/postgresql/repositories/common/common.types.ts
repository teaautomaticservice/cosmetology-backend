import { FindManyOptions } from 'typeorm';

export type Where<Entity> = FindManyOptions<Entity>['where'];

export type SelectKEys<
  Entity extends object,
  GroupBy extends (keyof Entity)[]
> = GroupBy extends undefined ? (keyof Entity)[] :
  GroupBy extends [] ? [number][] : never;

export type AggregationFn = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';

export type AggregateRecord<Entity extends object> = Record<string, { fn: AggregationFn; field: keyof Entity }>;

export type AggregatedEntity<
  Entity extends object,
  Select extends (keyof Entity)[] | undefined,
  Aggregates extends AggregateRecord<Entity> | undefined = undefined,
> = Array<((
  Select extends undefined ?
  // eslint-disable-next-line @typescript-eslint/ban-types
  {} :
  Select extends (keyof Entity)[] ?
  Pick<Entity, Select[number]> | undefined :
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
) & (
    Aggregates extends undefined ?
    // eslint-disable-next-line @typescript-eslint/ban-types
    {} :
    Aggregates extends AggregateRecord<Entity> ?
    { [K in keyof Aggregates]: Entity[Aggregates[K]['field']] } :
    // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  )) | undefined>
