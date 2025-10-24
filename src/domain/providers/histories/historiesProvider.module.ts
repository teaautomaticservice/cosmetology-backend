import { Module } from '@nestjs/common';

import { HistoriesProvider } from './histories.provider';
import { HistoryRepositoryModule } from '../postgresql/repositories/history/historyRepository.module';
import { UsersProviderModule } from '../users/usersProvider.module';

@Module({
  imports: [
    HistoryRepositoryModule,
    UsersProviderModule,
  ],
  providers: [HistoriesProvider],
  exports: [HistoriesProvider],
})
export class HistoriesProviderModule {}
