import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AutonomousAgentService } from './autonomous-agent.service';

@Controller('autonomous-agents')
export class AutonomousAgentController {
  constructor(private autonomousAgentService: AutonomousAgentService) {}

  @Post('assign')
  async assignAgentToChannel(
    @Body() data: { agentId: string; channelId: string }
  ) {
    return this.autonomousAgentService.assignAgentToChannel(
      data.agentId,
      data.channelId
    );
  }

  @Get(':agentId/channels')
  async getAgentChannels(@Param('agentId') agentId: string) {
    return this.autonomousAgentService.getAgentChannels(agentId);
  }
} 