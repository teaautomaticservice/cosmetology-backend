import { HistoriesProviderModule } from '@domain/providers/histories/historiesProvider.module';
import { Module } from '@nestjs/common';

import { HistoryService } from './history.service';

@Module({
  imports: [HistoriesProviderModule],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryServiceModule {}
