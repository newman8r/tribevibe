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

  async incrementUnreadCount(conversationId: string, recipientId: string): Promise<void> {
    const conversation = await this.dmConversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2']
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Determine which counter to increment based on the recipient
    if (conversation.user1.id === recipientId) {
      await this.dmConversationRepository.update(
        { id: conversationId },
        { user1UnreadCount: () => '"user1UnreadCount" + 1' }
      );
    } else if (conversation.user2.id === recipientId) {
      await this.dmConversationRepository.update(
        { id: conversationId },
        { user2UnreadCount: () => '"user2UnreadCount" + 1' }
      );
    }
  }

  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.dmConversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2']
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Reset the appropriate counter based on the user
    if (conversation.user1.id === userId) {
      await this.dmConversationRepository.update(
        { id: conversationId },
        { user1UnreadCount: 0 }
      );
    } else if (conversation.user2.id === userId) {
      await this.dmConversationRepository.update(
        { id: conversationId },
        { user2UnreadCount: 0 }
      );
    }
  }

  async getUserUnreadCounts(userId: string): Promise<{ [conversationId: string]: number }> {
    const conversations = await this.dmConversationRepository.find({
      where: [
        { user1: { id: userId } },
        { user2: { id: userId } }
      ],
      relations: ['user1', 'user2']
    });

    return conversations.reduce<{ [key: string]: number }>((acc, conversation) => {
      const unreadCount = conversation.user1.id === userId 
        ? conversation.user1UnreadCount 
        : conversation.user2UnreadCount;
      
      acc[conversation.id] = unreadCount;
      return acc;
    }, {});
  }

  async createMessage(data: {
    content: string;
    conversationId: string;
    user: User;
  }): Promise<Message> {
    const conversation = await this.dmConversationRepository.findOne({
      where: { id: data.conversationId },
      relations: ['user1', 'user2']
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

    // Update the conversation's lastMessageAt and increment unread count for recipient
    await this.dmConversationRepository.update(
      { id: conversation.id },
      { lastMessageAt: new Date() }
    );

    // Determine recipient and increment their unread count
    const recipientId = conversation.user1.id === data.user.id 
      ? conversation.user2.id 
      : conversation.user1.id;
    
    await this.incrementUnreadCount(conversation.id, recipientId);

    return savedMessage;
  }

  async findConversation(conversationId: string): Promise<DirectMessageConversation> {
    const conversation = await this.dmConversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2']
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }
} 