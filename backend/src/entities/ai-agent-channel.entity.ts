import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';

@Entity()
export class AiAgentChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  agent: User;

  @ManyToOne(() => Channel)
  channel: Channel;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  assignedAt: Date;
} 