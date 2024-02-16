import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MessageEntity } from '../../repositories/entities/message/message.entity';
import { RecordEntity } from '../../repositories/types/common.types';

@Injectable()
export class HistoryDb {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async getHistoryList() {
    return await this.messageRepository.find();
  }

  async getHistoriesCount() {
    return await this.messageRepository.count();
  }

  async createHistory(message: RecordEntity<MessageEntity>) {
    return this.messageRepository.save(message);
  }

  async findHistoryById(currentId: MessageEntity['id']) {
    const fundedItem = await this.messageRepository.findOne({
      where: {
        id: currentId,
      },
    });
    return fundedItem;
  }

  async updateHistory(
    currentId: MessageEntity['id'],
    message: Partial<RecordEntity<MessageEntity>>,
  ) {
    await this.messageRepository.update(currentId, message);
    return await this.getHistoryList();
  }

  async removeHistory(currentId: MessageEntity['id']) {
    await this.messageRepository.delete(currentId);
    return await this.getHistoryList();
  }
}
