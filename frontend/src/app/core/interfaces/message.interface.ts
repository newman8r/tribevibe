import { User } from './user.interface';
import { Channel } from './channel.interface';

export interface Reaction {
  id: string;
  emoji: string;
  user?: User;
  anonymousId?: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user?: User;
  anonymousId?: string;
  username: string;
  avatarUrl?: string;
  channel: Channel;
  reactions: Reaction[];
} 