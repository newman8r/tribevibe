import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { DocumentProcessingService } from '../services/document-processing.service';
import * as fs from 'fs/promises';

@Injectable()
@Command({ name: 'process-document' })
export class ProcessDocumentCommand extends CommandRunner {
  constructor(private documentProcessingService: DocumentProcessingService) {
    super();
  }

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    const [filePath] = passedParams;
    const knowledgeBaseId = options?.knowledgeBaseId;

    if (!filePath) {
      console.error('Please provide a file path');
      return;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await this.documentProcessingService.processContent(
        content,
        'file',
        filePath,
        knowledgeBaseId
      );
      console.log('Document processed successfully');
    } catch (error) {
      console.error('Error processing document:', error);
    }
  }

  @Option({
    flags: '-k, --knowledge-base-id [string]',
    description: 'ID of the knowledge base to associate the document with',
  })
  parseKnowledgeBaseId(val: string): string {
    return val;
  }
} 