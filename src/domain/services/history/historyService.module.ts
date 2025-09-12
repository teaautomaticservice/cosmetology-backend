import { HistoriesProviderModule } from '@domain/providers/histories/historiesProvider.module';
import { UsersProviderModule } from '@domain/providers/users/usersProvider.module';
import { Module } from '@nestjs/common';

import { HistoryService } from './history.service';

@Module({
  imports: [
    HistoriesProviderModule,
    UsersProviderModule,
  ],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryServiceModule {}
