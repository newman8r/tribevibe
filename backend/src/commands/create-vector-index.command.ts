import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
@Command({ name: 'create-vector-index' })
export class CreateVectorIndexCommand extends CommandRunner {
  private readonly logger = new Logger(CreateVectorIndexCommand.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      // Install vector extension
      this.logger.log('Installing vector extension...');
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

      // Drop existing index if it exists
      this.logger.log('Dropping existing index...');
      await this.dataSource.query(`DROP INDEX IF EXISTS document_embedding_vector_index;`);

      // Create a new column for the vector type
      this.logger.log('Adding vector column...');
      await this.dataSource.query(`
        ALTER TABLE document_embedding 
        ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);
      `);

      // Convert existing embeddings to vectors
      this.logger.log('Converting embeddings to vectors...');
      await this.dataSource.query(`
        UPDATE document_embedding 
        SET embedding_vector = embedding::vector(1536)
        WHERE embedding IS NOT NULL;
      `);

      // Create the vector index
      this.logger.log('Creating vector index...');
      await this.dataSource.query(`
        CREATE INDEX document_embedding_vector_index 
        ON document_embedding 
        USING ivfflat (embedding_vector vector_cosine_ops)
        WITH (lists = 100);
      `);

      this.logger.log('Vector index created successfully');

    } catch (error) {
      this.logger.error('Error creating vector index:', error);
      this.logger.error('Error details:', error.message);
      throw error;
    }
  }
} 