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
  private readonly contextSize = 20;

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

      // Format messages for GPT without username prefixes in the content
      const conversationHistory: ChatCompletionMessageParam[] = previousMessages.reverse().map(msg => ({
        role: msg.user?.isAiAgent ? 'assistant' : 'user',
        content: msg.content // Remove username prefix
      }));

      // Add the current message without username prefix
      conversationHistory.push({
        role: 'user',
        content: message.content // Remove username prefix
      });

      // System prompt with contextual information
      const systemPrompt: ChatCompletionMessageParam = {
        role: 'system',
        content: `You are a helpful and friendly community manager, with the personality of a festival veteran to electronic music festivals and other events.
                 You have a good sense of humor, especially related to the festival and the music.
                 You have access to relevant contextual information that you can use to provide more informed responses.
                 You are here to help people have an amazing time at the festival and to discuss anything music related, healing related, with a general good vibe
                 
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
                 
                 Below is the conversation history of this channel, use it to understand the context of the conversation.
                 `

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