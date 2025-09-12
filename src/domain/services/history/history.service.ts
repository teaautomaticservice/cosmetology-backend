import { HistoriesProvider } from '@domain/providers/histories/histories.provider';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { Injectable } from '@nestjs/common';
import { RecordEntity } from '@providers/common/common.type';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

@Injectable()
export class HistoryService {
  constructor(private readonly historiesProvider: HistoriesProvider) {}

  public async getHistoryList(): Promise<[MessageEntity[], number]> {
    return this.historiesProvider.findAndCount({
      pagination: { page: 1, pageSize: 100000 },
    });;
  }

  public async addHistory(
    { message }: Pick<MessageEntity, 'message'>,
    user: UserEntity,
  ): Promise<[MessageEntity[], number]> {
    await this.createHistory(message, user);
    return this.getHistoryList();
  }

  public async getHistoryById(currentId: number): Promise<MessageEntity | null> {
    return await this.historiesProvider.findById(currentId);
  }

  public async updateHistory(
    currentId: number,
    { message }: Pick<MessageEntity, 'message'>
  ): Promise<[MessageEntity[], number]> {
    await this.historiesProvider.updateById(currentId, { message });
    return await this.getHistoryList();
  }

  public async removeHistory(currentId: number): Promise<[MessageEntity[], number]> {
    await this.historiesProvider.deleteById(currentId);
    return await this.getHistoryList();
  }

  private async createHistory(message: string, user: UserEntity,): Promise<RecordEntity<MessageEntity>> {
    return this.historiesProvider.create({
      date: new Date(),
      message,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    });
  }
}
