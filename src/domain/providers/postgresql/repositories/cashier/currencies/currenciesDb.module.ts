import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CurrenciesDb } from './currencies.db';
import { CurrencyEntity } from './currencies.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyEntity]), CommonDbModule],
  providers: [CurrenciesDb],
  exports: [CurrenciesDb],
})
export class CurrenciesRepositoryModule {}
