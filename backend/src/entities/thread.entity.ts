import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Message, message => message.thread)
  @JoinColumn()
  parentMessage: Message;

  @OneToMany(() => Message, message => message.threadParent)
  replies: Message[];
} 