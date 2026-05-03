import { DeepPartial, EntityTarget, FindOptionsWhere, UpdateResult } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

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