import { ParseObjectIdPipe } from 'src/ambient/pipes/parseIntId';

import { QueryInt } from '@decorators/queryInt';
import { AuthGuard } from '@domain/controllers/common/guards/auth.guard';
import { ID } from '@domain/providers/common/common.type';
import { CashierService } from '@domain/services/cashier/cashier.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of money storages successful has been got',
    type: MoneyStoragePaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<MoneyStoragePaginatedDto> {
    const [data, count] = await this.cashierService.getMoneyStoragesList({
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
  @Get('/obligation-account')
  @ApiOkResponse({
    description: 'Obligation account of money storages successful has been got',
    type: MoneyStorageDto,
  })
  public async getObligationAccount(): Promise<MoneyStorageDto> {
    const result = await this.cashierService.getObligationAccount();

    return new MoneyStorageDto(result);
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
}