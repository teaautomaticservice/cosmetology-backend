import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CashierService } from '@services/cashier/cashier.service';

import { GetTransactionDto } from './dtos/getTransaction.dto';
import { NewOpenBalanceObligationDto } from './dtos/newOpenBalanceObligationDto';
import { NewTransactionDto } from './dtos/newTransactionDto.dto';
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

  @UseGuards(AuthGuard)
  @Post('/opening-balance')
  @ApiBody({
    description: 'Opening balance',
    type: NewTransactionDto,
  })
  @ApiOkResponse({
    description: 'New transaction Open Balance successful created',
    type: Boolean,
  })
  public async openBalance(
    @Body() transactionReq: NewTransactionDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.openBalanceTransaction({
      data: transactionReq,
    });
    return resp;
  }

  @UseGuards(AuthGuard)
  @Post('/opening-balance-obligation-account')
  @ApiBody({
    description: 'Open balance for obligation account',
    type: NewOpenBalanceObligationDto,
  })
  @ApiOkResponse({
    description: 'Obligation storage successful created',
    type: Boolean,
  })
  public async createObligationItem(
    @Body() transactionReq: NewOpenBalanceObligationDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.openBalanceObligationTransaction({
      data: transactionReq,
    });
    return resp;
  }

  @UseGuards(AuthGuard)
  @Post('/cash-out')
  @ApiBody({
    description: 'Cash out',
    type: NewTransactionDto,
  })
  @ApiOkResponse({
    description: 'New transaction Cash Out successful created',
  })
  public async cashOut(
    @Body() transactionReq: NewTransactionDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.cashOutTransaction({
      data: transactionReq,
    });
    return resp;
  }
}