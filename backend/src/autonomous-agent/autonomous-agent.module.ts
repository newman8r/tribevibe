import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from '../message/message.module';
import { VectorModule } from '../services/vector.module';
import { AutonomousAgentService } from './autonomous-agent.service';
import { AutonomousAgentController } from './autonomous-agent.controller';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { AiAgentKnowledgeBase } from '../entities/ai-agent-knowledge-base.entity';
import { User } from '../entities/user.entity';
import { SimpleResponseStrategy } from './strategies/simple-response.strategy';
import { StrategyRegistryService } from './services/strategy-registry.service';
import { MovieQuotesStrategy } from './strategies/movie-quotes.strategy';
import { GptAssistantStrategy } from './strategies/gpt-assistant.strategy';
import { VectorGptStrategy } from './strategies/vector-gpt.strategy';

@Module({
  imports: [
    ConfigModule,
    MessageModule,
    VectorModule,
    TypeOrmModule.forFeature([
      AiAgentChannel,
      AiAgentStrategy,
      AiAgentKnowledgeBase,
      User
    ])
  ],
  providers: [
    AutonomousAgentService,
    StrategyRegistryService,
    SimpleResponseStrategy,
    MovieQuotesStrategy,
    GptAssistantStrategy,
    VectorGptStrategy
  ],
  controllers: [AutonomousAgentController],
  exports: [AutonomousAgentService]
})
export class AutonomousAgentModule {} 