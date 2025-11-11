import { ParseSortOrderPipe } from 'src/ambient/parsers/parseSortOrder';
import { ParseString } from 'src/ambient/parsers/parseString';

import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { ApiQuerySortOrder } from '@decorators/apiQuerySortOrder';
import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AccountsAggregatedWithStorage, SortAccountsByStorages } from '@providers/cashier/accounts/accounts.type';
import { CashierService } from '@services/cashier/cashier.service';

import { AccountsAggregatedWithStoragePaginated } from './dtos/accountsAggregatedWithStoragePaginated.dto';
import { AccountsByStorePaginated } from './dtos/accountsByStorePaginated.dto';
import { AccountsWithStoragePaginatedDto } from './dtos/accountsWithStoragePaginated.dto';
import { CreateAccountDto } from './dtos/createAccount.dto';
import { GetAccountsByStoreDto } from './dtos/getAccountsByStore.dto';
import { GetAccountWithStorageDto } from './dtos/getAccountWithStorage.dto';
import { CASHIER_ACCOUNTS_PATH } from '../cashier.paths';

@ApiTags('Cashier')
@Controller(CASHIER_ACCOUNTS_PATH)
export class AccountsController {
  constructor(
    private readonly cashierService: CashierService,
  ) { }

  @UseGuards(AuthGuard)
  @Get('/accounts-by-money-storages-list')
  @ApiQueryPagination()
  @ApiQuerySortOrder(['status'] satisfies SortAccountsByStorages[])
  @ApiOkResponse({
    description: 'List of accounts by money storages successful',
    type: AccountsByStorePaginated,
  })
  public async getAccountsByMoneyStoragesList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @Query('sort', ParseString) sort?: SortAccountsByStorages,
    @Query('order', ParseSortOrderPipe,) order?: 1 | -1,
  ): Promise<AccountsByStorePaginated> {
    const [accountsByStore, count] = await this.cashierService.getActualAccountsByMoneyStoragesList({
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
      data: accountsByStore.map((data) => new GetAccountsByStoreDto(data)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Get('/accounts-aggregated-with-storage-list')
  @ApiQueryPagination()
  @ApiQuerySortOrder([
    'status',
    'available',
    'balance',
    'name',
  ] satisfies (keyof AccountsAggregatedWithStorage)[])
  @ApiOkResponse({
    description: 'List of accounts with money storages',
    type: AccountsAggregatedWithStoragePaginated,
  })
  public async getAccountsAggregatedWithStorageList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @Query('sort', ParseString) sort?: keyof AccountsAggregatedWithStorage,
    @Query('order', ParseSortOrderPipe,) order?: 1 | -1,
  ): Promise<AccountsAggregatedWithStoragePaginated> {
    const [accountsWithStore, count] = await this.cashierService.getAccountAggregatedWithStorageList({
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
      data: accountsWithStore,
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQueryPagination()
  @ApiQuerySortOrder([
    'status',
    'name',
  ] satisfies SortAccountsByStorages[])
  @ApiOkResponse({
    description: 'List of accounts with money storages',
    type: AccountsWithStoragePaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @Query('sort', ParseString) sort?: SortAccountsByStorages,
    @Query('order', ParseSortOrderPipe,) order?: 1 | -1,
  ): Promise<AccountsWithStoragePaginatedDto> {
    const [accountsWithStore, count] = await this.cashierService.getActualAccountsList({
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
      data: accountsWithStore.map((data) => new GetAccountWithStorageDto(data)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Post('/create')
  @ApiBody({
    description: 'Create account',
    type: CreateAccountDto,
  })
  @ApiOkResponse({
    description: 'New currency successful created',
    type: GetAccountWithStorageDto,
  })
  public async createAccount(
    @Body() accountReq: CreateAccountDto,
  ): Promise<AccountsWithStoragePaginatedDto> {
    const [accountsWithStore, count] = await this.cashierService.createAccountsForStorages({
      data: accountReq,
    });
    return {
      data: accountsWithStore.map((data) => new GetAccountWithStorageDto(data)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }
}