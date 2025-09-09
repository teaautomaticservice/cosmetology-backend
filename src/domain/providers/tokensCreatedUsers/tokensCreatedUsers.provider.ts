import { ID } from '../common/common.type';
import { CommonRedisProvider } from '../redis/commonRedis.provider';

export class TokensCreatedUsersProvider extends CommonRedisProvider {
  constructor() {
    super({ hash: 'tokenCreatedProvider' });
  }

  public async addNewUserToken(userID: ID, token: string): Promise<void> {
    return this.set(token, userID.toString(), 30 * 60);
  }

  public async getUserIdByToken(userToken: string): Promise<ID | null> {
    const val = await this.get(userToken);
    if (val) {
      return Number(val);
    }
    return null;
  }
}