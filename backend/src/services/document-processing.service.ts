import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { OpenAIEmbeddings } from "@langchain/openai";
import * as path from 'path';
import * as fs from 'fs';
import * as pdf from 'pdf-parse';
import * as EPub from 'epub';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private embeddings: OpenAIEmbeddings;
  private readonly batchSize = 5;
  private readonly delayBetweenBatches = 1000;
  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;

  constructor(
    @InjectRepository(DocumentEmbedding)
    private documentEmbeddingRepository: Repository<DocumentEmbedding>,
    private configService: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'text-embedding-3-small',
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // Keep last part for overlap
          currentChunk = currentChunk.slice(-this.chunkOverlap) + sentence;
        } else {
          chunks.push(sentence.trim());
          currentChunk = '';
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async extractTextFromFile(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    const fileSize = (await fs.promises.stat(filePath)).size;
    this.logger.log(`Processing ${filePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    
    switch (extension) {
      case '.pdf':
        const dataBuffer = await fs.promises.readFile(filePath);
        const pdfData = await pdf(dataBuffer);
        return pdfData.text;

      case '.epub':
      case '.mobi':
        return new Promise((resolve, reject) => {
          const epub = new EPub(filePath);
          let text = '';

          epub.on('end', () => {
            epub.flow.forEach((chapter) => {
              epub.getChapter(chapter.id, (error: Error | null, content: string) => {
                if (!error && content) {
                  // Remove HTML tags
                  text += content.replace(/<[^>]*>/g, '') + '\n\n';
                }
              });
            });
            
            // Give time for all chapters to be processed
            setTimeout(() => resolve(text), 1000);
          });

          epub.on('error', reject);
          epub.parse();
        });

      case '.txt':
        return fs.promises.readFile(filePath, 'utf-8');

      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  async processContent(content: string, source: string, sourceId: string): Promise<void> {
    const text = await this.extractTextFromFile(sourceId);
    const chunks = this.chunkText(text);
    const totalChunks = chunks.length;
    this.logger.log(`Processing ${totalChunks} chunks in batches of ${this.batchSize}`);

    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const progress = Math.round((i / totalChunks) * 100);
      this.logger.log(`Progress: ${progress}% (${i}/${totalChunks} chunks)`);

      try {
        const embeddings = await this.embeddings.embedDocuments(batch);

        await Promise.all(
          batch.map((chunk, index) =>
            this.documentEmbeddingRepository.save({
              content: chunk,
              source,
              sourceId,
              embedding: embeddings[index],
            })
          )
        );

        if (i + this.batchSize < chunks.length) {
          await this.delay(this.delayBetweenBatches);
        }
      } catch (error) {
        this.logger.error(`Error processing batch ${i}-${i + this.batchSize}: ${error.message}`);
        throw error;
      }
    }

    this.logger.log('Processing completed successfully');
  }
} 