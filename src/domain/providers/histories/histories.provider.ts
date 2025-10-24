import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';
import { FindOptionsOrder } from 'typeorm';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { HistoryWithUsersDto } from './dto/historyWithUsers.dto';
import { FoundAndCounted, ID, Pagination } from '../common/common.type';
import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { Where } from '../postgresql/repositories/common/common.types';
import { HistoryDb } from '../postgresql/repositories/history/history.db';
import { MessageEntity } from '../postgresql/repositories/history/message.entity';
import { UsersProvider } from '../users/users.provider';

@Injectable()
export class HistoriesProvider extends CommonPostgresqlProvider<MessageEntity> {
  constructor(
    private readonly historyDb: HistoryDb,
    private readonly usersProvider: UsersProvider,
  ) {
    super(historyDb);
  }

  public async getHistoryListWithUsers({
    pagination,
    order,
    where,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<MessageEntity> | undefined;
    where?: Where<MessageEntity>;
  }): Promise<FoundAndCounted<HistoryWithUsersDto>> {
    const [rawHistoryList, count] = await super.findAndCount({
      pagination,
      order,
      where,
    });

    const uniqIdsForUsersCreated: Set<ID> = new Set();

    rawHistoryList.forEach(({
      createdBy,
      updatedBy,
    }) => {
      if (createdBy) {
        uniqIdsForUsersCreated.add(createdBy);
      }
      if (updatedBy) {
        uniqIdsForUsersCreated.add(updatedBy);
      }
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
        ...(messageEntity.createdBy && {
          createdByUser: usersMap[messageEntity.createdBy],
        }),
        ...(messageEntity.updatedBy && {
          updatedByUser: usersMap[messageEntity.updatedBy],
        })
      }));

    return [historyWithUsers, count];
  }

  public async deleteById(currentId: MessageEntity['id']): Promise<boolean> {
    await this.historyDb.deleteById(currentId);
    return true;
  }
}