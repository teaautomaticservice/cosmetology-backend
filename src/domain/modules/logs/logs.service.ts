import { Injectable } from '@nestjs/common';
import { Pagination } from 'src/domain/repositories/types/common.types';
import { LogsDb } from './logs.db';

@Injectable()
export class LogsService {
  constructor(private readonly logRepository: LogsDb) {}

  async getLogsList(params: {
    pagination: Pagination,
  }) {
    const { page, pageSize } = params.pagination;
    const [logs, count] = await this.logRepository.findAndCount(params);
    return {
      data: logs,
      meta: {
        count,
        page,
        pageSize,
      }
    };
  }

}