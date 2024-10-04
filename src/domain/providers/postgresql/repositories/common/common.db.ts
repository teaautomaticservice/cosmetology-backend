import {
  DeepPartial,
  DeleteResult,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
  UpdateResult
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject } from '@nestjs/common';
import { Pagination } from '@providers/common/common.type';

import { CommonEntity } from './common.entity';
import { FoundAndCounted, Where } from './common.types';

export abstract class CommonRepository<Entity extends CommonEntity> {
  @Inject(Resources.LOGGER) private readonly logger: Logger;
  protected readonly dbRepository: Repository<Entity>;

  protected constructor(dbRepository: Repository<Entity>) {
    this.dbRepository = dbRepository;
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
      this.dbRepository.find({
        ...offset,
        order: currentOrder,
      }),
      this.dbRepository.count({
        ...offset,
      }),
    ]);
  }

  public async findById(id: Entity['id']): Promise<Entity | null> {
    const where = {
      id,
    } as FindOptionsWhere<Entity>;
    return this.dbRepository.findOne({
      where,
    });
  }

  public findAllSpecified({
    where,
  }: {
    where?: Where<Entity>;
  }): Promise<FoundAndCounted<Entity>> {
    const order = { createdAt: -1 } as FindOptionsOrder<Entity>;
    return Promise.all([
      this.dbRepository.find({ where, order }),
      this.dbRepository.count({ where }),
    ]);
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

  public deleteManyByIds(ids: Entity['id'][]): Promise<DeleteResult> {
    this.logger.info('Delete many records by ids', {
      ids,
    });
    return this.dbRepository.delete(ids);
  }

  public async deleteById(id: Entity['id']): Promise<DeleteResult> {
    this.logger.info('Delete one record by id', {
      id,
    });
    return await this.dbRepository.delete(id);
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