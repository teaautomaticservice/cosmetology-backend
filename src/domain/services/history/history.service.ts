import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';

import { HistoriesProvider } from '@domain/providers/histories/histories.provider';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { UsersProvider } from '@domain/providers/users/users.provider';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ID, Pagination } from '@providers/common/common.type';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

import { HistoryWithUsersDto } from './dto/historyWithUsers.dto';

@Injectable()
export class HistoryService {
  constructor(
    private readonly historiesProvider: HistoriesProvider,
    private readonly usersProvider: UsersProvider,
  ) { }

  public async getHistoryList(params: { pagination: Pagination }): Promise<[HistoryWithUsersDto[], number]> {
    const [rawHistoryList, count] = await this.historiesProvider.findAndCount(params);

    const uniqIdsForUsersCreated: Set<ID> = new Set();

    rawHistoryList.forEach(({
      createdByUserId,
      updatedByUserId,
    }) => {
      uniqIdsForUsersCreated.add(createdByUserId);
      uniqIdsForUsersCreated.add(updatedByUserId);
    });

    const usersIds = Array.from(uniqIdsForUsersCreated);

    const usersList = await this.usersProvider.findByIds(usersIds);

    if (!usersList) {
      throw new InternalServerErrorException('Failed find relation');
    }

    const usersMap = createdMapFromEntity(usersList);

    const historyWithUsers: HistoryWithUsersDto[] = rawHistoryList.map((messageEntity) =>
      new HistoryWithUsersDto({
        messageEntity,
        createdByUser: usersMap[messageEntity.createdByUserId],
        updatedByUser: usersMap[messageEntity.updatedByUserId],
      }));

    return [historyWithUsers, count];
  }

  public async addHistory(
    {
      newMessage,
      currentUser,
      pageSize,
    }: {
      newMessage: Pick<MessageEntity, 'message'>;
      currentUser: UserEntity;
      pageSize?: number;
    }
  ): Promise<[HistoryWithUsersDto[], number]> {
    await this.createHistory(newMessage.message, currentUser);
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
    currentUser,
    page,
    pageSize,
  }: {
    currentId: number;
    newMessage: Pick<MessageEntity, 'message'>;
    currentUser: UserEntity;
    page: number;
    pageSize: number;
  }): Promise<[HistoryWithUsersDto[], number]> {
    await this.historiesProvider.updateById(
      currentId,
      {
        message: newMessage.message,
        updatedByUserId: currentUser.id,
      }
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

  private async createHistory(message: string, user: UserEntity,): Promise<HistoryWithUsersDto> {
    const messageEntity = await this.historiesProvider.create({
      date: new Date(),
      message,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    });

    const createdByUser = await this.usersProvider.findById(messageEntity.createdByUserId);
    const updatedByUser = await this.usersProvider.findById(messageEntity.updatedByUserId);

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
