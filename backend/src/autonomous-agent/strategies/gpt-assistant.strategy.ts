import { Injectable } from '@nestjs/common';
import { BaseStrategy } from './base-strategy.interface';
import { Message } from '../../entities/message.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../../message/message.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class GptAssistantStrategy implements BaseStrategy {
  private openai: OpenAI;
  private readonly contextSize = 10;

  constructor(
    private configService: ConfigService,
    private messageService: MessageService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async processMessage(message: Message): Promise<string | null> {
    try {
      // Get previous messages for context
      const previousMessages = await this.messageService.getChannelMessages(
        message.channel.id,
        this.contextSize
      );

      // Format messages for GPT with username context
      const conversationHistory: ChatCompletionMessageParam[] = previousMessages.reverse().map(msg => ({
        role: msg.user?.isAiAgent ? 'assistant' : 'user',
        content: `${msg.username}: ${msg.content}`
      }));

      // Add the current message
      conversationHistory.push({
        role: 'user',
        content: `${message.username}: ${message.content}`
      });

      // System prompt to set the AI's behavior
      const systemPrompt: ChatCompletionMessageParam = {
        role: 'system',
        content: `You are a helpful and friendly chat participant.
                 You will receive messages in the format "username: message" to understand the conversation context.
                 However, you should respond with just your message content, without any username prefix.
                 Keep responses concise and engaging.
                 Maintain a positive and supportive tone.
                 If you don't know something, admit it.
                 Don't use offensive language or inappropriate content.`
      };

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [systemPrompt, ...conversationHistory],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || null;

    } catch (error) {
      console.error('GPT Assistant Strategy Error:', error);
      return 'I apologize, but I encountered an error processing your message.';
    }
  }
}

export default GptAssistantStrategy; 