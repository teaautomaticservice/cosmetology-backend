import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecordEntity } from '@providers/common/common.type';

import { MessageEntity } from './message.entity';
import { CommonRepository } from '../common/common.db';

@Injectable()
export class HistoryDb extends CommonRepository<MessageEntity> {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>
  ) {
    super(messageRepository);
  }

  public async getHistoryList(): Promise<MessageEntity[]> {
    const [list] = await this.findAllSpecified({});
    return list;
  }

  public async getHistoriesCount(): Promise<number> {
    const [_, count] = await this.findAllSpecified({});
    return count;
  }

  public async createHistory(message: RecordEntity<MessageEntity>): Promise<MessageEntity> {
    return this.create(message);
  }

  public async findHistoryById(currentId: MessageEntity['id']): Promise<MessageEntity | null> {
    return this.findById(currentId);
  }

  public async updateHistory(
    currentId: MessageEntity['id'],
    message: Partial<RecordEntity<MessageEntity>>
  ): Promise<MessageEntity[]> {
    await this.updateById(currentId, message);
    return this.getHistoryList();
  }

  public async removeHistory(currentId: MessageEntity['id']): Promise<MessageEntity[]> {
    await this.deleteById(currentId);
    return this.getHistoryList();
  }
}
