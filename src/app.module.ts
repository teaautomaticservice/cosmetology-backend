import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { getConfig } from './ambient/config/config';
import { DatabaseConfig } from './ambient/config/database/database.types';
import { DomainModule } from './domain/domain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<DatabaseConfig>('database');
        return {
          type: 'postgres',
          host: databaseConfig?.host,
          port: databaseConfig?.port,
          username: databaseConfig?.user,
          password: databaseConfig?.password,
          database: databaseConfig?.name,
          synchronize: true,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    DomainModule,
  ],
})
export class AppModule {}
