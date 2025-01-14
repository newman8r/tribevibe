import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from '../message/message.module';
import { AutonomousAgentService } from './autonomous-agent.service';
import { AutonomousAgentController } from './autonomous-agent.controller';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { User } from '../entities/user.entity';
import { SimpleResponseStrategy } from './strategies/simple-response.strategy';
import { StrategyRegistryService } from './services/strategy-registry.service';
import { MovieQuotesStrategy } from './strategies/movie-quotes.strategy';
import { GptAssistantStrategy } from './strategies/gpt-assistant.strategy';

@Module({
  imports: [
    ConfigModule,
    MessageModule,
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
    MovieQuotesStrategy,
    GptAssistantStrategy
  ],
  controllers: [AutonomousAgentController],
  exports: [AutonomousAgentService]
})
export class AutonomousAgentModule {} 