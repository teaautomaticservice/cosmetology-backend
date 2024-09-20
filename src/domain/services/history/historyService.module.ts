import { Module } from '@nestjs/common';

import { HistoryRepositoryModule } from '@providers/postgresql/repositories/history/historyRepository.module';

import { HistoryService } from './history.service';

@Module({
  imports: [HistoryRepositoryModule],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryServiceModule {}
