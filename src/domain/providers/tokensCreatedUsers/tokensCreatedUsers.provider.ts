import { ID } from '../common/common.type';
import { CommonRedisProvider } from '../redis/commonRedis.provider';

export class TokensCreatedUsersProvider extends CommonRedisProvider {
  constructor() {
    super({ hash: 'tokenCreatedProvider' });
  }

  public async addNewUserToken(userID: ID, token: string): Promise<void> {
    return this.set(userID.toString(), token, 30 * 60);
  }
}