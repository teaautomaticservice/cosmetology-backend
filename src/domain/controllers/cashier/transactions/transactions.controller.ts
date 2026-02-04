import { ParseArray } from 'src/ambient/parsers/parseArray';
import { parseArrayNumbers } from 'src/ambient/parsers/parseArrayNumbers';

import { AuthGuard } from '@controllers/common/guards/auth.guard';
import { ApiQueryPagination } from '@decorators/ApiQueryPagination';
import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { CashierService } from '@services/cashier/cashier.service';

import { GetTransactionDto } from './dtos/getTransaction.dto';
import { NewLoanDto } from './dtos/newLoanDto';
import { NewLoanRepaymentDto } from './dtos/newLoanRepaymentDto';
import { NewOpenBalanceObligationDto } from './dtos/newOpenBalanceObligationDto';
import { NewTransactionDto } from './dtos/newTransactionDto.dto';
import { NewTransferDto } from './dtos/newTransferDto.dto';
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
  @ApiQuery({
    name: 'amountFrom',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'amountTo',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatus,
    isArray: true,
    enumName: 'TransactionStatus',
  })
  @ApiQuery({
    name: 'anyAccountIds',
    type: 'number',
    required: false,
    isArray: true,
  })
  @ApiQuery({
    name: 'creditIds',
    type: 'number',
    required: false,
    isArray: true,
  })
  @ApiQuery({
    name: 'debitIds',
    type: 'number',
    required: false,
    isArray: true,
  })
  @ApiQuery({
    name: 'ids',
    type: 'number',
    required: false,
    isArray: true,
  })
  @ApiOkResponse({
    description: 'List of transactions',
    type: TransactionsPaginated,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
    @QueryInt('amountFrom') amountFrom?: number,
    @QueryInt('amountTo') amountTo?: number,
    @Query('status', ParseArray) status?: TransactionStatus[],
    @Query('anyAccountIds', parseArrayNumbers) anyAccountIds?: number[],
    @Query('creditIds', parseArrayNumbers) creditIds?: number[],
    @Query('debitIds', parseArrayNumbers) debitIds?: number[],
    @Query('ids', parseArrayNumbers) ids?: number[],
  ): Promise<TransactionsPaginated> {
    const [transactions, count] = await this.cashierService.getTransactionsList({
      pagination: {
        page,
        pageSize,
      },
      filter: {
        amountFrom,
        amountTo,
        anyAccountIds,
        creditIds,
        debitIds,
        ids,
        status,
      },
    });

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

  @UseGuards(AuthGuard)
  @Post('/receipt')
  @ApiBody({
    description: 'receipt',
    type: NewTransactionDto,
  })
  @ApiOkResponse({
    description: 'New transaction Receipt successful created',
  })
  public async receipt(
    @Body() transactionReq: NewTransactionDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.receiptTransaction({
      data: transactionReq,
    });
    return resp;
  }

  @UseGuards(AuthGuard)
  @Post('/loan')
  @ApiBody({
    description: 'Loan',
    type: NewLoanDto,
  })
  @ApiOkResponse({
    description: 'New transaction Loan successful created',
  })
  public async loan(
    @Body() transactionReq: NewLoanDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.loanTransaction({
      data: transactionReq,
    });
    return resp;
  }

  @UseGuards(AuthGuard)
  @Post('/loan-repayment')
  @ApiBody({
    description: 'Loan',
    type: NewLoanRepaymentDto,
  })
  @ApiOkResponse({
    description: 'New transaction Loan Repayment successful created',
  })
  public async loanRepayment(
    @Body() transactionReq: NewLoanRepaymentDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.loanRepaymentTransaction({
      data: transactionReq,
    });
    return resp;
  }

  @UseGuards(AuthGuard)
  @Post('/transfer')
  @ApiBody({
    description: 'Transfer',
    type: NewTransferDto,
  })
  @ApiOkResponse({
    description: 'New transaction Transfer Repayment successful created',
  })
  public async transfer(
    @Body() transactionReq: NewTransferDto,
  ): Promise<boolean> {
    const resp = await this.cashierService.transferTransaction({
      data: transactionReq,
    });
    return resp;
  }
}