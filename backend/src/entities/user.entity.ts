import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Channel } from './channel.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  ticketId: string;

  @Column()
  avatarUrl: string;

  @Column({ default: false })
  isAiAgent: boolean;

  @ManyToMany(() => Channel, channel => channel.users)
  @JoinTable()
  channels: Channel[];
}

