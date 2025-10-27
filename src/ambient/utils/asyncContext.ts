import { AsyncContext as AsyncContextBase } from '@nestjs-steroids/async-context';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';

const KEY_TRACE_ID = 'traceId';
const KEY_USER = 'user';

export class AsyncContext extends AsyncContextBase<string, unknown> {
  public isRegistered(): boolean {
    return this.als.getStore() !== undefined;
  }

  public registerIfNeed(): void {
    if (!this.isRegistered()) {
      this.register();
    }
  }

  public getTraceId(): string | undefined {
    const value = this.get(KEY_TRACE_ID) as string | undefined;

    if (value === undefined || typeof value === 'string') {
      return value;
    }

    throw new Error(`Invalid ASL value for key '${KEY_TRACE_ID}'`);
  }

  public getTraceIdIfRegistered(): string | undefined {
    if (this.isRegistered()) {
      return this.getTraceId();
    }

    return undefined;
  }

  public setTraceId(traceId: string): void {
    this.set(KEY_TRACE_ID, traceId);
  }

  public setUser(user: UserEntity): void {
    this.set(KEY_USER, user);
  }

  public getUser(): UserEntity | undefined {
    return this.get(KEY_USER) as UserEntity | undefined;
  }

  public getUserIfRegistered(): UserEntity | undefined {
    if (this.isRegistered()) {
      return this.get(KEY_USER) as UserEntity | undefined;
    }

    return undefined;
  }
}
