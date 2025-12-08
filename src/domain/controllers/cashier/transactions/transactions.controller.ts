import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { QueryInt } from '@decorators/queryInt';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CashierService } from '@services/cashier/cashier.service';

import { GetTransactionDto } from './dtos/getTransaction.dto';
import { TransactionsPaginated } from './dtos/transactionsPaginated.dto';
import { CASHIER_TRANSACTIONS_PATH } from '../cashier.paths';

@ApiTags('Cashier')
@Controller(CASHIER_TRANSACTIONS_PATH)
export class TransactionsController {
  constructor(
    private readonly cashierService: CashierService,
  ) { }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQueryPagination()
  // @ApiQuerySortOrder([
  //   'status',
  //   'name',
  // ] satisfies SortAccountsByStorages[])
  @ApiOkResponse({
    description: 'List of transactions',
    type: TransactionsPaginated,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
      // @Query('sort', ParseString) sort?: SortAccountsByStorages,
      // @Query('order', ParseSortOrderPipe,) order?: 1 | -1,
  ): Promise<TransactionsPaginated> {
    const [transactions, count] = await this.cashierService.getTransactionsList();

    return {
      data: transactions.map((data) => new GetTransactionDto(data)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }
}