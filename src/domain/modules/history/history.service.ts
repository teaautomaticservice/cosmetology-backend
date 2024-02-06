// import type { ID } from './history.typings';

import { Injectable } from '@nestjs/common';

import { MessageDto } from './dto/message.dto';
// import { HistoryDto } from './dto/history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from 'src/domain/repositories/message/message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(MessageEntity) private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  private async createHistory(message: string) {
    return this.messageRepository.save({
      date: new Date(),
      message,
      owner: 'Owner',
    });
  }

  async getHistoryList() {
    const historyList = await this.messageRepository.find();
    const itemsCount = historyList.length;

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
    const fundedItem = await this.messageRepository.findOne({
      where: {
        id: currentId,
      }
    })
    return fundedItem;
  }

  async updateHistory(currentId: number, { message }: MessageDto) {
    await this.messageRepository.update(currentId, { message });
    return await this.getHistoryList();
  }

  async removeHistory(currentId: number) {
    await this.messageRepository.delete(currentId);
    return await this.getHistoryList();
  }
}
