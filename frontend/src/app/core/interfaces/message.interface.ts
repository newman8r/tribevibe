import { User } from './user.interface';
import { Channel } from './channel.interface';

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user?: User;
  anonymousId?: string;
  username: string;
  avatarUrl?: string;
  channel: Channel;
} 