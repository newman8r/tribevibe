import { Channel } from './channel.interface';

export interface User {
  id: string;
  username: string;
  ticketId: string;
  avatarUrl: string;
  channels: Channel[];
} 