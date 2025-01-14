import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutonomousAgentService } from './autonomous-agent.service';
import { AutonomousAgentController } from './autonomous-agent.controller';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiAgentChannel, User])
  ],
  providers: [AutonomousAgentService],
  controllers: [AutonomousAgentController],
  exports: [AutonomousAgentService]
})
export class AutonomousAgentModule {} 