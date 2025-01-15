import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService, AiAgentDetails } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ai-agents')
  async getAiAgents(): Promise<AiAgentDetails[]> {
    return this.adminService.getAiAgents();
  }

  @Get('info')
  async getSystemInfo() {
    return this.adminService.getSystemInfo();
  }
} 