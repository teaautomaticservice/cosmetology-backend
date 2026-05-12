import {
  DeepPartial,
  EntityTarget,
  FindOptionsOrder,
  FindOptionsWhere,
  UpdateResult
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  AggregatedEntity,
  AggregateRecord,
  Where
} from '@postgresql/repositories/common/common.types';
import { CommonEntity } from '@providers/postgresql/repositories/common/common.entity';

import { ID, RecordEntity, TxContext, TxOpsDeps } from './common.type';

interface CreateAuditFields {
  createdAt: Date;
  updatedAt: Date;
  createdBy: ID | null;
  updatedBy: ID | null;
}

interface UpdateAuditFields {
  updatedAt: Date;
  updatedBy: ID | null;
}

interface ReadOptions {
  forUpdate?: boolean;
}

export abstract class CommonTxOps<Entity extends CommonEntity> {
  protected readonly manager: TxOpsDeps['manager'];
  protected readonly context: TxContext;
  protected readonly entityClass: EntityTarget<Entity>;
  protected readonly alias: string;

  constructor(
    { manager, context }: TxOpsDeps,
    entityClass: EntityTarget<Entity>,
    alias: string,
  ) {
    this.manager = manager;
    this.context = context;
    this.entityClass = entityClass;
    this.alias = alias;
  }

  protected async findById(id: Entity['id'], options: ReadOptions = {}): Promise<Entity | null> {
    const qb = this.manager
      .createQueryBuilder(this.entityClass, this.alias)
      .where(`${this.alias}.id = :id`, { id });

    if (options.forUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  protected async findByIds(ids: Entity['id'][], options: ReadOptions = {}): Promise<Entity[]> {
    if (!ids.length) return [];

    const qb = this.manager
      .createQueryBuilder(this.entityClass, this.alias)
      .where(`${this.alias}.id IN (:...ids)`, { ids });

    if (options.forUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getMany();
  }

  protected async find({
    order,
    limit,
    forUpdate,
    where,
  }: {
    order?: FindOptionsOrder<Entity>;
    limit?: number;
    forUpdate?: boolean;
    where: Where<Entity>;
  }): Promise<Entity[]> {
    return this.manager.find(this.entityClass, {
      where,
      order,
      take: limit,
      lock: forUpdate ? { mode: 'pessimistic_write' } : undefined,
    });
  }

  protected async findOne({
    order,
    forUpdate,
    where,
  }: {
    order?: FindOptionsOrder<Entity>;
    forUpdate?: boolean;
    where: Where<Entity>;
  }): Promise<Entity | null> {
    return this.manager.findOne(this.entityClass, {
      where,
      order,
      lock: forUpdate ? { mode: 'pessimistic_write' } : undefined,
    });
  }

  protected async aggregate<
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
    having,
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
    having?: {
      field: keyof Aggregates;
      fn: 'SUM' | 'COUNT' | 'AVG';
      from?: number;
      to?: number;
    }[];
  } = {}): Promise<AggregatedEntity<Entity, Select, Aggregates>> {
    const queryBuilder = this.manager.createQueryBuilder(this.entityClass, this.alias);
    queryBuilder.select([]);

    if (where) {
      queryBuilder.andWhere(where);
    }

    if (Array.isArray(groupBy)) {
      groupBy.forEach((field) => queryBuilder.addGroupBy(`${this.alias}.${field as string}`));
    }

    if (Array.isArray(select)) {
      select.forEach((field) =>
        queryBuilder.addSelect(`${this.alias}.${field as string}`, field as string),
      );
    }

    if (aggregates) {
      Object.entries(aggregates).forEach(([currentAlias, { fn, field }]) => {
        queryBuilder.addSelect(
          `${fn}(${this.alias}.${String(field)})`,
          currentAlias,
        );
      });
    }

    if (having) {
      having.forEach(({ field, fn, from, to }) => {
        if (from) {
          queryBuilder.andHaving(
            `${fn}(${this.alias}.${String(field)}) >= :${String(field)}From`,
            { [`${String(field)}From`]: from },
          );
        }
        if (to) {
          queryBuilder.andHaving(
            `${fn}(${this.alias}.${String(field)}) <= :${String(field)}To`,
            { [`${String(field)}To`]: to },
          );
        }
      });
    }

    const orderableKeys = groupBy && Array.isArray(groupBy)
      ? new Set<string>(groupBy.map((field) => field as string))
      : null;

    Object.entries(order).forEach(([key, value]) => {
      if (orderableKeys && !orderableKeys.has(key)) {
        return;
      }
      queryBuilder.addOrderBy(
        `${this.alias}.${key}`,
        value === 1 || value === 'ASC' ? 'ASC' : 'DESC',
      );
    });

    if (offset?.skip) {
      queryBuilder.skip(offset.skip);
    }
    if (offset?.take) {
      queryBuilder.take(offset.take);
    }

    return queryBuilder.getRawMany() as Promise<AggregatedEntity<Entity, Select, Aggregates>>;
  }

  protected async create(data: RecordEntity<Entity>): Promise<Entity> {
    const entity = this.manager.create(this.entityClass, {
      ...data,
      ...this.createAuditFields(),
    } as DeepPartial<Entity>);

    return this.manager.save(entity);
  }

  protected async updateById(
    id: Entity['id'],
    data: Partial<RecordEntity<Entity>>,
  ): Promise<UpdateResult> {
    return this.manager.update(
      this.entityClass,
      id as FindOptionsWhere<Entity>,
      {
        ...data,
        ...this.updateAuditFields(),
      } as QueryDeepPartialEntity<Entity>,
    );
  }

  protected async deleteById(id: Entity['id']): Promise<UpdateResult> {
    return this.manager.update(
      this.entityClass,
      id as FindOptionsWhere<Entity>,
      {} as QueryDeepPartialEntity<Entity>,
    );
  }

  protected createAuditFields(): CreateAuditFields {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
      createdBy: this.context.userId,
      updatedBy: this.context.userId,
    };
  }

  protected updateAuditFields(): UpdateAuditFields {
    return {
      updatedAt: new Date(),
      updatedBy: this.context.userId,
    };
  }
}