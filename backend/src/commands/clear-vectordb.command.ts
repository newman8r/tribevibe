import { Command, CommandRunner } from 'nest-commander';
import { VectorSearchService } from '../services/vector-search.service';

@Command({
  name: 'clear-vectordb',
  description: 'Clear the vector database and start fresh',
})
export class ClearVectorDBCommand extends CommandRunner {
  constructor(private readonly vectorService: VectorSearchService) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.vectorService.clearAll();
      console.log('Vector database cleared successfully');
    } catch (error) {
      console.error('Error clearing vector database:', error);
      process.exit(1);
    }
  }
} 