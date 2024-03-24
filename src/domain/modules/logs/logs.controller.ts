import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { Pagination } from 'src/domain/repositories/types/common.types';

import { LogsService } from './logs.service';

@Controller('/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('/list')
  async getList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination: Pagination = {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    }

    return await this.logsService.getLogsList({
      pagination,
    });;
  }
}