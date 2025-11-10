import {
  DeepPartial,
  FindOptionsOrder,
  Repository,
  UpdateResult
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { Inject } from '@nestjs/common';
import { AsyncContext } from '@utils/asyncContext';

import { CommonEntity } from './common.entity';
import { AggregatedEntity, AggregateRecord, Where } from './common.types';

export abstract class CommonDb<Entity extends CommonEntity> {
  @Inject(Resources.AsyncContext) public readonly asyncContext: AsyncContext;
  @Inject(Resources.LOGGER) public readonly logger: Logger;

  private readonly dbRepository: Repository<Entity>;

  protected constructor(dbRepository: Repository<Entity>) {
    this.dbRepository = dbRepository;
  }

  public findOne({
    where,
  }: {
    where?: Where<Entity>;
  }): Promise<Entity | null> {
    return this.dbRepository.findOne({ where });
  }

  public find({
    where,
    order = {},
    offset,
  }: {
    where?: Where<Entity>;
    order?: FindOptionsOrder<Entity>;
    offset?: {
      skip: number;
      take: number;
    };
  } = {}): Promise<Entity[]> {
    const currentOrder = {
      ...order,
      createdAt: order.createdAt ?? -1,
    } as FindOptionsOrder<Entity>;

    return this.dbRepository.find({
      where,
      order: currentOrder,
      ...(offset?.skip && { skip: offset.skip }),
      ...(offset?.take && { take: offset.take }),
    });
  }

  public count({
    where,
  }: {
    where?: Where<Entity>;
  } = {}): Promise<number> {
    return this.dbRepository.count({
      where,
    });
  }

  public async create(data: DeepPartial<Entity>): Promise<DeepPartial<Entity> & Entity> {
    const currentUser = await this.asyncContext.getUser();
    const fullData: DeepPartial<Entity> = {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id ?? null,
      updatedBy: currentUser?.id ?? null,
      ...data,
    };

    return this.dbRepository.save(fullData);
  }

  public async updateById(id: Entity['id'], data: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
    const currentUser = await this.asyncContext.getUser();
    const fullData: QueryDeepPartialEntity<Entity> = {
      updatedAt: new Date(),
      updatedBy: currentUser?.id ?? null,
      ...data,
    };
    return this.dbRepository.update(id, fullData);
  }

  public aggregate<
    GroupBy extends (keyof Entity)[] | undefined = undefined,
    Select extends (
      GroupBy extends (keyof Entity)[] ?
      GroupBy[number][] :
      (keyof Entity)[]
    ) | undefined = undefined,
    Aggregates extends AggregateRecord<Entity> | undefined = undefined,
  >({
    where,
    order = {},
    offset,
    groupBy,
    select,
    aggregates,
  }: {
    where?: Where<Entity>;
    order?: Partial<Record<
      (
        Select extends (keyof Entity)[]
        ? Select[number]
        : keyof Entity
      ) | (
        Aggregates extends AggregateRecord<Entity>
        ? keyof Aggregates
        : never
      ),
      1 | -1 | 'ASC' | 'DESC'
    >>;
    offset?: { skip: number; take: number };
    groupBy?: GroupBy;
    select?: Select;
    aggregates?: Aggregates;
  } = {}): Promise<AggregatedEntity<Entity, Select, Aggregates>> {
    const alias = this.dbRepository.metadata.tableName;

    const queryBuilder = this.dbRepository.createQueryBuilder(alias);
    queryBuilder.select([]);

    if (where) {
      queryBuilder.andWhere(where);
    }

    if (Array.isArray(groupBy)) {
      groupBy.forEach((field) => queryBuilder.addGroupBy(`${alias}.${field as string}`));
    }

    if (Array.isArray(select)) {
      select.forEach(field => queryBuilder.addSelect(`${alias}.${field as string}`, field as string));
    }

    if (aggregates) {
      Object.entries(aggregates).forEach(([currentAlias, { fn, field }]) => {
        queryBuilder.addSelect(
          `${fn}(${this.dbRepository.metadata.tableName}.${String(field)})`,
          currentAlias
        );
      });
    }

    if (groupBy && Array.isArray(groupBy)) {
      Object.entries(order).forEach(([key, value]) => {
        if (groupBy.includes(key as keyof Entity)) {
          queryBuilder.addOrderBy(`${alias}.${key}`, value === 1 ? 'ASC' : 'DESC');
        }
      });
    } else {
      Object.entries(order).forEach(([key, value]) => {
        queryBuilder.addOrderBy(`${alias}.${key}`, value === 1 ? 'ASC' : 'DESC');
      });
    }

    if (offset?.skip) {
      queryBuilder.skip(offset.skip);
    }
    if (offset?.take) {
      queryBuilder.take(offset.take);
    }

    return queryBuilder.getRawMany() as Promise<AggregatedEntity<Entity, Select, Aggregates>>;
  }

  public async aggregateCount<
    GroupBy extends (keyof Entity)[] | undefined = undefined,
  >({
    where,
    groupBy,
  }: {
    where?: Where<Entity>;
    groupBy?: GroupBy;
  } = {}): Promise<number> {
    const alias = this.dbRepository.metadata.tableName;
    const queryBuilder = this.dbRepository.createQueryBuilder(alias);
    queryBuilder.select('1');

    if (where) {
      queryBuilder.andWhere(where);
    }

    if (Array.isArray(groupBy) && groupBy.length > 0) {
      groupBy.forEach((field) => queryBuilder.addGroupBy(`${alias}.${field as string}`));
    }

    const result = await this.dbRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(`(${queryBuilder.getQuery()})`, 'subquery')
      .setParameters(queryBuilder.getParameters())
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }
}