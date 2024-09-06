import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'winston';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { HistoryService } from './history.service';
import { Resources } from 'src/ambient/constants/resources';
import { HistoryDto } from './dto/history.dto';
import { HistoryPaginatedDto } from './dto/historyPaginated.dto';
import { UpdateHistoryDto } from './dto/updateHistory.dto';

interface GetItemParam {
  id: string;
}

@ApiTags('History')
@Controller('/history')
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
  ) {}

  @Get('/list')
  @ApiOkResponse({
    description: 'List of history successful has been got',
    type: HistoryPaginatedDto,
  })
  async getList(): Promise<HistoryPaginatedDto> {
    this.logger.info('history getList');
    const [items, count] = await this.historyService.getHistoryList();
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryDto,
  })
  async getItem(@Param() { id }: GetItemParam): Promise<HistoryDto | null> {
    const history = await this.historyService.getHistoryById(Number(id));
    if (history == null) {
      throw new NotFoundException();
    }
    return new HistoryDto(history);
  }

  @Post()
  @ApiBody({
    description: 'Update history body',
    type: UpdateHistoryDto,
  })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryDto,
  })
  async addItem(
    @Body() messageReq: UpdateHistoryDto,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.addHistory(messageReq);
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }

  @Patch('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    description: 'Update history body',
    type: UpdateHistoryDto,
  })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  async updateItem(
    @Param() { id }: GetItemParam,
    @Body() messageReq: UpdateHistoryDto,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.updateHistory(
      Number(id),
      messageReq,
    );
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  async removeItem(
    @Param() { id }: GetItemParam,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.removeHistory(Number(id));
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }
}
