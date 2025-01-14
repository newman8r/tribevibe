import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseStrategy } from '../strategies/base-strategy.interface';
import { MovieQuotesStrategy } from '../strategies/movie-quotes.strategy';
import { SimpleResponseStrategy } from '../strategies/simple-response.strategy';

@Injectable()
export class StrategyRegistryService implements OnModuleInit {
  private strategies: Map<string, new () => BaseStrategy> = new Map();

  async onModuleInit() {
    await this.loadStrategies();
    console.log('Loaded strategies:', Array.from(this.strategies.keys()));
  }

  async loadStrategies() {
    // Register strategies directly
    this.strategies.set('movie-quotes', MovieQuotesStrategy);
    this.strategies.set('simple-response', SimpleResponseStrategy);
  }

  getStrategy(strategyName: string): BaseStrategy | null {
    const StrategyClass = this.strategies.get(strategyName);
    if (!StrategyClass) {
      console.log(`Strategy not found: ${strategyName}`);
      return null;
    }
    return new StrategyClass();
  }
} 