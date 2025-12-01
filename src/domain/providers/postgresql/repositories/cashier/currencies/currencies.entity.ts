import { Column, Entity } from 'typeorm';

import { CURRENCIES_ENTITY } from '@providers/postgresql/constants/entities';

import { CurrencyStatus } from './currencies.types';
import { CommonEntity } from '../../common/common.entity';

@Entity(CURRENCIES_ENTITY)
export class CurrencyEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  public name: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  public status: CurrencyStatus;

  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  public code: string;
}
