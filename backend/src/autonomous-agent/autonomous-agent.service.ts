import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class AutonomousAgentService {
  constructor(
    @InjectRepository(AiAgentChannel)
    private aiAgentChannelRepository: Repository<AiAgentChannel>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async assignAgentToChannel(agentId: string, channelId: string): Promise<AiAgentChannel> {
    const assignment = this.aiAgentChannelRepository.create({
      agent: { id: agentId },
      channel: { id: channelId }
    });
    return this.aiAgentChannelRepository.save(assignment);
  }

  async getAgentChannels(agentId: string): Promise<AiAgentChannel[]> {
    return this.aiAgentChannelRepository.find({
      where: { agent: { id: agentId }, isActive: true },
      relations: ['channel']
    });
  }

  async isUserAiAgent(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
    return user?.isAiAgent || false;
  }
} 