import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseStrategy } from '../strategies/base-strategy.interface';
import { MovieQuotesStrategy } from '../strategies/movie-quotes.strategy';
import { SimpleResponseStrategy } from '../strategies/simple-response.strategy';
import { GptAssistantStrategy } from '../strategies/gpt-assistant.strategy';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../../message/message.service';

@Injectable()
export class StrategyRegistryService implements OnModuleInit {
  private strategies: Map<string, BaseStrategy> = new Map();

  constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private movieQuotesStrategy: MovieQuotesStrategy,
    private simpleResponseStrategy: SimpleResponseStrategy,
    private gptAssistantStrategy: GptAssistantStrategy
  ) {}

  async onModuleInit() {
    await this.loadStrategies();
    console.log('Loaded strategies:', Array.from(this.strategies.keys()));
  }

  async loadStrategies() {
    // Register strategy instances directly
    this.strategies.set('movie-quotes', this.movieQuotesStrategy);
    this.strategies.set('simple-response', this.simpleResponseStrategy);
    this.strategies.set('gpt-assistant', this.gptAssistantStrategy);
  }

  getStrategy(strategyName: string): BaseStrategy | null {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      console.log(`Strategy not found: ${strategyName}`);
      return null;
    }
    return strategy;
  }
} 