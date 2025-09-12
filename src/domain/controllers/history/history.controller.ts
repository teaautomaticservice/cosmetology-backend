import { ParseObjectIdPipe } from 'src/ambient/pipes/parseIntId';
import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { CurrentUser } from '@decorators/currentUser';
import { ID } from '@domain/providers/common/common.type';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
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
    @Inject(Resources.LOGGER) private readonly logger: Logger
  ) { }

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiOkResponse({
    description: 'List of history successful has been got',
    type: HistoryPaginatedDto,
  })
  public async getList(): Promise<HistoryPaginatedDto> {
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
    @CurrentUser() currentUser: UserEntity,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.addHistory(messageReq, currentUser);
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }

  @UseGuards(AuthGuard)
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
  public async updateItem(
    @Param('id', ParseObjectIdPipe) id: ID,
    @Body() messageReq: UpdateHistoryDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<HistoryPaginatedDto> {
    const [items, count] = await this.historyService.updateHistory(Number(id), messageReq, currentUser);
    return {
      data: items.map((item) => new HistoryDto(item)),
      meta: {
        count,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({
    description: 'History successful has been got',
    type: HistoryPaginatedDto,
  })
  public async removeItem(
    @Param('id', ParseObjectIdPipe) id: ID,
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
