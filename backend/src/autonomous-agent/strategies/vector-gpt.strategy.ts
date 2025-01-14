import { Injectable, Logger } from '@nestjs/common';
import { BaseStrategy } from './base-strategy.interface';
import { Message } from '../../entities/message.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../../message/message.service';
import { VectorSearchService } from '../../services/vector-search.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class VectorGptStrategy implements BaseStrategy {
  private readonly logger = new Logger(VectorGptStrategy.name);
  private openai: OpenAI;
  private readonly contextSize = 10;

  constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private vectorSearchService: VectorSearchService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async processMessage(message: Message): Promise<string | null> {
    try {
      // First, search for relevant content using vector search
      const vectorResults = await this.vectorSearchService.searchSimilarDocuments(message.content, 1);
      let contextualInfo = '';
      
      if (vectorResults.length > 0) {
        const topResult = vectorResults[0];
        this.logger.log('Found relevant context:');
        this.logger.log(`Source: ${topResult.source}`);
        this.logger.log(`Similarity: ${topResult.similarity}`);
        this.logger.log(`Content: ${topResult.content}`);
        contextualInfo = topResult.content;
      }

      // Get previous messages for conversation context
      const previousMessages = await this.messageService.getChannelMessages(
        message.channel.id,
        this.contextSize
      );

      // Format messages for GPT
      const conversationHistory: ChatCompletionMessageParam[] = previousMessages.reverse().map(msg => ({
        role: msg.user?.isAiAgent ? 'assistant' : 'user',
        content: `${msg.username}: ${msg.content}`
      }));

      // Add the current message
      conversationHistory.push({
        role: 'user',
        content: `${message.username}: ${message.content}`
      });

      // System prompt with contextual information
      const systemPrompt: ChatCompletionMessageParam = {
        role: 'system',
        content: `You are a helpful and friendly chat participant.
                 You have access to relevant contextual information that you can use to provide more informed responses.
                 
                 Relevant Context:
                 ${contextualInfo}
                 
                 Instructions:
                 - Use the context provided above when it's relevant to the conversation
                 - You will receive messages in the format "username: message"
                 - Respond with just your message content, without any username prefix
                 - Keep responses concise and engaging
                 - Maintain a positive and supportive tone
                 - If you don't know something, admit it
                 - Don't use offensive language or inappropriate content`
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