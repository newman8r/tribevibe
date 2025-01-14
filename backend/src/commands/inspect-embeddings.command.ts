import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEmbedding } from '../entities/document-embedding.entity';

@Injectable()
@Command({ name: 'inspect-embeddings' })
export class InspectEmbeddingsCommand extends CommandRunner {
  constructor(
    @InjectRepository(DocumentEmbedding)
    private documentEmbeddingRepository: Repository<DocumentEmbedding>,
  ) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [sourceId] = passedParams;

    try {
      let query = this.documentEmbeddingRepository.createQueryBuilder('embedding');

      if (sourceId) {
        query = query.where('embedding.sourceId = :sourceId', { sourceId });
      }

      const count = await query.getCount();
      const sample = await query.take(3).getMany();

      console.log(`Total embeddings: ${count}`);
      console.log('\nSample entries:');
      sample.forEach((entry, index) => {
        console.log(`\n--- Entry ${index + 1} ---`);
        console.log('Content:', entry.content.substring(0, 150) + '...');
        console.log('Source:', entry.source);
        console.log('SourceId:', entry.sourceId);
        console.log('Embedding Vector Length:', entry.embedding?.length ?? 'No embedding');
        console.log('Created At:', entry.createdAt);
      });
    } catch (error) {
      console.error('Error inspecting embeddings:', error);
    }
  }
} 