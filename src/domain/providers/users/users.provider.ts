import { FindOptionsOrder } from 'typeorm';

import { Injectable } from '@nestjs/common';

import { FoundAndCounted, Pagination, RecordEntity } from '../common/common.type';
import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { UserEntity } from '../postgresql/repositories/users/user.entity';
import { UsersDb } from '../postgresql/repositories/users/users.db';

@Injectable()
export class UsersProvider extends CommonPostgresqlProvider<UserEntity> {
  constructor(private readonly usersDb: UsersDb) {
    super(usersDb);
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.usersDb.findOne({ where: { email } });
  }

  public async createUser(newUserData: RecordEntity<UserEntity>): Promise<UserEntity | null> {
    return this.create(newUserData);
  }

  public async findById(id: number): Promise<UserEntity | null> {
    return super.findById(id);
  }

  public async findAndCount({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<UserEntity>;
  }): Promise<FoundAndCounted<UserEntity>> {
    return super.findAndCount({
      pagination,
      order,
    });
  }

  public async findByIds(ids: number[]): Promise<UserEntity[] | null> {
    return super.findByIds(ids);
  }

  public async updateById(id: number, data: Partial<RecordEntity<UserEntity>>): Promise<boolean> {
    return super.updateById(id, data);
  }
}