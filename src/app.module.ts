import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getConfig } from './ambient/config/config';
import { DatabaseConfig } from './ambient/config/database/database.types';
import { LoggerProvider } from './ambient/logger/logger';
import { DomainModule } from './domain/modules/domain.module';

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
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.user,
          password: databaseConfig.password,
          database: databaseConfig.name,
          synchronize: true,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    DomainModule,
  ],
  controllers: [],
  providers: [LoggerProvider],
})
export class AppModule {}
