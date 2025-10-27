import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CashierService } from '@services/cashier/cashier.service';

import { CreateCurrencyDto } from './dtos/createCurrency.dto';
import { CurrencyDto } from './dtos/currency.dto';
import { CurrencyPaginatedDto } from './dtos/currencyPaginated.dto';
import { CASHIER_CURRENCIES_PATH } from '../cashier.paths';

@ApiTags('Cashier')
@Controller(CASHIER_CURRENCIES_PATH)
export class CurrenciesController {
  constructor(
    private readonly cashierService: CashierService,
  ) { }

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

  @UseGuards(AuthGuard)
  @Post('/create')
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiBody({
    description: 'Create currency body',
    type: CreateCurrencyDto,
  })
  @ApiOkResponse({
    description: 'New currency successful created',
    type: CurrencyPaginatedDto,
  })
  public async createCurrency(
    @Body() currencyReq: CreateCurrencyDto,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<CurrencyPaginatedDto> {
    const currentPage = 1;
    const [data, count] = await this.cashierService.createCurrency({
      data: currencyReq,
      pagination: {
        pageSize,
        page: currentPage,
      }
    });
    return {
      data: data.map((currency) => new CurrencyDto(currency)),
      meta: {
        count,
        currentPage,
        itemsPerPage: pageSize,
      },
    };
  }
}