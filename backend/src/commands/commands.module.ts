import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateVectorIndexCommand } from './create-vector-index.command';
import { ProcessDocumentCommand } from './process-document.command';
import { InspectEmbeddingsCommand } from './inspect-embeddings.command';
import { DocumentProcessingService } from '../services/document-processing.service';
import { DocumentEmbedding } from '../entities/document-embedding.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([DocumentEmbedding]),
  ],
  providers: [
    CreateVectorIndexCommand,
    ProcessDocumentCommand,
    InspectEmbeddingsCommand,
    DocumentProcessingService,
  ],
})
export class CommandsModule {} 