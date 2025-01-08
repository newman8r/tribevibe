import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';
import { Reaction } from './reaction.entity';

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

  @OneToMany(() => Reaction, reaction => reaction.message, { eager: true })
  reactions: Reaction[];
}

