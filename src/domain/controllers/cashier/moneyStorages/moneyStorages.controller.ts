import { ParseSortOrderPipe } from 'src/ambient/parsers/parseSortOrder';
import { ParseString } from 'src/ambient/parsers/parseString';
import { ParseObjectIdPipe } from 'src/ambient/pipes/parseIntId';

import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { ApiQuerySortOrder } from '@decorators/apiQuerySortOrder';
import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { CashierService } from '@services/cashier/cashier.service';

import { CreateMoneyStorageDto } from './dtos/createMoneyStorage.dto';
import { MoneyStorageDto } from './dtos/moneyStorage.dto';
import { MoneyStoragePaginatedDto } from './dtos/moneyStoragePaginated.dto';
import { UpdateMoneyStorageDto } from './dtos/updateMoneyStorage.dto';
import { CASHIER_MONEY_STORAGES_PATH } from '../cashier.paths';

@ApiTags('Cashier')
@Controller(CASHIER_MONEY_STORAGES_PATH)
export class MoneyStoragesController {
  constructor(
    private readonly cashierService: CashierService,
  ) { }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQueryPagination()
  @ApiQuerySortOrder(['name', 'code'] satisfies (keyof MoneyStorageDto)[])
  @ApiOkResponse({
    description: 'List of money storages successful has been got',
    type: MoneyStoragePaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @Query('sort', ParseString) sort?: keyof MoneyStorageDto,
    @Query('order', ParseSortOrderPipe) order?: 1 | -1,
  ): Promise<MoneyStoragePaginatedDto> {
    const [data, count] = await this.cashierService.getMoneyStoragesList({
      pagination: {
        page,
        pageSize,
      },
      ...(sort && {
        order: {
          [sort]: order ?? 1,
        },
      }),
    });

    return {
      data: data.map((currency) => new MoneyStorageDto(currency)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Get('/obligation-accounts')
  @ApiQueryPagination()
  @ApiOkResponse({
    description: 'Obligation account of money storages successful has been got',
    type: MoneyStoragePaginatedDto,
  })
  public async getObligationAccounts(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<MoneyStoragePaginatedDto> {
    const [data, count] = await this.cashierService.getObligationStorages({
      pagination: {
        page,
        pageSize,
      }
    });

    return {
      data: data.map((currency) => new MoneyStorageDto(currency)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Post('/obligation-accounts')
  @ApiBody({
    description: 'Create obligation storage body',
    type: CreateMoneyStorageDto,
  })
  @ApiOkResponse({
    description: 'Obligation storage successful created',
    type: MoneyStorageDto,
  })
  public async createObligationItem(
    @Body() moneyStorageReq: CreateMoneyStorageDto,
  ): Promise<MoneyStorageDto> {
    const resp = await this.cashierService.createObligationStorage({
      ...moneyStorageReq,
      description: moneyStorageReq.description ?? null,
    });
    return new MoneyStorageDto(resp);
  }

  @UseGuards(AuthGuard)
  @Patch('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    description: 'Update money storage body',
    type: UpdateMoneyStorageDto,
  })
  @ApiOkResponse({
    description: 'Money storage successful updated',
    type: MoneyStorageDto,
  })
  public async updateItem(
    @Param('id', ParseObjectIdPipe) currentId: ID,
    @Body() moneyStorageReq: UpdateMoneyStorageDto,
  ): Promise<MoneyStorageDto> {
    const resp = await this.cashierService.updateMoneyStorage({
      currentId,
      newData: moneyStorageReq,
    });
    return new MoneyStorageDto(resp);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiBody({
    description: 'Create money storage body',
    type: CreateMoneyStorageDto,
  })
  @ApiOkResponse({
    description: 'Money storage successful created',
    type: MoneyStorageDto,
  })
  public async createItem(
    @Body() moneyStorageReq: CreateMoneyStorageDto,
  ): Promise<MoneyStorageDto> {
    const resp = await this.cashierService.createMoneyStorage({
      ...moneyStorageReq,
      description: moneyStorageReq.description ?? null,
    });
    return new MoneyStorageDto(resp);
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({
    description: 'Money storage successful deleted',
  })
  public async removeItem(
    @Param('id', ParseObjectIdPipe) currentId: ID,
  ): Promise<void> {
    await this.cashierService.removeMoneyStorage(currentId);
  }
}