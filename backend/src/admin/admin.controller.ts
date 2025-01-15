import { Controller, Get, UseGuards, Patch, Param, Body, Post, Delete } from '@nestjs/common';
import { AdminService, AiAgentDetails } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MeyersBriggsType } from '../entities/ai-agent-personality.entity';

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

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
} 