import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  visible: boolean;

  @ManyToMany(() => User, user => user.channels)
  users: User[];

  @OneToMany(() => Message, message => message.channel)
  messages: Message[];
}

