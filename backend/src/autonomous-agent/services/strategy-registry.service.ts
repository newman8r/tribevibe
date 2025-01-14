import { Injectable } from '@nestjs/common';
import { BaseStrategy } from '../strategies/base-strategy.interface';
import { MovieQuotesStrategy } from '../strategies/movie-quotes.strategy';
import { SimpleResponseStrategy } from '../strategies/simple-response.strategy';
import { GptAssistantStrategy } from '../strategies/gpt-assistant.strategy';
import { VectorGptStrategy } from '../strategies/vector-gpt.strategy';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../../message/message.service';

@Injectable()
export class StrategyRegistryService {
  private strategies: Map<string, BaseStrategy>;

  constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private movieQuotesStrategy: MovieQuotesStrategy,
    private simpleResponseStrategy: SimpleResponseStrategy,
    private gptAssistantStrategy: GptAssistantStrategy,
    private vectorGptStrategy: VectorGptStrategy
  ) {
    this.strategies = new Map();
    this.strategies.set('simple-response', simpleResponseStrategy);
    this.strategies.set('movie-quotes', movieQuotesStrategy);
    this.strategies.set('gpt-assistant', gptAssistantStrategy);
    this.strategies.set('vector-gpt', vectorGptStrategy);
  }

  getStrategy(name: string): BaseStrategy | undefined {
    return this.strategies.get(name);
  }
} 