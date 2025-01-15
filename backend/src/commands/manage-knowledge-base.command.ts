import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VectorKnowledgeBase, ChunkingStrategy } from '../entities/vector-knowledge-base.entity';

@Injectable()
@Command({ name: 'manage-kb' })
export class ManageKnowledgeBaseCommand extends CommandRunner {
  private readonly logger = new Logger(ManageKnowledgeBaseCommand.name);

  constructor(
    @InjectRepository(VectorKnowledgeBase)
    private knowledgeBaseRepository: Repository<VectorKnowledgeBase>,
  ) {
    super();
  }

  async run(passedParams: string[], options: Record<string, any> = {}): Promise<void> {
    const action = options?.action || 'list';
    
    switch (action) {
      case 'create':
        await this.createKnowledgeBase(options);
        break;
      case 'list':
        await this.listKnowledgeBases();
        break;
      case 'delete':
        await this.deleteKnowledgeBase(options?.id);
        break;
      default:
        this.logger.error('Invalid action. Use --action with create, list, or delete');
    }
  }

  private async createKnowledgeBase(options: Record<string, any>): Promise<void> {
    if (!options?.name) {
      this.logger.error('Name is required for creating a knowledge base');
      return;
    }

    try {
      const kb = await this.knowledgeBaseRepository.save({
        name: options.name,
        description: options.description,
        chunkingStrategy: options.chunkingStrategy || ChunkingStrategy.FIXED_SIZE,
        chunkingSettings: {
          chunkSize: options.chunkSize || 1000,
          chunkOverlap: options.chunkOverlap || 200,
        },
      });

      this.logger.log('Knowledge base created successfully:');
      this.logger.log(`ID: ${kb.id}`);
      this.logger.log(`Name: ${kb.name}`);
      this.logger.log(`Description: ${kb.description || 'N/A'}`);
    } catch (error) {
      this.logger.error('Error creating knowledge base:', error);
    }
  }

  private async listKnowledgeBases(): Promise<void> {
    try {
      const kbs = await this.knowledgeBaseRepository.find();
      
      if (kbs.length === 0) {
        this.logger.log('No knowledge bases found');
        return;
      }

      this.logger.log('Knowledge Bases:');
      kbs.forEach(kb => {
        this.logger.log('\n-------------------');
        this.logger.log(`ID: ${kb.id}`);
        this.logger.log(`Name: ${kb.name}`);
        this.logger.log(`Description: ${kb.description || 'N/A'}`);
        this.logger.log(`Chunking Strategy: ${kb.chunkingStrategy}`);
        this.logger.log(`Created At: ${kb.createdAt}`);
      });
    } catch (error) {
      this.logger.error('Error listing knowledge bases:', error);
    }
  }

  private async deleteKnowledgeBase(id?: string): Promise<void> {
    if (!id) {
      this.logger.error('ID is required for deleting a knowledge base');
      return;
    }

    try {
      await this.knowledgeBaseRepository.delete(id);
      this.logger.log(`Knowledge base ${id} deleted successfully`);
    } catch (error) {
      this.logger.error('Error deleting knowledge base:', error);
    }
  }

  @Option({
    flags: '-a, --action [string]',
    description: 'Action to perform (create, list, delete)',
  })
  parseAction(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name [string]',
    description: 'Name of the knowledge base (required for create)',
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-d, --description [string]',
    description: 'Description of the knowledge base',
  })
  parseDescription(val: string): string {
    return val;
  }

  @Option({
    flags: '-i, --id [string]',
    description: 'ID of the knowledge base (required for delete)',
  })
  parseId(val: string): string {
    return val;
  }

  @Option({
    flags: '--chunking-strategy [string]',
    description: 'Chunking strategy (fixed_size, semantic, paragraph)',
  })
  parseChunkingStrategy(val: string): ChunkingStrategy {
    return val as ChunkingStrategy;
  }

  @Option({
    flags: '--chunk-size [number]',
    description: 'Size of chunks when using fixed_size strategy',
  })
  parseChunkSize(val: string): number {
    return parseInt(val, 10);
  }

  @Option({
    flags: '--chunk-overlap [number]',
    description: 'Overlap between chunks when using fixed_size strategy',
  })
  parseChunkOverlap(val: string): number {
    return parseInt(val, 10);
  }
} 