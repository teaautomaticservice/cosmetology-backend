import { FindManyOptions } from 'typeorm';

export type Where<Entity> = FindManyOptions<Entity>['where'];

export type SelectKEys<
  Entity extends object,
  GroupBy extends (keyof Entity)[]
> = GroupBy extends undefined ? (keyof Entity)[] :
  GroupBy extends [] ? [number][] : never;

export type AggregatedEntity<
  Entity extends object,
  Select extends (keyof Entity)[] | undefined
> = Select extends undefined
  // eslint-disable-next-line @typescript-eslint/ban-types
  ? {}[]
  : Select extends (keyof Entity)[]
  ? Pick<Entity, Select[number]>[] | undefined[]
  // eslint-disable-next-line @typescript-eslint/ban-types
  : {}[];

