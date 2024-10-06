import {
  DeepPartial,
  FindOptionsOrder,
  Repository,
  UpdateResult
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject } from '@nestjs/common';

import { CommonEntity } from './common.entity';
import { Where } from './common.types';

export abstract class CommonRepository<Entity extends CommonEntity> {
  @Inject(Resources.LOGGER) public readonly logger: Logger;
  protected readonly dbRepository: Repository<Entity>;

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
    order,
    offset,
  }: {
    where?: Where<Entity>;
    order?: FindOptionsOrder<Entity>;
    offset?: {
      skip: number;
      take: number;
    };
  } = {}): Promise<Entity[]> {
    const currentOrder = { createdAt: -1, ...order } as FindOptionsOrder<Entity>;

    return this.dbRepository.find({
      where,
      order: currentOrder,
      ...(offset?.skip && { skip: offset.skip }),
      ...(offset?.take && { skip: offset.take }),
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
    const fullData: DeepPartial<Entity> = {
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    return this.dbRepository.save(fullData);
  }

  public async updateById(id: Entity['id'], data: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
    const fullData: QueryDeepPartialEntity<Entity> = {
      updatedAt: new Date(),
      ...data,
    };
    return this.dbRepository.update(id, fullData);
  }
}