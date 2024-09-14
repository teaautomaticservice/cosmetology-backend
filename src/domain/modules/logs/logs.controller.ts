import { Controller, Get } from '@nestjs/common';

import { Pagination } from 'src/domain/repositories/types/common.types';

import { LogsService } from './logs.service';
import { LogsPaginatedDto } from './dto/logsPaginated.dto';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { QueryInt } from 'src/ambient/query/queryInt';

@ApiTags('Logs')
@Controller('/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('/list')
  @ApiParam({ name: 'page', required: false })
  @ApiParam({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of logs successful has been got',
    type: LogsPaginatedDto,
  })
  async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<LogsPaginatedDto> {
    console.log('getList');
    const pagination: Pagination = {
      page,
      pageSize,
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
