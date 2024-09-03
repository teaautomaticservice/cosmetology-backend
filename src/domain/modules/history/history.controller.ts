import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Logger } from 'winston';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { MessageDto } from './dto/message.dto';
import { HistoryService } from './history.service';
import { Resources } from 'src/ambient/constants/resources';
import { HistoryDto } from './dto/history.dto';
import { HistoryPaginatedDto } from './dto/historyPaginated.dto';

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
  @ApiCreatedResponse({
    description: 'Successful signup',
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
  getItem(@Param() { id }: GetItemParam) {
    return this.historyService.findHistory(Number(id));
  }

  @Post()
  addItem(@Body() messageReq: MessageDto) {
    return this.historyService.addHistory(messageReq);
  }

  @Patch('/:id')
  updateItem(@Param() { id }: GetItemParam, @Body() messageReq: MessageDto) {
    const result = this.historyService.updateHistory(Number(id), messageReq);

    if (result === null) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return this.historyService.updateHistory(Number(id), messageReq);
  }

  @Delete('/:id')
  removeItem(@Param() { id }: GetItemParam) {
    return this.historyService.removeHistory(Number(id));
  }
}
