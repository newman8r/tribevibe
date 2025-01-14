import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VectorSearchService } from '../services/vector-search.service';

async function cleanupVectorDB() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vectorService = app.get(VectorSearchService);
  
  try {
    await vectorService.clearAll();
    console.log('Vector database cleared successfully');
  } catch (error) {
    console.error('Error clearing vector database:', error);
  } finally {
    await app.close();
  }
}

cleanupVectorDB().catch(console.error); 