import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
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
} 