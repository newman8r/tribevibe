import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
@Command({ name: 'inspect-table' })
export class InspectTableCommand extends CommandRunner {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      // Check if vector extension exists
      const extensionResult = await this.dataSource.query(`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `);
      console.log('Vector extension installed:', extensionResult.length > 0);

      // Check column type
      const columnInfo = await this.dataSource.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'document_embedding'
        AND column_name = 'embedding';
      `);
      console.log('\nColumn info:', columnInfo);

      // Check sample data
      const sampleData = await this.dataSource.query(`
        SELECT id, 
               substring(content, 1, 50) as content_preview,
               pg_typeof(embedding) as embedding_type,
               array_length(embedding, 1) as embedding_length
        FROM document_embedding
        LIMIT 3;
      `);
      console.log('\nSample data:', sampleData);

    } catch (error) {
      console.error('Error inspecting table:', error);
      console.error('Error details:', error.message);
    }
  }
} 