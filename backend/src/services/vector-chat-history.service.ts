import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class VectorChatHistoryService {
  constructor(
    @InjectRepository(VectorKnowledgeBase)
    private vectorKnowledgeBaseRepository: Repository<VectorKnowledgeBase>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async addUserToChatHistory(knowledgeBaseId: string, userId: string): Promise<void> {
    const knowledgeBase = await this.vectorKnowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new NotFoundException('Vector knowledge base not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize chatHistoryUsers array if it doesn't exist
    if (!knowledgeBase.chatHistoryUsers) {
      knowledgeBase.chatHistoryUsers = [];
    }

    // Check if user is already in the chat history
    const userExists = knowledgeBase.chatHistoryUsers.some(u => u.id === userId);
    if (!userExists) {
      knowledgeBase.chatHistoryUsers.push(user);
      await this.vectorKnowledgeBaseRepository.save(knowledgeBase);
    }
  }

  async removeUserFromChatHistory(knowledgeBaseId: string, userId: string): Promise<void> {
    const knowledgeBase = await this.vectorKnowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new NotFoundException('Vector knowledge base not found');
    }

    if (!knowledgeBase.chatHistoryUsers) {
      return;
    }

    knowledgeBase.chatHistoryUsers = knowledgeBase.chatHistoryUsers.filter(user => user.id !== userId);
    await this.vectorKnowledgeBaseRepository.save(knowledgeBase);
  }

  async getChatHistoryUsers(knowledgeBaseId: string): Promise<User[]> {
    const knowledgeBase = await this.vectorKnowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new NotFoundException('Vector knowledge base not found');
    }

    return knowledgeBase.chatHistoryUsers || [];
  }
} 