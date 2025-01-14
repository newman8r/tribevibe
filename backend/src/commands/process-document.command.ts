import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { DocumentProcessingService } from '../services/document-processing.service';
import * as fs from 'fs/promises';

@Injectable()
@Command({ name: 'process-document' })
export class ProcessDocumentCommand extends CommandRunner {
  constructor(private documentProcessingService: DocumentProcessingService) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [filePath] = passedParams;
    if (!filePath) {
      console.error('Please provide a file path');
      return;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await this.documentProcessingService.processContent(
        content,
        'file',
        filePath
      );
      console.log('Document processed successfully');
    } catch (error) {
      console.error('Error processing document:', error);
    }
  }
} 