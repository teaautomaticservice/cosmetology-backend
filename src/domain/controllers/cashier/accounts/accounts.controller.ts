import { ParseSortOrderPipe } from 'src/ambient/parsers/parseSortOrder';
import { ParseString } from 'src/ambient/parsers/parseString';

import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { ApiQuerySortOrder } from '@decorators/apiQuerySortOrder';
import { QueryInt } from '@decorators/queryInt';
import { AuthGuard } from '@domain/controllers/common/guards/auth.guard';
import { SortAccountsByStorages } from '@domain/providers/cashier/accounts/accounts.type';
import { CashierService } from '@domain/services/cashier/cashier.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AccountsByStorePaginated } from './dtos/accountsByStorePaginated.dto';
import { GetAccountsByStoreDto } from './dtos/getAccountsByStore.dto';
import { CASHIER_ACCOUNTS_PATH } from '../cashier.paths';

@ApiTags('Cashier')
@Controller(CASHIER_ACCOUNTS_PATH)
export class AccountsController {
  constructor(
    private readonly cashierService: CashierService,
  ) { }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQueryPagination()
  @ApiQuerySortOrder(['status'] satisfies SortAccountsByStorages[])
  @ApiOkResponse({
    description: 'List of accounts by money storages successful has been got',
    type: AccountsByStorePaginated,
  })
  public async getAccountsByMoneyStoragesList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @Query('sort', ParseString) sort?: SortAccountsByStorages,
    @Query('order', ParseSortOrderPipe,) order?: 1 | -1,
  ): Promise<AccountsByStorePaginated> {
    const [accountsByStore, count] = await this.cashierService.getActualAccountsByMoneyStoragesList({
      ...(sort && {
        order: {
          [sort]: order ?? 1,
        },
      }),
    });

    return {
      data: accountsByStore.map((data) => new GetAccountsByStoreDto(data)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }
}