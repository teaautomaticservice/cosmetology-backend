import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { LogEntity } from 'src/domain/repositories/entities/log/log.entity';
import { Pagination } from 'src/domain/repositories/types/common.types';

@Injectable()
export class LogsDb {
  constructor(
    @InjectRepository(LogEntity)
    private readonly logsRepository: Repository<LogEntity>,
  ) {}

  public async findAndCount({pagination}: {
    pagination: Pagination,
  }) {
    const offset = this.getOffset(pagination);
    return Promise.all([
      this.logsRepository.find({
        ...offset,
      }),
      this.logsRepository.count({
        ...offset,
      })
    ])
  }

  private getOffset({ pageSize, page }: Pagination) {
    return {
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    }
  }
}