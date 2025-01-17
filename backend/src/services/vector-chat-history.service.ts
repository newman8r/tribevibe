import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { OpenAIEmbeddings } from "@langchain/openai";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorChatHistoryService {
  private readonly logger = new Logger(VectorChatHistoryService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(VectorKnowledgeBase)
    private knowledgeBaseRepository: Repository<VectorKnowledgeBase>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(DocumentEmbedding)
    private documentEmbeddingRepository: Repository<DocumentEmbedding>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'text-embedding-3-small',
    });
  }

  async addUserToChatHistory(knowledgeBaseId: string, userId: string): Promise<void> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
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
      await this.knowledgeBaseRepository.save(knowledgeBase);
    }
  }

  async removeUserFromChatHistory(knowledgeBaseId: string, userId: string): Promise<void> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
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
    await this.knowledgeBaseRepository.save(knowledgeBase);
  }

  async getChatHistoryUsers(knowledgeBaseId: string): Promise<User[]> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new NotFoundException('Vector knowledge base not found');
    }

    return knowledgeBase.chatHistoryUsers || [];
  }

  async processChatHistories(knowledgeBaseId: string): Promise<void> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new Error('Knowledge base not found');
    }

    // Delete existing chat history embeddings for this knowledge base
    await this.documentEmbeddingRepository.delete({
      knowledgeBase: { id: knowledgeBaseId },
      source: 'chat_history'
    });

    // Process each user's chat history
    for (const user of knowledgeBase.chatHistoryUsers) {
      await this.processUserChatHistory(user, knowledgeBase);
    }

    // Mark chat histories as processed
    await this.knowledgeBaseRepository.update(
      { id: knowledgeBaseId },
      { chatHistoriesProcessed: true }
    );
  }

  private async processUserChatHistory(user: User, knowledgeBase: VectorKnowledgeBase): Promise<void> {
    // Get all messages for the user
    const messages = await this.messageRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'ASC' }
    });

    if (messages.length === 0) {
      return;
    }

    // Group messages by conversation (either channel or DM)
    const conversations = this.groupMessagesByConversation(messages);

    // Process each conversation
    for (const [conversationId, conversationMessages] of Object.entries(conversations)) {
      const conversationText = this.formatConversation(conversationMessages);
      
      try {
        // Generate embedding for the conversation
        const embedding = await this.embeddings.embedQuery(conversationText);

        // Create document embedding
        const documentEmbedding = this.documentEmbeddingRepository.create({
          content: conversationText,
          embedding: embedding,
          source: 'chat_history',
          sourceId: `${user.id}_${conversationId}`,
          knowledgeBase
        });

        await this.documentEmbeddingRepository.save(documentEmbedding);
      } catch (error) {
        this.logger.error(`Error processing conversation ${conversationId} for user ${user.id}:`, error);
      }
    }
  }

  private groupMessagesByConversation(messages: Message[]): { [key: string]: Message[] } {
    const conversations: { [key: string]: Message[] } = {};

    for (const message of messages) {
      const conversationId = message.channel?.id || message.directMessageConversation?.id;
      if (conversationId) {
        if (!conversations[conversationId]) {
          conversations[conversationId] = [];
        }
        conversations[conversationId].push(message);
      }
    }

    return conversations;
  }

  private formatConversation(messages: Message[]): string {
    return messages.map(msg => {
      const timestamp = new Date(msg.createdAt).toISOString();
      return `[${timestamp}] ${msg.username}: ${msg.content}`;
    }).join('\n');
  }
} 