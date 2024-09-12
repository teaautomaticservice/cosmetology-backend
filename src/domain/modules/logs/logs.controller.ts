import { Controller, Get, Query } from '@nestjs/common';

import { Pagination } from 'src/domain/repositories/types/common.types';

import { LogsService } from './logs.service';
import { LogsPaginatedDto } from './dto/logsPaginated.dto';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Logs')
@Controller('/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('/list')
  @ApiParam({ name: 'page', type: 'string', required: false })
  @ApiParam({ name: 'pageSize', type: 'string', required: false })
  @ApiOkResponse({
    description: 'List of logs successful has been got',
    type: LogsPaginatedDto,
  })
  async getList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<LogsPaginatedDto> {
    const pagination: Pagination = {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    };

    const [items, count] = await this.logsService.getLogsList({
      pagination,
    });

    return {
      data: items,
      meta: {
        count: count,
        currentPage: pagination.page,
        itemsPerPage: pagination.pageSize,
      },
    };
  }
}
