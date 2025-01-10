import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { File, FileType } from '../entities/file.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(FileService.name);
  private readonly bucket: string;

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private configService: ConfigService,
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

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.includes('document') || mimeType.includes('pdf')) return FileType.DOCUMENT;
    if (mimeType.includes('text/')) return FileType.CODE;
    return FileType.OTHER;
  }

  async createPresignedUploadUrl(
    originalName: string,
    mimeType: string,
    size: number,
    uploader: User,
    channel?: Channel,
  ): Promise<{ uploadUrl: string; file: File }> {
    const fileType = this.determineFileType(mimeType);
    const key = `${fileType}/${uuidv4()}/${originalName}`;

    const file = this.fileRepository.create({
      originalName,
      key,
      size,
      mimeType,
      type: fileType,
      uploader,
      channel,
    });

    await this.fileRepository.save(file);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return { uploadUrl, file };
  }

  async generateThumbnail(file: File): Promise<void> {
    if (file.type !== FileType.IMAGE && file.type !== FileType.VIDEO) {
      return;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: file.key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `thumbnails/${file.id}.jpg`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          ServerSideEncryption: 'AES256',
        }),
      );

      file.thumbnailKey = thumbnailKey;
      await this.fileRepository.save(file);
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail for file ${file.id}:`, error);
    }
  }

  async getPresignedUrl(file: File): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getThumbnailUrl(file: File): Promise<string | null> {
    if (!file.thumbnailKey) return null;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.thumbnailKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async findAll(): Promise<File[]> {
    return this.fileRepository.find({
      relations: ['uploader', 'channel'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByChannel(channelId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { channel: { id: channelId } },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateMetadata(
    fileId: string,
    updates: { displayName?: string; description?: string; metadata?: Record<string, any> },
  ): Promise<File> {
    await this.fileRepository.update(fileId, updates);
    const file = await this.fileRepository.findOne({ 
      where: { id: fileId },
      relations: ['uploader', 'channel']
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
    
    return file;
  }

  async delete(fileId: string): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) return;

    // Delete from S3
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: file.key,
      }),
    );

    // Delete thumbnail if exists
    if (file.thumbnailKey) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: file.thumbnailKey,
        }),
      );
    }

    // Delete from database
    await this.fileRepository.remove(file);
  }

  async findOne(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['uploader', 'channel']
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    
    return file;
  }
} 