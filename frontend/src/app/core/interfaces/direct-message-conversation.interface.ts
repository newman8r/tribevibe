import { User } from './user.interface';
import { Message } from './message.interface';

export interface DirectMessageConversation {
  id: string;
  user1: {
    id: string;
    username: string;
  };
  user2: {
    id: string;
    username: string;
  };
  user1UnreadCount: number;
  user2UnreadCount: number;
  lastMessageAt?: Date;
} 