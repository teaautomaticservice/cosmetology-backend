import { Inject, Injectable } from '@nestjs/common';

import { HistoryDb } from 'src/domain/modules/history/history.db';

import { MessageDto } from './dto/message.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly messageDb: HistoryDb) {}

  private async createHistory(message: string) {
    return this.messageDb.createHistory({
      date: new Date(),
      message,
      owner: 'Owner',
    });
  }

  async getHistoryList() {
    const historyList = await this.messageDb.getHistoryList();
    const itemsCount = await this.messageDb.getHistoriesCount();

    const formattedHistoryList = {
      data: historyList,
      meta: {
        pagination: {
          itemsCount,
          itemsCurrent: [0, itemsCount],
        },
      },
    };

    return formattedHistoryList;
  }

  async addHistory({ message }: MessageDto) {
    await this.createHistory(message);
    return await this.getHistoryList();
  }

  async findHistory(currentId: number) {
    return await this.messageDb.findHistoryById(currentId);
  }

  async updateHistory(currentId: number, { message }: MessageDto) {
    await this.messageDb.updateHistory(currentId, { message });
    return await this.getHistoryList();
  }

  async removeHistory(currentId: number) {
    await this.messageDb.removeHistory(currentId);
    return await this.getHistoryList();
  }
}
