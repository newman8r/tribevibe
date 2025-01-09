import { Channel } from './channel.interface';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  status?: string;
} 