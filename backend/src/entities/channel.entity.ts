import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
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
  @JoinTable({
    name: 'user_channels_channel',
    joinColumn: {
      name: 'channelId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    }
  })
  users: User[];

  @OneToMany(() => Message, message => message.channel)
  messages: Message[];
}

