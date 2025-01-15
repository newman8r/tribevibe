import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { OpenAIEmbeddings } from "@langchain/openai";

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private readonly batchSize = 10;
  private readonly delayBetweenBatches = 1000;

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
  }

  async processContent(
    content: string, 
    source: string, 
    sourceId: string,
    knowledgeBaseId?: string
  ): Promise<void> {
    try {
      // First, check if we have the OpenAI API key
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      // If knowledgeBaseId is provided, verify it exists
      let knowledgeBase: VectorKnowledgeBase | null = null;
      if (knowledgeBaseId) {
        knowledgeBase = await this.knowledgeBaseRepository.findOne({
          where: { id: knowledgeBaseId }
        });
        if (!knowledgeBase) {
          throw new Error(`Knowledge base with ID ${knowledgeBaseId} not found`);
        }
      }

      const chunks = this.chunkText(content);
      const totalChunks = chunks.length;
      this.logger.log(`Processing ${totalChunks} chunks in batches of ${this.batchSize}`);

      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + this.batchSize);
        const progress = Math.round((i / totalChunks) * 100);
        this.logger.log(`Progress: ${progress}% (${i}/${totalChunks} chunks)`);

        try {
          const embeddings = await this.embeddings.embedDocuments(batch);
          this.logger.log(`Generated embeddings for batch ${i}-${i + batch.length}. First embedding length: ${embeddings[0]?.length}`);

          for (let j = 0; j < batch.length; j++) {
            const embedding = embeddings[j];
            if (!embedding) {
              this.logger.error(`No embedding generated for chunk ${i + j}`);
              continue;
            }

            await this.documentEmbeddingRepository.save({
              content: batch[j],
              source,
              sourceId,
              embedding: embedding,
              knowledgeBase: knowledgeBase
            });
            this.logger.log(`Saved document ${i + j} with embedding length ${embedding.length}`);
          }
        } catch (error) {
          this.logger.error(`Error processing batch ${i}-${i + batch.length}:`, error);
          throw error;
        }

        if (i + this.batchSize < chunks.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      this.logger.log('Processing completed successfully');
    } catch (error) {
      this.logger.error('Error in processContent:', error);
      throw error;
    }
  }

  private chunkText(text: string, maxLength: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 