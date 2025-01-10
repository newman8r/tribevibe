import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';
import { Reaction } from './reaction.entity';
import { Thread } from './thread.entity';
import { DirectMessageConversation } from './direct-message-conversation.entity';
import { File } from './file.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  anonymousId: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @ManyToOne(() => Channel, channel => channel.messages, { nullable: true })
  channel: Channel;

  @ManyToOne(() => DirectMessageConversation, conversation => conversation.messages, { nullable: true })
  directMessageConversation: DirectMessageConversation;

  @OneToMany(() => Reaction, reaction => reaction.message, { eager: true })
  reactions: Reaction[];

  @OneToOne(() => Thread, thread => thread.parentMessage, { nullable: true })
  thread: Thread;

  @ManyToOne(() => Thread, thread => thread.replies, { nullable: true })
  threadParent: Thread;

  @Column({ nullable: true, default: 0 })
  replyCount: number;

  @OneToMany(() => File, file => file.message)
  files: File[];
}

