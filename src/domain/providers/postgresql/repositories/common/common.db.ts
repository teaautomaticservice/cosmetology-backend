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
import { Where } from './common.types';

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
}