import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';

export interface AiAgentDetails {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  channels: {
    id: string;
    name: string;
  }[];
  strategy?: {
    name: string;
    settings: Record<string, any>;
  };
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AiAgentStrategy)
    private aiAgentStrategyRepository: Repository<AiAgentStrategy>,
  ) {}

  async getAiAgents(): Promise<AiAgentDetails[]> {
    const aiAgents = await this.userRepository.find({
      where: { isAiAgent: true },
      relations: ['channels'],
    });

    const agentDetails: AiAgentDetails[] = [];

    for (const agent of aiAgents) {
      const strategy = await this.aiAgentStrategyRepository.findOne({
        where: { agent: { id: agent.id } },
      });

      agentDetails.push({
        id: agent.id,
        username: agent.username,
        email: agent.email,
        avatarUrl: agent.avatarUrl,
        channels: agent.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
        })),
        strategy: strategy ? {
          name: strategy.strategyName,
          settings: strategy.settings,
        } : undefined,
      });
    }

    return agentDetails;
  }
} 