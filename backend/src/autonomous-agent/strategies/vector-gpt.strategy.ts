import { Injectable, Logger } from '@nestjs/common';
import { BaseStrategy } from './base-strategy.interface';
import { Message } from '../../entities/message.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../../message/message.service';
import { VectorSearchService } from '../../services/vector-search.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgentKnowledgeBase } from '../../entities/ai-agent-knowledge-base.entity';
import { VectorKnowledgeBase } from '../../entities/vector-knowledge-base.entity';
import { User } from '../../entities/user.entity';
import { AiAgentPersonality } from '../../entities/ai-agent-personality.entity';

interface SearchResult {
  content: string;
  similarity: number;
  source: string;
  sourceId: string;
}

interface KnowledgeBaseSearchResult {
  knowledgeBase: VectorKnowledgeBase | null;
  originalResults: SearchResult[];
  reformulatedResults: SearchResult[];
}

@Injectable()
export class VectorGptStrategy implements BaseStrategy {
  private readonly logger = new Logger(VectorGptStrategy.name);
  private openai: OpenAI;
  private readonly contextSize = 20;

  constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private vectorSearchService: VectorSearchService,
    @InjectRepository(AiAgentKnowledgeBase)
    private aiAgentKnowledgeBaseRepository: Repository<AiAgentKnowledgeBase>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async processMessage(message: Message): Promise<string | null> {
    try {
      // Skip processing if the message is from another AI agent
      if (message.user?.isAiAgent) {
        this.logger.debug('Skipping message from another AI agent');
        return null;
      }

      // First get the AI agent for this channel
      const agent = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.aiAgentChannels', 'agentChannel')
        .innerJoin('agentChannel.channel', 'channel')
        .leftJoinAndSelect('user.personality', 'personality')
        .where('channel.id = :channelId', { channelId: message.channel.id })
        .andWhere('user.isAiAgent = :isAiAgent', { isAiAgent: true })
        .andWhere('agentChannel.isActive = :isActive', { isActive: true })
        .getOne();

      if (!agent) {
        this.logger.error('No AI agent found for channel');
        return 'I apologize, but I encountered an error processing your message.';
      }

      // Check rate limit
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const messageCount = await this.messageService.countMessagesFromUser(
        agent.id,
        oneHourAgo
      );

      const maxResponses = agent.personality?.maxHourlyResponses || 100;
      if (messageCount >= maxResponses) {
        this.logger.warn(`AI agent ${agent.username} has exceeded hourly message limit of ${maxResponses}`);
        return null;
      }

      // Get current date for context
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get all knowledge bases associated with this AI agent
      const agentKnowledgeBases = await this.aiAgentKnowledgeBaseRepository.find({
        where: { agent: { id: agent.id } },
        relations: ['knowledgeBase'],
      });

      // First, use GPT-4 to reformulate the question for better vector search
      const reformulationResponse = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at reformulating questions to be more detailed and specific. 
                     Your task is to rewrite the user's question in a way that would help find the most relevant information.
                     Include relevant context and details that might be implicit in the original question.
                     Do not answer the question, just reformulate it more verbosely.
                     Output only the reformulated question, nothing else.`
          },
          {
            role: 'user',
            content: message.content
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const reformulatedQuestion = reformulationResponse.choices[0]?.message?.content || message.content;
      
      // Search across all knowledge bases associated with this agent
      const searchPromises: Promise<KnowledgeBaseSearchResult>[] = agentKnowledgeBases.map(async (agentKb) => {
        const [originalResults, reformulatedResults] = await Promise.all([
          this.vectorSearchService.searchSimilarDocuments(message.content, agentKb.knowledgeBase.id, 1),
          this.vectorSearchService.searchSimilarDocuments(reformulatedQuestion, agentKb.knowledgeBase.id, 1)
        ]);
        return { 
          knowledgeBase: agentKb.knowledgeBase,
          originalResults,
          reformulatedResults
        };
      });

      // If no knowledge bases are associated, search in the legacy store
      if (agentKnowledgeBases.length === 0) {
        const [originalResults, reformulatedResults] = await Promise.all([
          this.vectorSearchService.searchSimilarDocuments(message.content, undefined, 1),
          this.vectorSearchService.searchSimilarDocuments(reformulatedQuestion, undefined, 1)
        ]);
        searchPromises.push(Promise.resolve({
          knowledgeBase: null,
          originalResults,
          reformulatedResults
        }));
      }

      const searchResults = await Promise.all(searchPromises);
      
      // Combine contextual information from all searches
      let contextualInfo = '';
      
      searchResults.forEach(result => {
        const kbName = result.knowledgeBase?.name || 'Legacy Store';
        
        // Add usage instructions if available
        if (result.knowledgeBase?.usage) {
          contextualInfo += `\nCustom Search Result Instructions for ${kbName}:\n${result.knowledgeBase.usage}\n`;
        }
        
        if (result.originalResults.length > 0) {
          contextualInfo += `\nContext from ${kbName} (original query):\n${result.originalResults[0].content}\n`;
        }
        if (result.reformulatedResults.length > 0) {
          contextualInfo += `\nContext from ${kbName} (expanded query):\n${result.reformulatedResults[0].content}\n`;
        }
      });

      // Get previous messages in the channel for conversation context
      const previousMessages = await this.messageService.getChannelMessages(
        message.channel.id,
        this.contextSize
      );

      // Format messages for GPT
      const conversationHistory: ChatCompletionMessageParam[] = previousMessages.reverse().map(msg => ({
        role: msg.user?.isAiAgent ? 'assistant' : 'user',
        content: msg.content
      }));

      conversationHistory.push({
        role: 'user',
        content: message.content
      });

      const systemPrompt: ChatCompletionMessageParam = {
        role: 'system',
        content: `${agent.personality?.generalPersonality || 'You are a helpful and friendly community manager.'}

                 Personal Details:
                 - Agent's real Name: ${agent.personality?.displayName || agent.username}
                 - Personality Type: ${agent.personality?.meyersBriggs || 'INTP'}
                 - Writing Style: ${agent.personality?.writingStyle || 'Professional and concise'}
                 - Contact: ${agent.personality?.contactEmail || 'No contact provided'}
                 - Current Date: ${currentDate}

                 Relevant Context:
                 ${contextualInfo}
                 
                - Use the context provided above when it's relevant to the conversation. It will very often not be relevant.

                 ${agent.personality?.instructions ? `Primary Instructions:\n${agent.personality.instructions}\n\n` : ''}

                 Core Guidelines:
                 - If you don't know something, admit it - but like a human
                 - Do not include any username or prefix in your response
                 - Just provide the response content directly
                 
                 Below is the conversation history of this channel, use it to understand the context of the conversation.`
      };

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [systemPrompt, ...conversationHistory],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || null;

    } catch (error) {
      this.logger.error('Vector GPT Strategy Error:', error);
      return 'I apologize, but I encountered an error processing your message.';
    }
  }
}

export default VectorGptStrategy;