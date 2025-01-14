import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { StrategyRegistryService } from './services/strategy-registry.service';

@Injectable()
export class AutonomousAgentService {
  constructor(
    @InjectRepository(AiAgentChannel)
    private aiAgentChannelRepository: Repository<AiAgentChannel>,
    @InjectRepository(AiAgentStrategy)
    private aiAgentStrategyRepository: Repository<AiAgentStrategy>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private strategyRegistry: StrategyRegistryService
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

  async processChannelMessage(message: Message): Promise<string | null> {
    console.log('Processing channel message:', message.channel.id);
    
    const agentAssignments = await this.aiAgentChannelRepository.find({
      where: { 
        channel: { id: message.channel.id },
        isActive: true
      },
      relations: ['agent']
    });
    
    console.log('Found agent assignments:', agentAssignments);

    for (const assignment of agentAssignments) {
      const strategyConfig = await this.aiAgentStrategyRepository.findOne({
        where: { agent: { id: assignment.agent.id } }
      });
      
      console.log('Found strategy config:', strategyConfig);

      if (strategyConfig) {
        const strategy = this.strategyRegistry.getStrategy(strategyConfig.strategyName);
        console.log('Got strategy:', strategy?.constructor.name);
        
        if (strategy) {
          return strategy.processMessage(message);
        }
      }
    }

    return null;
  }

  async getChannelAgent(channelId: string): Promise<User | null> {
    // Find the first active AI agent assigned to this channel
    const assignment = await this.aiAgentChannelRepository.findOne({
      where: { 
        channel: { id: channelId },
        isActive: true
      },
      relations: ['agent']
    });

    return assignment?.agent || null;
  }
} 