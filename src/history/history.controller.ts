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
} from '@nestjs/common';

import { MessageDto } from './dto/message.dto';
import { HistoryService } from './history.service';

interface GetItemParam {
  id: string;
}

@Controller('/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('/list')
  getList() {
    return this.historyService.getHistoryList();
  }

  @Get('/:id')
  getItem(@Param() { id }: GetItemParam) {
    return this.historyService.findHistory(id);
  }

  @Post()
  addItem(@Body() messageReq: MessageDto) {
    return this.historyService.addHistory(messageReq);
  }

  @Patch('/:id')
  updateItem(@Param() { id }: GetItemParam, @Body() messageReq: MessageDto) {
    const result = this.historyService.updateHistory(id, messageReq);

    if (result === null) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return this.historyService.updateHistory(id, messageReq);
  }

  @Delete('/:id')
  removeItem(@Param() { id }: GetItemParam) {
    return this.historyService.removeHistory(id);
  }
}
