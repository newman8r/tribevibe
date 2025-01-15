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
import { DocumentProcessingService } from '../services/document-processing.service';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { VectorModule } from '../services/vector.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AiAgentStrategy,
      AiAgentPersonality,
      Channel,
      AiAgentChannel,
      VectorKnowledgeBase,
      CorpusFile,
      DocumentEmbedding
    ]),
    AuthModule,
    UserModule,
    VectorModule
  ],
  controllers: [AdminController],
  providers: [AdminService, CorpusFileService, DocumentProcessingService],
})
export class AdminModule {} 