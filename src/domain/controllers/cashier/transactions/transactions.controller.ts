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
import { NewLoanDto } from './dtos/newLoanDto';
import { NewLoanRepaymentDto } from './dtos/newLoanRepaymentDto';
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
  @ApiOkResponse({
    description: 'List of transactions',
    type: TransactionsPaginated,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
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
}