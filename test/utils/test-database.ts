import { DataSource, EntitySchema } from 'typeorm';

import { Resources } from '@commonConstants/resources';
import { DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EntityClass = EntitySchema<any> | (new (...args: any[]) => any);

export class TestDatabase {
  private container: StartedPostgreSqlContainer;

  public static getMockProviders(): Provider[] {
    return [
      {
        provide: Resources.AsyncContext,
        useValue: { getUser: (): undefined => undefined },
      },
      {
        provide: Resources.LOGGER,
        useValue: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        },
      },
    ];
  }

  public static async truncate(dataSource: DataSource, tables: string[]): Promise<void> {
    const quoted = tables.map((t) => `"${t}"`).join(', ');
    await dataSource.query(`TRUNCATE ${quoted} RESTART IDENTITY CASCADE`);
  }

  public async start(): Promise<void> {
    this.container = await new PostgreSqlContainer('postgres:16').start();
  }

  public getTypeOrmModule(entities: EntityClass[]): DynamicModule {
    return TypeOrmModule.forRoot({
      type: 'postgres',
      host: this.container.getHost(),
      port: this.container.getMappedPort(5432),
      username: this.container.getUsername(),
      password: this.container.getPassword(),
      database: this.container.getDatabase(),
      entities,
      synchronize: true,
    });
  }

  public async stop(): Promise<void> {
    await this.container?.stop();
  }
}
