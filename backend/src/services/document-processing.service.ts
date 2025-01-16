import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { VectorKnowledgeBase, ChunkingStrategy } from '../entities/vector-knowledge-base.entity';
import { ConfigService } from '@nestjs/config';

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

      // Get chunks based on the knowledge base settings
      const chunks = knowledgeBase 
        ? this.chunkText(content, knowledgeBase)
        : this.chunkText(content); // Fallback to default settings

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

            const documentEmbedding = new DocumentEmbedding();
            documentEmbedding.content = batch[j];
            documentEmbedding.source = source;
            documentEmbedding.sourceId = sourceId;
            documentEmbedding.embedding = embedding;
            documentEmbedding.knowledgeBase = knowledgeBase;

            await this.documentEmbeddingRepository.save(documentEmbedding);
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
    } catch (error) {
      this.logger.error('Error processing content:', error);
      throw error;
    }
  }

  private chunkText(text: string, knowledgeBase?: VectorKnowledgeBase): string[] {
    // Default settings if no knowledge base is provided
    const defaultSettings = {
      chunkingStrategy: ChunkingStrategy.FIXED_SIZE,
      chunkingSettings: {
        chunkSize: 1000,
        chunkOverlap: 200
      }
    };

    const strategy = knowledgeBase?.chunkingStrategy || defaultSettings.chunkingStrategy;
    const settings = knowledgeBase?.chunkingSettings || defaultSettings.chunkingSettings;

    switch (strategy) {
      case ChunkingStrategy.FIXED_SIZE:
        return this.chunkByFixedSize(text, settings.chunkSize || 1000, settings.chunkOverlap || 200);
      case ChunkingStrategy.SEMANTIC:
        return this.chunkBySemantic(text);
      case ChunkingStrategy.PARAGRAPH:
        return this.chunkByParagraph(text);
      default:
        return this.chunkByFixedSize(text, 1000, 200); // Fallback to fixed size
    }
  }

  private chunkByFixedSize(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would exceed chunk size
      if ((currentChunk + ' ' + trimmedSentence).length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // Keep the overlap from the previous chunk
          const words = currentChunk.split(' ');
          currentChunk = words.slice(-Math.floor(overlap / 10)).join(' '); // Approximate overlap by words
        }
      }
      
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private chunkBySemantic(text: string): string[] {
    // Split on semantic boundaries like paragraphs, sections, and major punctuation
    const chunks: string[] = [];
    
    // First split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
      // Then split long paragraphs on semantic boundaries
      if (paragraph.length > 1000) {
        // Split on common semantic markers
        const segments = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
        let currentChunk = '';
        
        for (const segment of segments) {
          if ((currentChunk + ' ' + segment).length > 1000) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = segment;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + segment;
          }
        }
        
        if (currentChunk) chunks.push(currentChunk.trim());
      } else {
        chunks.push(paragraph.trim());
      }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  private chunkByParagraph(text: string): string[] {
    // Split text into paragraphs based on double newlines
    return text
      .split(/\n\s*\n/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 