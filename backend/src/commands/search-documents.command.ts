import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { VectorSearchService } from '../services/vector-search.service';

@Injectable()
@Command({ name: 'search-documents' })
export class SearchDocumentsCommand extends CommandRunner {
  private readonly logger = new Logger(SearchDocumentsCommand.name);

  constructor(private vectorSearchService: VectorSearchService) {
    super();
  }

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    const query = options?.query || passedParams[0];
    const limit = options?.limit || 5;
    const knowledgeBaseId = options?.knowledgeBaseId;

    this.logger.log(`Searching for: ${query}`);
    this.logger.log(`Limit: ${limit}`);
    if (knowledgeBaseId) {
      this.logger.log(`Knowledge Base ID: ${knowledgeBaseId}`);
    }
    this.logger.log('-------------------');

    try {
      const results = await this.vectorSearchService.searchSimilarDocuments(query, knowledgeBaseId, limit);
      
      if (results.length === 0) {
        this.logger.log('No results found');
        return;
      }

      results.forEach((result, index) => {
        this.logger.log(`\nResult ${index + 1} (similarity: ${result.similarity.toFixed(4)})`);
        this.logger.log(`Source: ${result.source}`);
        this.logger.log(`Content: ${result.content.substring(0, 150)}...`);
      });
    } catch (error) {
      this.logger.error('Error searching documents:', error);
    }
  }

  @Option({
    flags: '-q, --query [string]',
    description: 'Search query',
  })
  parseQuery(val: string): string {
    return val;
  }

  @Option({
    flags: '-l, --limit [number]',
    description: 'Number of results to return',
  })
  parseLimit(val: string): number {
    return parseInt(val, 10);
  }

  @Option({
    flags: '-k, --knowledge-base-id [string]',
    description: 'ID of the knowledge base to search in',
  })
  parseKnowledgeBaseId(val: string): string {
    return val;
  }
} 