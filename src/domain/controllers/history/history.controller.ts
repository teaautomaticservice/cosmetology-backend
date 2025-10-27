import { ParseObjectIdPipe } from 'src/ambient/pipes/parseIntId';

import { QueryInt } from '@decorators/queryInt';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { HistoryService } from '@services/history/history.service';

import { HistoryDto } from './dtos/history.dto';
import { HistoryPaginatedDto } from './dtos/historyPaginated.dto';
import { UpdateHistoryDto } from './dtos/updateHistory.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('History')
@Controller('/history')
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
  ) { }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of history successful has been got',
    type: HistoryPaginatedDto,
  })
  public async getList(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.getHistoryList({
      pagination: {
        page,
        pageSize,
      }
    });
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryDto,
  })
  public async getItem(
    @Param('id', ParseObjectIdPipe) id: ID,
  ): Promise<HistoryDto | null> {
    const history = await this.historyService.getHistoryById(Number(id));
    if (history == null) {
      throw new NotFoundException();
    }
    return new HistoryDto(history);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiBody({
    description: 'Update history body',
    type: UpdateHistoryDto,
  })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  public async addItem(
    @Body() messageReq: UpdateHistoryDto,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.addHistory({
      newMessage: messageReq,
      pageSize,
    });
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Patch('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiBody({
    description: 'Update history body',
    type: UpdateHistoryDto,
  })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  public async updateItem(
    @Param('id', ParseObjectIdPipe) id: ID,
    @Body() messageReq: UpdateHistoryDto,
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.updateHistory({
      currentId: Number(id),
      newMessage: messageReq,
      page,
      pageSize,
    });
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  public async removeItem(
    @Param('id', ParseObjectIdPipe) id: ID,
    @QueryInt('pageSize', 10) pageSize: number,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.removeHistory({
      currentId: Number(id),
      pageSize,
    });
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: pageSize,
      },
    };
  }
}
