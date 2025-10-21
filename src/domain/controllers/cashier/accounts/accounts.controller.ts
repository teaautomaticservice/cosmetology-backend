import { QueryInt } from '@decorators/queryInt';
import { AuthGuard } from '@domain/controllers/common/guards/auth.guard';
import { CashierService } from '@domain/services/cashier/cashier.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of accounts successful has been got',
    type: AccountsByStorePaginated,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<AccountsByStorePaginated> {
    const [accountsByStore, count] = await this.cashierService.getActualAccountsByMoneyStoragesList();

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