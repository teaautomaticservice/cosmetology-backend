import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MessageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
