import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
@Command({ name: 'drop-table' })
export class DropTableCommand extends CommandRunner {
  private readonly logger = new Logger(DropTableCommand.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      // First drop any existing indexes
      this.logger.log('Dropping indexes...');
      await this.dataSource.query(`
        DROP INDEX IF EXISTS document_embedding_vector_index;
      `);

      // Drop the table
      this.logger.log('Dropping document_embedding table...');
      await this.dataSource.query(`
        DROP TABLE IF EXISTS document_embedding;
      `);

      // Recreate the table with the correct structure
      this.logger.log('Creating new table...');
      await this.dataSource.query(`
        CREATE TABLE document_embedding (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          content text NOT NULL,
          source text NOT NULL,
          "sourceId" text NOT NULL,
          embedding vector(1536),
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
      `);

      // Create the vector extension if it doesn't exist
      this.logger.log('Creating vector extension...');
      await this.dataSource.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
      `);

      this.logger.log('Table recreated successfully');

      // Verify the table structure
      const tableInfo = await this.dataSource.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'document_embedding'
        ORDER BY ordinal_position;
      `);
      this.logger.log('Table structure:', tableInfo);

    } catch (error) {
      this.logger.error('Error recreating table:', error);
      this.logger.error('Error details:', error.message);
      throw error;
    }
  }
} 