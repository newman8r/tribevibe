import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessageConversation } from '../entities/direct-message-conversation.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DirectMessageService {
  constructor(
    @InjectRepository(DirectMessageConversation)
    private dmConversationRepository: Repository<DirectMessageConversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findOrCreateConversation(user1Id: string, user2Id: string): Promise<DirectMessageConversation> {
    // First try to find existing conversation
    const existingConversation = await this.dmConversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .where(
        '(conversation.user1.id = :user1Id AND conversation.user2.id = :user2Id) OR ' +
        '(conversation.user1.id = :user2Id AND conversation.user2.id = :user1Id)',
        { user1Id, user2Id }
      )
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    // If no conversation exists, create a new one
    const conversation = this.dmConversationRepository.create({
      user1: { id: user1Id },
      user2: { id: user2Id }
    });

    return this.dmConversationRepository.save(conversation);
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return this.messageRepository.find({
      where: { directMessageConversation: { id: conversationId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async getUserConversations(userId: string): Promise<DirectMessageConversation[]> {
    return this.dmConversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('conversation.messages', 'messages', 'messages.id IN (SELECT id FROM message WHERE "directMessageConversationId" = conversation.id ORDER BY "createdAt" DESC LIMIT 1)')
      .where('user1.id = :userId OR user2.id = :userId', { userId })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();
  }

  async createMessage(data: {
    content: string;
    conversationId: string;
    user: User;
  }): Promise<Message> {
    const conversation = await this.dmConversationRepository.findOne({
      where: { id: data.conversationId }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create the message
    const message = this.messageRepository.create({
      content: data.content,
      user: data.user,
      username: data.user.username,
      directMessageConversation: conversation
    });

    // Save the message
    const savedMessage = await this.messageRepository.save(message);

    // Update the conversation's lastMessageAt
    await this.dmConversationRepository.update(
      conversation.id,
      { lastMessageAt: new Date() }
    );

    return savedMessage;
  }
} 