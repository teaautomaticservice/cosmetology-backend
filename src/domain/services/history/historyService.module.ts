import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryRepositoryModule } from '@providers/postgresql/repositories/history/historyRepository.module';

@Module({
  imports: [HistoryRepositoryModule],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryServiceModule {}
