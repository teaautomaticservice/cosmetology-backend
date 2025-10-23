import { DeepPartial, FindOptionsOrder, FindOptionsWhere, In } from 'typeorm';
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

  public async findById(id: Entity['id']): Promise<Entity | null> {
    const where = {
      id,
    } as FindOptionsWhere<Entity>;
    return this.db.findOne({
      where,
    });
  }

  public async findByIds(ids: Entity['id'][]): Promise<Entity[] | null> {
    const where = {
      id: In(ids),
    } as FindOptionsWhere<Entity>;
    return this.db.find({
      where,
    });
  }

  public async findAndCount({
    pagination,
    order,
    where,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<Entity>;
    where?: Where<Entity>;
  }): Promise<FoundAndCounted<Entity>> {
    const offset = this.getOffset(pagination);

    return Promise.all([
      this.db.find({
        offset,
        order,
        where,
      }),
      this.db.count({ where }),
    ]);
  }

  public async create(data: RecordEntity<Entity>): Promise<Entity> {
    return this.db.create(data as DeepPartial<Entity>);
  }

  public async updateById(id: Entity['id'], data: Partial<RecordEntity<Entity>>): Promise<boolean> {
    const { affected } = await this.db.updateById(id, data as QueryDeepPartialEntity<Entity>);
    return affected != null && affected > 0;
  }

  private getOffset({ pageSize, page }: Pagination): {
    skip: number;
    take: number;
  } {
    return {
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    };
  }
}