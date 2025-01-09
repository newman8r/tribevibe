import { User } from './user.interface';
import { Message } from './message.interface';

export interface DirectMessageConversation {
  id: string;
  user1: User;
  user2: User;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
} 