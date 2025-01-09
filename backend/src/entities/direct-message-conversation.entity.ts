import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity()
export class DirectMessageConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user1: User;

  @ManyToOne(() => User)
  user2: User;

  @OneToMany(() => Message, message => message.directMessageConversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  lastMessageAt: Date;
} 