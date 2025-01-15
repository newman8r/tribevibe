import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateVectorIndexCommand } from './create-vector-index.command';
import { ProcessDocumentCommand } from './process-document.command';
import { InspectEmbeddingsCommand } from './inspect-embeddings.command';
import { SearchDocumentsCommand } from './search-documents.command';
import { DocumentProcessingService } from '../services/document-processing.service';
import { VectorSearchService } from '../services/vector-search.service';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { InspectTableCommand } from './inspect-table.command';
import { DropTableCommand } from './drop-table.command';
import { ClearVectorDBCommand } from './clear-vectordb.command';
import { SetAdminCommand } from './set-admin.command';
import { UserModule } from '../user/user.module';

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
    UserModule
  ],
  providers: [
    CreateVectorIndexCommand,
    ProcessDocumentCommand,
    InspectEmbeddingsCommand,
    SearchDocumentsCommand,
    DocumentProcessingService,
    VectorSearchService,
    InspectTableCommand,
    DropTableCommand,
    ClearVectorDBCommand,
    SetAdminCommand
  ],
})
export class CommandsModule {} 