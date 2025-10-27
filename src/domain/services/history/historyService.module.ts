import { Module } from '@nestjs/common';
import { HistoriesProviderModule } from '@providers/histories/historiesProvider.module';
import { UsersProviderModule } from '@providers/users/usersProvider.module';

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
