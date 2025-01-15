import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIEmbeddings } from "@langchain/openai";
import { ConfigService } from '@nestjs/config';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private vectorStore: HNSWLib;
  private vectorStorePath: string;

  constructor(
    @InjectRepository(DocumentEmbedding)
    private documentEmbeddingRepository: Repository<DocumentEmbedding>,
    @InjectRepository(VectorKnowledgeBase)
    private knowledgeBaseRepository: Repository<VectorKnowledgeBase>,
    private configService: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'text-embedding-3-small',
    });
    this.vectorStorePath = this.configService.get<string>('VECTOR_STORE_PATH') || './.vectorstore';
  }

  async searchSimilarDocuments(
    query: string, 
    knowledgeBaseId?: string | undefined,
    limit: number = 5
  ): Promise<Array<{ content: string; similarity: number; source: string; sourceId: string }>> {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      this.logger.log(`Query embedding generated for "${query}". Length: ${queryEmbedding.length}`);

      const vectorStr = `[${queryEmbedding.join(',')}]`;
      
      // First, let's check what embeddings we have
      const countQuery = knowledgeBaseId 
        ? `
          SELECT COUNT(*) as total,
                 COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
          FROM document_embedding
          WHERE "knowledgeBaseId" = $1;
        `
        : `
          SELECT COUNT(*) as total,
                 COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
          FROM document_embedding
          WHERE "knowledgeBaseId" IS NULL;
        `;

      const counts = await this.documentEmbeddingRepository.query(
        countQuery, 
        knowledgeBaseId ? [knowledgeBaseId] : []
      );
      this.logger.log('Database counts:', counts);

      const sqlQuery = knowledgeBaseId
        ? `
          SELECT 
            content,
            source,
            "sourceId",
            (embedding::vector <#> ($1)::vector) * -1 + 1 as similarity
          FROM document_embedding
          WHERE embedding IS NOT NULL
          AND "knowledgeBaseId" = $2
          ORDER BY embedding::vector <#> ($1)::vector
          LIMIT $3;
        `
        : `
          SELECT 
            content,
            source,
            "sourceId",
            (embedding::vector <#> ($1)::vector) * -1 + 1 as similarity
          FROM document_embedding
          WHERE embedding IS NOT NULL
          AND "knowledgeBaseId" IS NULL
          ORDER BY embedding::vector <#> ($1)::vector
          LIMIT $2;
        `;
      
      this.logger.log('Executing search query...');
      const results = await this.documentEmbeddingRepository.query(
        sqlQuery, 
        knowledgeBaseId ? [vectorStr, knowledgeBaseId, limit] : [vectorStr, limit]
      );
      this.logger.log(`Found ${results.length} results`);
      
      results.forEach((result: { content: string; similarity: number; source: string }, idx: number) => {
        this.logger.log('\n-------------------');
        this.logger.log(`Result ${idx + 1}:`);
        this.logger.log(`Similarity: ${result.similarity}`);
        this.logger.log(`Source: ${result.source}`);
        this.logger.log(`Full content:\n${result.content}`);
        this.logger.log('-------------------\n');
      });

      return results;
    } catch (error) {
      this.logger.error('Error in vector search:', error);
      throw error;
    }
  }

  async searchBySource(
    query: string, 
    sourceId: string, 
    knowledgeBaseId?: string | undefined,
    limit: number = 5
  ): Promise<Array<{ content: string; similarity: number; source: string; sourceId: string }>> {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    const sqlQuery = knowledgeBaseId
      ? `
        SELECT 
          content,
          source,
          "sourceId",
          (embedding <#> $1::vector) * -1 + 1 as similarity
        FROM document_embedding
        WHERE "sourceId" = $2
        AND "knowledgeBaseId" = $3
        ORDER BY embedding <#> $1::vector
        LIMIT $4
      `
      : `
        SELECT 
          content,
          source,
          "sourceId",
          (embedding <#> $1::vector) * -1 + 1 as similarity
        FROM document_embedding
        WHERE "sourceId" = $2
        AND "knowledgeBaseId" IS NULL
        ORDER BY embedding <#> $1::vector
        LIMIT $3
      `;

    const results = await this.documentEmbeddingRepository.query(
      sqlQuery, 
      knowledgeBaseId 
        ? [queryEmbedding, sourceId, knowledgeBaseId, limit]
        : [queryEmbedding, sourceId, limit]
    );

    return results;
  }

  async clearKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    try {
      // Clear the database table for this knowledge base
      await this.documentEmbeddingRepository.delete({ knowledgeBase: { id: knowledgeBaseId } });
      
      console.log(`Vector store cleared for knowledge base ${knowledgeBaseId}`);
    } catch (error) {
      console.error('Error clearing vector store:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      // Clear the file-based vector store
      if (this.vectorStore) {
        await this.vectorStore.delete({
          directory: this.vectorStorePath
        });
      }
      
      // Clear the filesystem storage
      const fs = require('fs').promises;
      await fs.rm(this.vectorStorePath, { recursive: true, force: true });
      await fs.mkdir(this.vectorStorePath, { recursive: true });
      
      // Clear the database table
      await this.documentEmbeddingRepository.clear();
      
      console.log(`Vector store cleared: 
        - File store at ${this.vectorStorePath}
        - Database table document_embedding`);
    } catch (error) {
      console.error('Error clearing vector store:', error);
      throw error;
    }
  }
} 