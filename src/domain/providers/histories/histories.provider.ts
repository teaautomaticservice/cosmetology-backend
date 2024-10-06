import { Injectable } from '@nestjs/common';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { HistoryDb } from '../postgresql/repositories/history/history.db';
import { MessageEntity } from '../postgresql/repositories/history/message.entity';

@Injectable()
export class HistoriesProvider extends CommonPostgresqlProvider<MessageEntity> {
  constructor(private readonly historyDb: HistoryDb) {
    super(historyDb);
  }

  public async deleteById(currentId: MessageEntity['id']): Promise<boolean> {
    await this.historyDb.deleteById(currentId);
    return true;
  }
}