import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { AiAgentPersonality } from '../entities/ai-agent-personality.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { Channel } from '../entities/channel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AiAgentStrategy,
      AiAgentPersonality,
      Channel
    ]),
    UserModule,
    AuthModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {} 