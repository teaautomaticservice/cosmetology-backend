import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('message_entity')
export class MessageEntityOld {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
