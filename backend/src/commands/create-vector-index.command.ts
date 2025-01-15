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

      // Alter the column type to vector with dimensions
      this.logger.log('Altering column type to vector...');
      await this.dataSource.query(`
        ALTER TABLE document_embedding 
        ALTER COLUMN embedding TYPE vector(1536) 
        USING embedding::vector(1536);
      `);

      // Create the vector index
      this.logger.log('Creating vector index...');
      await this.dataSource.query(`
        CREATE INDEX document_embedding_vector_index 
        ON document_embedding 
        USING ivfflat (embedding vector_cosine_ops)
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