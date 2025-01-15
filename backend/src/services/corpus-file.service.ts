import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CorpusFile } from '../entities/corpus-file.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';
import { DocumentProcessingService } from '../services/document-processing.service';

@Injectable()
export class CorpusFileService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(CorpusFileService.name);
  private readonly bucket: string;

  constructor(
    @InjectRepository(CorpusFile)
    private corpusFileRepository: Repository<CorpusFile>,
    @InjectRepository(VectorKnowledgeBase)
    private knowledgeBaseRepository: Repository<VectorKnowledgeBase>,
    private configService: ConfigService
  ) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.getOrThrow('AWS_S3_BUCKET');
  }

  async createPresignedUploadUrl(
    filename: string,
    mimeType: string,
    size: number,
    knowledgeBaseId: string
  ): Promise<{ uploadUrl: string; file: CorpusFile }> {
    // Find the knowledge base
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id: knowledgeBaseId }
    });

    if (!knowledgeBase) {
      throw new NotFoundException(`Knowledge base with ID ${knowledgeBaseId} not found`);
    }

    // Create S3 key
    const key = `corpus/${knowledgeBaseId}/${uuidv4()}/${filename}`;

    // Create corpus file record
    const file = this.corpusFileRepository.create({
      filename,
      s3Key: key,
      mimeType,
      size,
      knowledgeBase
    });

    await this.corpusFileRepository.save(file);

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
      signableHeaders: new Set(['host', 'x-amz-server-side-encryption']),
    });

    return { uploadUrl, file };
  }

  async removeFromKnowledgeBase(fileId: string): Promise<void> {
    const file = await this.corpusFileRepository.findOne({
      where: { id: fileId },
      relations: ['knowledgeBase']
    });

    if (!file) {
      throw new NotFoundException(`Corpus file with ID ${fileId} not found`);
    }

    // Delete from S3
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: file.s3Key,
      }),
    );

    // Delete from database
    await this.corpusFileRepository.remove(file);
  }

  async findByKnowledgeBase(knowledgeBaseId: string): Promise<CorpusFile[]> {
    return this.corpusFileRepository.find({
      where: { knowledgeBase: { id: knowledgeBaseId } },
      order: { createdAt: 'DESC' },
    });
  }

  async processUnprocessedFiles(knowledgeBaseId: string, documentProcessingService: DocumentProcessingService): Promise<void> {
    // Find all unprocessed files for this knowledge base
    const unprocessedFiles = await this.corpusFileRepository.find({
      where: {
        knowledgeBase: { id: knowledgeBaseId },
        processed: false
      }
    });

    if (!unprocessedFiles.length) {
      this.logger.log('No unprocessed files found');
      return;
    }

    this.logger.log(`Found ${unprocessedFiles.length} unprocessed files to process`);

    // Process each file sequentially
    for (const file of unprocessedFiles) {
      this.logger.log(`Processing file ${file.id} (${file.filename}) with S3 key: ${file.s3Key}`);
      
      try {
        // First verify the file exists in S3
        const headCommand = new HeadObjectCommand({
          Bucket: this.bucket,
          Key: file.s3Key,
        });

        try {
          await this.s3Client.send(headCommand);
          this.logger.log(`File ${file.id} exists in S3, proceeding with processing`);

          // Get the file content from S3
          const getCommand = new GetObjectCommand({
            Bucket: this.bucket,
            Key: file.s3Key,
          });

          const response = await this.s3Client.send(getCommand);
          const chunks: Uint8Array[] = [];
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
          const content = Buffer.concat(chunks).toString('utf-8');

          this.logger.log(`Successfully retrieved content for file ${file.id}, length: ${content.length} bytes`);

          // Process the content
          await documentProcessingService.processContent(
            content,
            'corpus_file',
            file.id,
            knowledgeBaseId
          );

          this.logger.log(`Successfully processed content for file ${file.id}`);

          // Mark the file as processed
          file.processed = true;
          await this.corpusFileRepository.save(file);
          this.logger.log(`Marked file ${file.id} as processed`);

        } catch (s3Error) {
          if (s3Error.name === 'NoSuchKey' || s3Error.name === 'NotFound') {
            this.logger.warn(`File ${file.id} (${file.filename}) not found in S3, removing from database`);
            await this.corpusFileRepository.remove(file);
          } else {
            this.logger.error(`S3 error for file ${file.id}:`, s3Error);
            throw s3Error;
          }
        }
      } catch (error) {
        this.logger.error(`Error processing file ${file.id}:`, error);
        // Don't throw the error, continue with next file
        continue;
      }
    }
  }
} 