import { Module } from '@nestjs/common';

import { HistoriesProvider } from './histories.provider';
import { HistoryRepositoryModule } from '../postgresql/repositories/history/historyRepository.module';

@Module({
  imports: [HistoryRepositoryModule],
  providers: [HistoriesProvider],
  exports: [HistoriesProvider],
})
export class HistoriesProviderModule {}
