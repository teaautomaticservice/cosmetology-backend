import { FindManyOptions, LessThan, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pagination } from '@providers/common/common.type';

import { LogEntity } from './log.entity';
import { SpecifiedLogsClear } from './logs.types';

@Injectable()
export class LogsDb {
  constructor(
    @InjectRepository(LogEntity)
    private readonly logsRepository: Repository<LogEntity>,
  ) {}

  public async findAndCount({ pagination }: { pagination: Pagination }) {
    const offset = this.getOffset(pagination);
    const sort = this.getSort();
    return Promise.all([
      this.logsRepository.find({
        ...offset,
        ...sort,
      }),
      this.logsRepository.count({
        ...offset,
      }),
    ]);
  }

  public async clearLogs({
    specified,
  }: {
    specified?: SpecifiedLogsClear;
  }): Promise<{ count: number }> {
    const where: FindManyOptions<LogEntity>['where'] = [];

    if (specified) {
      Object.entries(specified.types ?? {}).map(([key, val]) => {
        where.push({
          level: key,
          timestamp: LessThan(val),
        });
      });
    }

    const entities = await this.logsRepository.find({
      where,
    });

    if (entities.length) {
      await this.logsRepository.delete(entities.map(({ id }) => id));
    }

    return { count: entities.length };
  }

  private getOffset({ pageSize, page }: Pagination) {
    return {
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    };
  }

  private getSort(): FindManyOptions<LogEntity> {
    return {
      order: {
        timestamp: -1,
      },
    };
  }
}
