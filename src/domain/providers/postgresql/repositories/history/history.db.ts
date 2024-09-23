import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecordEntity } from '@providers/common/common.type';

import { MessageEntity } from './message.entity';

@Injectable()
export class HistoryDb {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  public async getHistoryList(): Promise<MessageEntity[]> {
    return await this.messageRepository.find();
  }

  public async getHistoriesCount(): Promise<number> {
    return await this.messageRepository.count();
  }

  public async createHistory(
    message: RecordEntity<MessageEntity>,
  ): Promise<RecordEntity<MessageEntity>> {
    return this.messageRepository.save(message);
  }

  public async findHistoryById(
    currentId: MessageEntity['id'],
  ): Promise<MessageEntity | null> {
    const fundedItem = await this.messageRepository.findOne({
      where: {
        id: currentId,
      },
    });
    return fundedItem;
  }

  public async updateHistory(
    currentId: MessageEntity['id'],
    message: Partial<RecordEntity<MessageEntity>>,
  ): Promise<MessageEntity[]> {
    await this.messageRepository.update(currentId, message);
    return await this.getHistoryList();
  }

  public async removeHistory(
    currentId: MessageEntity['id'],
  ): Promise<MessageEntity[]> {
    await this.messageRepository.delete(currentId);
    return await this.getHistoryList();
  }
}
