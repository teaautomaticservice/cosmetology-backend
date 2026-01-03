import { Column, Entity } from 'typeorm';

import { MONEY_STORAGE_ENTITY } from '@providers/postgresql/constants/entities';

import { MoneyStorageStatus, MoneyStorageType } from './moneyStorages.types';
import { CommonEntity } from '../../common/common.entity';

@Entity(MONEY_STORAGE_ENTITY)
export class MoneyStoragesEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  public name: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  public status: MoneyStorageStatus;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  public code: string;

  @Column({
    type: 'varchar',
    nullable: false,
    default: MoneyStorageType.COMMON
  })
  public type: MoneyStorageType;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string | null;
}