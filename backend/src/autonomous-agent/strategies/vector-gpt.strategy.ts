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
      // First get the AI agent for this channel
      const agent = await this.userRepository.findOne({
        where: { 
          channels: { id: message.channel.id },
          isAiAgent: true
        }
      });

      if (!agent) {
        this.logger.error('No AI agent found for channel');
        return 'I apologize, but I encountered an error processing your message.';
      }

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
        content: `You are a helpful and friendly community manager, with the personality of a festival veteran to electronic music festivals and other events.
                 You have a good sense of humor, especially related to the festival and the music.
                 You have access to relevant contextual information that you can use to provide more informed responses.
                 You are here to help people have an amazing time at the festival and to discuss anything music related, healing related, with a general good vibe
                 Try to add relevant emojis whenever possible to create great vibes, but dont go overboard

                 Relevant Context:
                 ${contextualInfo}
                 
                 Instructions:
                 - Use the context provided above when it's relevant to the conversation. It will very often not be relevant.
                 - Keep responses concise and engaging. Take an enlightened, awakened approach.
                 - You are representing a music festival, so ultimately people are here to have a good time, make sure you help them have a good time.
                 - Maintain a positive and supportive tone
                 - feel free to be a little bit edgy, never be boring.
                 - You should act like a festival veteran, but also be approachable and friendly.
                 - If you don't know something, admit it - especially if it's related to the event or the festival.
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