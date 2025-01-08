import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emoji: string;

  @Column({ nullable: true })
  anonymousId: string;

  @ManyToOne(() => Message, message => message.reactions)
  message: Message;

  @ManyToOne(() => User, { nullable: true })
  user: User;
} 