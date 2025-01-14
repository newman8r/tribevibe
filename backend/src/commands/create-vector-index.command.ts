import { Command, CommandRunner } from 'nest-commander';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
@Command({ name: 'create-vector-index' })
export class CreateVectorIndexCommand extends CommandRunner {
  constructor(private dataSource: DataSource) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_embedding_vector 
        ON document_embedding 
        USING ivfflat (embedding vector_l2_ops) 
        WITH (lists = 100);
      `);
      console.log('Vector index created successfully');
    } catch (error) {
      console.error('Error creating vector index:', error);
    }
  }
} 