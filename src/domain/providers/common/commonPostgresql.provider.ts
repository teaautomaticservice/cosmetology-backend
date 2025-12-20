import {
  DeepPartial,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  In
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { FoundAndCounted, Pagination, RecordEntity } from './common.type';
import { CommonDb } from '../postgresql/repositories/common/common.db';
import { CommonEntity } from '../postgresql/repositories/common/common.entity';
import { Where } from '../postgresql/repositories/common/common.types';

export abstract class CommonPostgresqlProvider<Entity extends CommonEntity> {
  protected readonly db: CommonDb<Entity>;

  constructor(db: CommonDb<Entity>) {
    this.db = db;
  }

  protected async findById(id: Entity['id']): Promise<Entity | null> {
    const where = {
      id,
    } as FindOptionsWhere<Entity>;
    return this.db.findOne({
      where,
    });
  }

  protected async findByIds(
    ids: Entity['id'][],
    {
      where,
    }: {
      where?: Where<Entity>;
    } = {}
  ): Promise<Entity[] | null> {
    const currentWhere = {
      ...where,
      id: In(ids),
    } as FindOptionsWhere<Entity>;
    return this.db.find({
      where: currentWhere,
    });
  }

  protected async findAndCount({
    pagination,
    order,
    where,
    relations,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<Entity>;
    where?: Where<Entity>;
    relations?: FindOneOptions<Entity>['relations'];
  }): Promise<FoundAndCounted<Entity>> {
    const offset = this.getOffset(pagination);

    return Promise.all([
      this.db.find({
        offset,
        order,
        where,
        relations,
      }),
      this.db.count({ where }),
    ]);
  }

  protected async create(data: RecordEntity<Entity>): Promise<Entity> {
    return this.db.create(data as DeepPartial<Entity>);
  }

  protected async updateById(id: Entity['id'], data: Partial<RecordEntity<Entity>>): Promise<boolean> {
    const { affected } = await this.db.updateById(id, data as QueryDeepPartialEntity<Entity>);
    return affected != null && affected > 0;
  }

  protected async updateByIds(ids: Entity['id'][], data: Partial<RecordEntity<Entity>>): Promise<boolean> {
    const { affected } = await this.db.updateByIds(ids, data as QueryDeepPartialEntity<Entity>);
    return affected != null && affected > 0;
  }

  protected getOffset({ pageSize, page }: Pagination): {
    skip: number;
    take: number;
  } {
    return {
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    };
  }
}