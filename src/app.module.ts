import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { AsyncContextProviderModule } from '@ambientProviders/asyncContext/asyncContextProvider.module';
import { getConfig } from '@config/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';

import { AssignAuthUser } from './ambient/interceptors/assignAuthUser';
import { Init } from './ambient/interceptors/init';
import { Tracking } from './ambient/interceptors/tracking';
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
    AsyncContextProviderModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: Init },
    { provide: APP_INTERCEPTOR, useClass: Tracking },
    { provide: APP_INTERCEPTOR, useClass: AssignAuthUser },
  ],
})
export class AppModule { }
