import { Controller, Get, Query, Logger } from '@nestjs/common';
import { SearchService, MessageSearchResult } from './search.service';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Get('messages')
  async searchMessages(@Query('q') query: string): Promise<MessageSearchResult[]> {
    this.logger.debug(`Received search request with query: ${query}`);
    try {
      const results = await this.searchService.searchMessages(query);
      this.logger.debug(`Returning ${results.length} search results`);
      return results;
    } catch (error) {
      this.logger.error('Error processing search request:', error);
      throw error;
    }
  }
} 