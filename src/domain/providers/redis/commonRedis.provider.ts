import { createClient } from 'redis';
import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject, InternalServerErrorException } from '@nestjs/common';

export class CommonRedisProvider<ValueType extends string = string> {
  @Inject(Resources.LOGGER) protected readonly logger: Logger;
  private client: ReturnType<typeof createClient>;
  private hash = '';
  private reconnectAttempts = 0;

  constructor({
    hash
  }: {
    hash: string;
  }) {
    const host = process.env.REDIS_HOST ?? '';
    const port = process.env.REDIS_PORT ?? '';
    const password = process.env.REDIS_PASSWORD ?? '';

    this.client = createClient({
      socket: {
        host,
        port: Number(port),
      },
      password,
    });
    if (!hash.length) {
      throw new InternalServerErrorException('Error initialize Cash. Hash shouldn\'t be empty string');
    }

    this.hash = hash;
  }

  protected async onApplicationBootstrap(): Promise<void> {
    if (!this.client.isOpen) {
      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`, err.stack);
      });

      this.client.on('end', () => {
        this.logger.warn('Redis connection closed. Trying to reconnect...');
        this.tryReconnect();
      });

      await this.tryReconnect();
    }
  }

  protected async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      this.logger.info('Redis client disconnected.');
    }
  }

  protected async set(key: string, value: ValueType, ttlSeconds?: number): Promise<void> {
    const currentKey = this.getKey(key);
    try {
      await this.client.set(currentKey, value, { ...(ttlSeconds && { EX: ttlSeconds }) });
      this.logger.info(`New value cached with key '${currentKey}'`);
    } catch (err) {
      this.logger.error('Error while setting cache', err.stack);
      throw err;
    }
  }

  protected async get<T = ValueType>(key: string): Promise<T | null> {
    const currentKey = this.getKey(key);
    try {
      const value = await this.client.get(currentKey);
      if (!value) return null;
      return value as T;
    } catch (err) {
      this.logger.error('Error while getting cache', err.stack);
      throw err;
    }
  }

  private getKey(key: string): string {
    return `${this.hash}:${key}`;
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.reconnectAttempts = 0;
      this.logger.info('Redis client connected.');
    } catch (err) {
      this.logger.error(`Redis connect error: ${err.message}`);
      this.tryReconnect();
    }
  }

  private async tryReconnect(): Promise<void> {
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * this.reconnectAttempts, 30_000);
    this.logger.warn(`Reconnecting to Redis in ${delay / 1000}s...`);

    setTimeout(() => this.connect(), delay);
  }
}
