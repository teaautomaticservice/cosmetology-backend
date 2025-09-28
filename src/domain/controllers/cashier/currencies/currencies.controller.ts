import { QueryInt } from '@decorators/queryInt';
import { AuthGuard } from '@domain/controllers/common/guards/auth.guard';
import { CashierService } from '@domain/services/cashier/cashier.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrencyDto } from './dtos/currency.dto';
import { CurrencyPaginatedDto } from './dtos/historyPaginated.dto';
import { CASHIER_CURRENCIES_PATH } from '../cashier.paths';

@ApiTags('Cashier', 'Currencies')
@Controller(CASHIER_CURRENCIES_PATH)
export class CurrenciesController {
  constructor(
    private readonly cashierService: CashierService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of currencies successful has been got',
    type: CurrencyPaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<CurrencyPaginatedDto> {
    const [data, count] = await this.cashierService.getCurrenciesList({
      pagination: {
        page,
        pageSize,
      }
    });

    return {
      data: data.map((currency) => new CurrencyDto(currency)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }
}