import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Channel } from './channel.entity';
import { AiAgentChannel } from './ai-agent-channel.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  ticketId?: string;

  @Column({ default: false })
  isAiAgent: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @ManyToMany(() => Channel)
  @JoinTable()
  channels: Channel[];

  @OneToMany(() => AiAgentChannel, aiAgentChannel => aiAgentChannel.agent)
  aiAgentChannels: AiAgentChannel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

