import { Controller, Get, UseGuards, Patch, Param, Body, Post, Delete } from '@nestjs/common';
import { AdminService, AiAgentDetails } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MeyersBriggsType } from '../entities/ai-agent-personality.entity';
import { CorpusFileService } from '../services/corpus-file.service';
import { DocumentProcessingService } from '../services/document-processing.service';

export class UpdateAiAgentPersonalityDto {
  generalPersonality: string;
  meyersBriggs: MeyersBriggsType;
  writingStyle: string;
  displayName: string;
  contactEmail: string;
}

export class AddAgentChannelDto {
  channelId: string;
}

export class UploadCorpusFileDto {
  filename: string;
  mimeType: string;
  size: number;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly corpusFileService: CorpusFileService,
    private readonly documentProcessingService: DocumentProcessingService
  ) {}

  @Get('ai-agents')
  async getAiAgents(): Promise<AiAgentDetails[]> {
    return this.adminService.getAiAgents();
  }

  @Get('channels')
  async getAllChannels() {
    return this.adminService.getAllChannels();
  }

  @Get('info')
  async getSystemInfo() {
    return this.adminService.getSystemInfo();
  }

  @Patch('ai-agents/:id/personality')
  async updateAiAgentPersonality(
    @Param('id') id: string,
    @Body() updateDto: UpdateAiAgentPersonalityDto
  ) {
    return this.adminService.updateAiAgentPersonality(id, updateDto);
  }

  @Post('ai-agents/:id/channels')
  async addAgentChannel(
    @Param('id') agentId: string,
    @Body() dto: AddAgentChannelDto
  ) {
    return this.adminService.addAgentChannel(agentId, dto.channelId);
  }

  @Delete('ai-agents/:agentId/channels/:channelId')
  async removeAgentChannel(
    @Param('agentId') agentId: string,
    @Param('channelId') channelId: string
  ) {
    return this.adminService.removeAgentChannel(agentId, channelId);
  }

  @Get('vector-knowledge-bases')
  async getAllVectorKnowledgeBases() {
    return this.adminService.getAllVectorKnowledgeBases();
  }

  @Post('vector-knowledge-bases/:id/files')
  async getCorpusFileUploadUrl(
    @Param('id') knowledgeBaseId: string,
    @Body() uploadDto: UploadCorpusFileDto
  ) {
    return this.corpusFileService.createPresignedUploadUrl(
      uploadDto.filename,
      uploadDto.mimeType,
      uploadDto.size,
      knowledgeBaseId
    );
  }

  @Delete('vector-knowledge-bases/:kbId/files/:fileId')
  async removeCorpusFile(
    @Param('kbId') knowledgeBaseId: string,
    @Param('fileId') fileId: string
  ) {
    await this.corpusFileService.removeFromKnowledgeBase(fileId);
  }

  @Get('vector-knowledge-bases/:id/files')
  async getCorpusFiles(@Param('id') knowledgeBaseId: string) {
    return this.corpusFileService.findByKnowledgeBase(knowledgeBaseId);
  }

  @Post('vector-knowledge-bases/:id/process-files')
  async processUnprocessedFiles(
    @Param('id') knowledgeBaseId: string
  ) {
    await this.corpusFileService.processUnprocessedFiles(
      knowledgeBaseId,
      this.documentProcessingService
    );
  }
} 