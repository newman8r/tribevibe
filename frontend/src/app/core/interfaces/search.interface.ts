export interface SearchResult {
  id: string;
  content: string;
  timestamp: Date;
  channelId: string;
  channelName: string;
  userId?: string;
  username?: string;
} 