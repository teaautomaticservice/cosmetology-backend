import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LogEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public timestamp: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public key: string | null;

  @Column({
    type: 'varchar',
  })
  public level: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public authorizedUserId: string | null;

  @Column({
    type: 'varchar',
  })
  public message: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public meta: string | null;
}
