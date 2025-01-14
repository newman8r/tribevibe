import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VectorSearchService } from './vector-search.service';
import { DocumentEmbedding } from '../entities/document-embedding.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DocumentEmbedding]),
  ],
  providers: [VectorSearchService],
  exports: [VectorSearchService]
})
export class VectorModule {} 