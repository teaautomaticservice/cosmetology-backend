import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { getConfig } from '@config/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';

import { DomainModule } from './domain/domain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.getOrThrow<PostgresConnectionOptions>('database');
        return databaseConfig;
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailerConfig = configService.getOrThrow<MailerOptions>('mailer');
        return mailerConfig;
      }
    }),
    ScheduleModule.forRoot(),
    DomainModule,
  ],
})
export class AppModule { }
