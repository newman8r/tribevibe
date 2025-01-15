import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CorpusFile } from '../entities/corpus-file.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';

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
} 