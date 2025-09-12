import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';

import { HistoriesProvider } from '@domain/providers/histories/histories.provider';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { UsersProvider } from '@domain/providers/users/users.provider';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ID } from '@providers/common/common.type';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

import { historyWithUsersDto } from './dto/historyWithUsers.dto';

@Injectable()
export class HistoryService {
  constructor(
    private readonly historiesProvider: HistoriesProvider,
    private readonly usersProvider: UsersProvider,
  ) { }

  public async getHistoryList(): Promise<[historyWithUsersDto[], number]> {
    const [rawHistoryList, count] = await this.historiesProvider.findAndCount({
      pagination: { page: 1, pageSize: 100000 },
    });

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

    const historyWithUsers: historyWithUsersDto[] = rawHistoryList.map((messageEntity) =>
      new historyWithUsersDto({
        messageEntity,
        createdByUser: usersMap[messageEntity.createdByUserId],
        updatedByUser: usersMap[messageEntity.updatedByUserId]
      }));

    return [historyWithUsers, count];
  }

  public async addHistory(
    { message }: Pick<MessageEntity, 'message'>,
    user: UserEntity,
  ): Promise<[historyWithUsersDto[], number]> {
    await this.createHistory(message, user);
    return this.getHistoryList();
  }

  public async getHistoryById(currentId: number): Promise<MessageEntity | null> {
    return await this.historiesProvider.findById(currentId);
  }

  public async updateHistory(
    currentId: number,
    { message }: Pick<MessageEntity, 'message'>,
    user: UserEntity,
  ): Promise<[historyWithUsersDto[], number]> {
    await this.historiesProvider.updateById(
      currentId,
      {
        message,
        updatedByUserId: user.id,
      }
    );
    return await this.getHistoryList();
  }

  public async removeHistory(currentId: number): Promise<[historyWithUsersDto[], number]> {
    await this.historiesProvider.deleteById(currentId);
    return await this.getHistoryList();
  }

  private async createHistory(message: string, user: UserEntity,): Promise<historyWithUsersDto> {
    const messageEntity = await this.historiesProvider.create({
      date: new Date(),
      message,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    });

    const createdByUser = await this.usersProvider.findById(messageEntity.createdByUserId);
    const updatedByUser = await this.usersProvider.findById(messageEntity.updatedByUserId);

    return new historyWithUsersDto({
      messageEntity,
      createdByUser,
      updatedByUser,
    });
  }
}
