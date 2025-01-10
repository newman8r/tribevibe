import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  NotFoundException
} from '@nestjs/common';
import { FileService } from './file.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AuthGuard } from '../auth/auth.guard';
import { File } from '../entities/file.entity';

interface RequestWithUser extends Request {
  user: any;
}

@Controller('files')
@UseGuards(AuthGuard)
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly websocketGateway: ChatGateway,
  ) {}

  @Post('request-upload')
  async requestUpload(
    @Request() req: RequestWithUser,
    @Body() body: { 
      filename: string;
      mimeType: string;
      size: number;
      channelId?: string;
      metadata?: {
        description?: string;
        tags?: string[];
      };
    }
  ) {
    // Debug log to see what user data we have
    console.log('Request user:', req.user);

    const { uploadUrl, file } = await this.fileService.createPresignedUploadUrl(
      body.filename,
      body.mimeType,
      body.size,
      req.user, // Make sure we're passing the full user object
      body.channelId ? { id: body.channelId } as any : undefined
    );

    // If this file belongs to a channel, notify channel members
    if (body.channelId) {
      this.websocketGateway.server.to(`channel:${body.channelId}`).emit('fileUploaded', {
        file: {
          id: file.id,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          uploader: {
            id: req.user.id,
            username: req.user.username,
            avatarUrl: req.user.avatarUrl
          },
          createdAt: file.createdAt
        }
      });
    }

    return { uploadUrl, fileId: file.id };
  }

  @Post(':fileId/thumbnail')
  async generateThumbnail(@Param('fileId') fileId: string) {
    const file = await this.fileService.findOne(fileId);
    await this.fileService.generateThumbnail(file);
    return { success: true };
  }

  @Get()
  async findAll(@Query('channelId') channelId?: string): Promise<File[]> {
    if (channelId) {
      return this.fileService.findByChannel(channelId);
    }
    return this.fileService.findAll();
  }

  @Get(':fileId/url')
  async getFileUrl(@Param('fileId') fileId: string) {
    const file = await this.fileService.findOne(fileId);
    const url = await this.fileService.getPresignedUrl(file);
    const thumbnailUrl = await this.fileService.getThumbnailUrl(file);
    
    return { 
      url, 
      thumbnailUrl,
      metadata: {
        type: file.type,
        size: file.size,
        mimeType: file.mimeType,
        displayName: file.displayName,
        description: file.description
      }
    };
  }

  @Patch(':fileId')
  async updateMetadata(
    @Param('fileId') fileId: string,
    @Body() updates: {
      displayName?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ) {
    const updatedFile = await this.fileService.updateMetadata(fileId, updates);

    // If file is in a channel, notify members of the update
    if (updatedFile.channel) {
      this.websocketGateway.server.to(`channel:${updatedFile.channel.id}`).emit('fileUpdated', {
        fileId: updatedFile.id,
        updates: {
          displayName: updatedFile.displayName,
          description: updatedFile.description,
          metadata: updatedFile.metadata
        }
      });
    }

    return updatedFile;
  }

  @Delete(':fileId')
  async delete(@Param('fileId') fileId: string) {
    const file = await this.fileService.findOne(fileId);
    const channelId = file.channel?.id;
    
    await this.fileService.delete(fileId);

    // If file was in a channel, notify members of deletion
    if (channelId) {
      this.websocketGateway.server.to(`channel:${channelId}`).emit('fileDeleted', {
        fileId
      });
    }

    return { success: true };
  }
} 