import { QueryInt } from '@decorators/queryInt';
import { AuthGuard } from '@domain/controllers/common/guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CASHIER_CURRENCIES_PATH } from '../cashier.paths';

@ApiTags('Cashier', 'Currencies')
@Controller(CASHIER_CURRENCIES_PATH)
export class CurrenciesController {
  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of currencies successful has been got',
    // type: HistoryPaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<unknown> {
    // console.log('Currencies');

    return {
      data: [],
      meta: {
        count: 0,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }
}