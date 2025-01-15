import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import * as os from 'os';
import { AiAgentPersonality, MeyersBriggsType } from '../entities/ai-agent-personality.entity';
import { Channel } from '../entities/channel.entity';

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
  personality?: {
    generalPersonality: string;
    meyersBriggs: MeyersBriggsType;
    writingStyle: string;
    displayName: string;
    contactEmail: string;
  };
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AiAgentStrategy)
    private aiAgentStrategyRepository: Repository<AiAgentStrategy>,
    @InjectRepository(AiAgentPersonality)
    private aiAgentPersonalityRepository: Repository<AiAgentPersonality>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
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

      const personality = await this.aiAgentPersonalityRepository.findOne({
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
        personality: personality ? {
          generalPersonality: personality.generalPersonality,
          meyersBriggs: personality.meyersBriggs,
          writingStyle: personality.writingStyle,
          displayName: personality.displayName,
          contactEmail: personality.contactEmail,
        } : undefined,
      });
    }

    return agentDetails;
  }

  async getSystemInfo() {
    const userCount = await this.userRepository.count();

    return {
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime()
      },
      application: {
        userCount,
        databaseSize: 'Calculating...', // You can implement actual DB size calculation if needed
        nodeVersion: process.version,
        processUptime: process.uptime()
      }
    };
  }

  async getAllChannels() {
    const channels = await this.channelRepository.find({
      relations: ['users'],
      order: {
        name: 'ASC'
      }
    });

    return channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      visible: channel.visible,
      userCount: channel.users.length
    }));
  }
} 