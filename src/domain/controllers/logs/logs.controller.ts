import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Pagination } from '@providers/common/common.type';
import { QueryInt } from '@query/queryInt';
import { LogsService } from '@services/logs/logs.service';

import { LogsPaginatedDto } from './dtos/logsPaginated.dto';

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
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number
  ): Promise<LogsPaginatedDto> {
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
