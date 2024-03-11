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

import { MessageDto } from './dto/message.dto';
import { HistoryService } from './history.service';
import { Resources } from 'src/app.constants';

interface GetItemParam {
  id: string;
}

@Controller('/history')
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
  ) {}

  @Get('/list')
  getList() {
    this.logger.info('history getList');
    return this.historyService.getHistoryList();
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
