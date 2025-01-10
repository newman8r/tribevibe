export interface SearchResult {
  id: string;
  content: string;
  createdAt: Date;
  timestamp: Date;
  username: string;
  avatarUrl: string;
  channelId?: string;
  channelName?: string;
  directMessageConversationId?: string;
  userId?: string;
  anonymousId?: string;
} 