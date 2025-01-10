import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Message } from '../entities/message.entity';

export interface MessageSearchResult {
  id: string;
  content: string;
  createdAt: Date;
  username: string;
  avatarUrl: string;
  channelId?: string;
  channelName?: string;
  directMessageConversationId?: string;
  userId?: string;
  anonymousId?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async searchMessages(query: string): Promise<MessageSearchResult[]> {
    this.logger.debug(`Searching messages with query: ${query}`);
    
    try {
      const messages = await this.messageRepository.find({
        where: {
          content: Like(`%${query}%`),
        },
        relations: {
          channel: true,
          directMessageConversation: true,
          user: true
        },
        order: {
          createdAt: 'DESC',
        },
      });

      this.logger.debug(`Found ${messages.length} messages`);
      
      const results = messages.map(message => {
        let avatarUrl: string;
        
        if (message.user?.avatarUrl) {
          // Registered user with avatar
          avatarUrl = message.user.avatarUrl;
        } else if (message.avatarUrl) {
          // Message has direct avatar URL
          avatarUrl = message.avatarUrl;
        } else if (message.anonymousId) {
          // Anonymous user
          avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${message.anonymousId}`;
        } else {
          // Fallback
          avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${message.id}`;
        }

        return {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          username: message.user?.username || message.username,
          avatarUrl,
          channelId: message.channel?.id,
          channelName: message.channel?.name,
          directMessageConversationId: message.directMessageConversation?.id,
          userId: message.user?.id,
          anonymousId: message.anonymousId
        };
      });

      this.logger.debug('Search results:', results);
      return results;
    } catch (error) {
      this.logger.error('Error searching messages:', error);
      throw error;
    }
  }
} 