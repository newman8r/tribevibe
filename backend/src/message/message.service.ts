import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
  ) {}

  async create(data: {
    content: string;
    channel: Channel;
    user?: User;
    anonymousId?: string;
    username: string;
  }): Promise<Message> {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  async getChannelMessages(channelId: string, limit = 100): Promise<Message[]> {
    return this.messageRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findMessageWithReactions(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({ 
      where: { id: messageId },
      relations: ['reactions', 'reactions.user', 'channel']
    });
    
    if (!message) throw new Error('Message not found');
    return message;
  }

  async addReaction(messageId: string, emoji: string, userId?: string, anonymousId?: string): Promise<Message> {
    const message = await this.findMessageWithReactions(messageId);
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(r => 
      (userId && r.user?.id === userId) || (anonymousId && r.anonymousId === anonymousId)
    );

    if (existingReaction && existingReaction.emoji === emoji) {
      return message;
    }

    // Check reaction limit
    if (message.reactions.length >= 10) {
      throw new Error('Maximum reactions reached for this message');
    }

    const reaction = this.reactionRepository.create({
      emoji,
      message,
      anonymousId,
      user: userId ? { id: userId } : undefined
    });

    await this.reactionRepository.save(reaction);
    return this.findMessageWithReactions(messageId);
  }

  async removeReaction(messageId: string, emoji: string, userId?: string, anonymousId?: string): Promise<Message> {
    const message = await this.findMessageWithReactions(messageId);
    
    await this.reactionRepository.delete({
      message: { id: messageId },
      emoji,
      ...(userId ? { user: { id: userId } } : {}),
      ...(anonymousId ? { anonymousId } : {})
    });

    return this.findMessageWithReactions(messageId);
  }
} 