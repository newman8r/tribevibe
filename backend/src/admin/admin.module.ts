import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { AiAgentPersonality } from '../entities/ai-agent-personality.entity';
import { Channel } from '../entities/channel.entity';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { CorpusFile } from '../entities/corpus-file.entity';
import { CorpusFileService } from '../services/corpus-file.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AiAgentStrategy,
      AiAgentPersonality,
      Channel,
      AiAgentChannel,
      VectorKnowledgeBase,
      CorpusFile
    ]),
    AuthModule,
    UserModule
  ],
  controllers: [AdminController],
  providers: [AdminService, CorpusFileService],
})
export class AdminModule {} 