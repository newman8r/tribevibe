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
    this.logger.log(`Starting chat history processing for knowledge base ${knowledgeBaseId}`);
    
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId },
      relations: ['chatHistoryUsers']
    });

    if (!knowledgeBase) {
      throw new Error('Knowledge base not found');
    }

    this.logger.log(`Found ${knowledgeBase.chatHistoryUsers?.length || 0} users with chat histories to process`);

    // Delete existing chat history embeddings for this knowledge base
    const deleteResult = await this.documentEmbeddingRepository.delete({
      knowledgeBase: { id: knowledgeBaseId },
      source: 'chat_history'
    });
    this.logger.log(`Deleted ${deleteResult.affected || 0} existing chat history embeddings`);

    // Process each user's chat history
    if (knowledgeBase.chatHistoryUsers?.length) {
      for (const user of knowledgeBase.chatHistoryUsers) {
        this.logger.log(`Processing chat history for user ${user.username} (${user.id})`);
        try {
          await this.processUserChatHistory(user, knowledgeBase);
        } catch (error) {
          this.logger.error(`Error processing chat history for user ${user.username}:`, error);
          // Continue with next user
        }
      }
    }

    // Mark chat histories as processed
    await this.knowledgeBaseRepository.update(
      { id: knowledgeBaseId },
      { chatHistoriesProcessed: true }
    );
    this.logger.log(`Finished processing chat histories for knowledge base ${knowledgeBaseId}`);
  }

  private async processUserChatHistory(user: User, knowledgeBase: VectorKnowledgeBase): Promise<void> {
    // Get all messages for the user
    const messages = await this.messageRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'ASC' },
      relations: ['channel', 'directMessageConversation']
    });

    this.logger.log(`Found ${messages.length} messages for user ${user.username}`);

    if (messages.length === 0) {
      return;
    }

    // Group messages by conversation (either channel or DM)
    const conversations = this.groupMessagesByConversation(messages);
    this.logger.log(`Grouped messages into ${Object.keys(conversations).length} conversations`);

    // Process each conversation
    for (const [conversationId, conversationMessages] of Object.entries(conversations)) {
      this.logger.log(`Processing conversation ${conversationId} with ${conversationMessages.length} messages`);
      
      const conversationText = this.formatConversation(conversationMessages);
      this.logger.log(`Formatted conversation text length: ${conversationText.length} characters`);
      
      try {
        // Generate embedding for the conversation
        this.logger.log('Generating embedding for conversation...');
        const embedding = await this.embeddings.embedQuery(conversationText);
        this.logger.log(`Generated embedding with length ${embedding.length}`);

        // Create document embedding
        const documentEmbedding = this.documentEmbeddingRepository.create({
          content: conversationText,
          embedding: embedding,
          source: 'chat_history',
          sourceId: `${user.id}_${conversationId}`,
          knowledgeBase
        });

        await this.documentEmbeddingRepository.save(documentEmbedding);
        this.logger.log(`Saved document embedding for conversation ${conversationId}`);
      } catch (error) {
        this.logger.error(`Error processing conversation ${conversationId} for user ${user.id}:`, error);
        throw error;
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