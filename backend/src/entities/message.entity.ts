import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';

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

  @ManyToOne(() => Channel, channel => channel.messages)
  channel: Channel;
}

