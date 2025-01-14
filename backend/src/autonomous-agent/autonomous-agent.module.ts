import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutonomousAgentService } from './autonomous-agent.service';
import { AutonomousAgentController } from './autonomous-agent.controller';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { User } from '../entities/user.entity';
import { SimpleResponseStrategy } from './strategies/simple-response.strategy';
import { StrategyRegistryService } from './services/strategy-registry.service';
import { MovieQuotesStrategy } from './strategies/movie-quotes.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiAgentChannel,
      AiAgentStrategy,
      User
    ])
  ],
  providers: [
    AutonomousAgentService,
    StrategyRegistryService,
    SimpleResponseStrategy,
    MovieQuotesStrategy
  ],
  controllers: [AutonomousAgentController],
  exports: [AutonomousAgentService]
})
export class AutonomousAgentModule {} 