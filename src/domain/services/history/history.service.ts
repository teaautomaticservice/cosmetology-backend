import { Injectable } from '@nestjs/common';

import { HistoryDb } from '@providers/postgresql/repositories/history/history.db';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

@Injectable()
export class HistoryService {
  constructor(private readonly messageDb: HistoryDb) {}

  private async createHistory(message: string): Promise<MessageEntity> {
    return this.messageDb.createHistory({
      date: new Date(),
      message,
      owner: 'Owner',
    });
  }

  async getHistoryList(): Promise<[MessageEntity[], number]> {
    const historyList = await this.messageDb.getHistoryList();
    const count = await this.messageDb.getHistoriesCount();

    return [historyList, count];
  }

  async addHistory({
    message,
  }: Pick<MessageEntity, 'message'>): Promise<[MessageEntity[], number]> {
    await this.createHistory(message);
    return this.getHistoryList();
  }

  async getHistoryById(currentId: number): Promise<MessageEntity | null> {
    return await this.messageDb.findHistoryById(currentId);
  }

  async updateHistory(
    currentId: number,
    { message }: Pick<MessageEntity, 'message'>,
  ): Promise<[MessageEntity[], number]> {
    await this.messageDb.updateHistory(currentId, { message });
    return await this.getHistoryList();
  }

  async removeHistory(currentId: number): Promise<[MessageEntity[], number]> {
    await this.messageDb.removeHistory(currentId);
    return await this.getHistoryList();
  }
}
