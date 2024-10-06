import { DeepPartial, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { FoundAndCounted, Pagination, RecordEntity } from './common.type';
import { CommonRepository } from '../postgresql/repositories/common/common.db';
import { CommonEntity } from '../postgresql/repositories/common/common.entity';

export abstract class CommonPostgresqlProvider<Entity extends CommonEntity> {
  protected readonly db: CommonRepository<Entity>;

  constructor(db: CommonRepository<Entity>) {
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

  public async findAndCount({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<Entity>;
  }): Promise<FoundAndCounted<Entity>> {
    const offset = this.getOffset(pagination);
    const currentOrder = {
      createdAt: -1,
      ...order,
    } as FindOptionsOrder<Entity>;

    return Promise.all([
      this.db.find({
        ...offset,
        order: currentOrder,
      }),
      this.db.count(),
    ]);
  }

  public async create(data: RecordEntity<Entity>): Promise<Entity> {
    return this.db.create(data as DeepPartial<Entity>);
  }

  public async updateById(id: Entity['id'], data: Partial<RecordEntity<Entity>>): Promise<boolean> {
    await this.db.updateById(id, data as QueryDeepPartialEntity<Entity>);
    return true;
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