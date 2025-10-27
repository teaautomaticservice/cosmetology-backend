import { Injectable } from '@nestjs/common';
import { Pagination } from '@providers/common/common.type';
import { HistoryWithUsersDto } from '@providers/histories/dto/historyWithUsers.dto';
import { HistoriesProvider } from '@providers/histories/histories.provider';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';
import { UsersProvider } from '@providers/users/users.provider';

@Injectable()
export class HistoryService {
  constructor(
    private readonly historiesProvider: HistoriesProvider,
    private readonly usersProvider: UsersProvider,
  ) { }

  public async getHistoryList(params: { pagination: Pagination }): Promise<[HistoryWithUsersDto[], number]> {
    return await this.historiesProvider.getHistoryListWithUsers(params);
  }

  public async addHistory(
    {
      newMessage,
      pageSize,
    }: {
      newMessage: Pick<MessageEntity, 'message'>;
      pageSize?: number;
    }
  ): Promise<[HistoryWithUsersDto[], number]> {
    await this.createHistory(newMessage.message);
    return this.getHistoryList({
      pagination: this.getDefaultPagination({
        pageSize,
      }),
    });
  }

  public async getHistoryById(currentId: number): Promise<MessageEntity | null> {
    return await this.historiesProvider.findById(currentId);
  }

  public async updateHistory({
    currentId,
    newMessage,
    page,
    pageSize,
  }: {
    currentId: number;
    newMessage: Pick<MessageEntity, 'message'>;
    page: number;
    pageSize: number;
  }): Promise<[HistoryWithUsersDto[], number]> {
    await this.historiesProvider.updateById(
      currentId,
      { message: newMessage.message }
    );
    return await this.getHistoryList({
      pagination: {
        page,
        pageSize,
      },
    });
  }

  public async removeHistory({
    currentId,
    pageSize,
  }: {
    currentId: number;
    pageSize: number;
  }): Promise<[HistoryWithUsersDto[], number]> {
    await this.historiesProvider.deleteById(currentId);
    return await this.getHistoryList({
      pagination: this.getDefaultPagination({ pageSize }),
    });
  }

  private async createHistory(message: string): Promise<HistoryWithUsersDto> {
    const messageEntity = await this.historiesProvider.create({
      date: new Date(),
      message,
    });

    const createdByUser = messageEntity.createdBy ?
      await this.usersProvider.findById(messageEntity.createdBy) :
      null;
    const updatedByUser = messageEntity.updatedBy ?
      await this.usersProvider.findById(messageEntity.updatedBy) :
      null;

    return new HistoryWithUsersDto({
      messageEntity,
      createdByUser,
      updatedByUser,
    });
  }

  private getDefaultPagination({
    page,
    pageSize,
  }: Partial<Pagination> = {}): Pagination {
    return {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
    };
  }
}
