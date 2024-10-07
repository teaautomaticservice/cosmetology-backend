import { DeleteResult, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MessageEntity } from './message.entity';
import { CommonDb } from '../common/common.db';

@Injectable()
export class HistoryDb extends CommonDb<MessageEntity> {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>
  ) {
    super(messageRepository);
  }

  public async deleteById(id: MessageEntity['id']): Promise<DeleteResult> {
    this.logger.info('Delete one history by id', {
      id,
    });
    return await this.dbRepository.delete(id);
  }
}
