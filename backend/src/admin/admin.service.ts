import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AiAgentStrategy } from '../entities/ai-agent-strategy.entity';
import * as os from 'os';
import { AiAgentPersonality, MeyersBriggsType } from '../entities/ai-agent-personality.entity';
import { Channel } from '../entities/channel.entity';
import { UpdateAiAgentPersonalityDto } from './admin.controller';
import { AiAgentChannel } from '../entities/ai-agent-channel.entity';
import { VectorKnowledgeBase } from '../entities/vector-knowledge-base.entity';

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
    @InjectRepository(AiAgentChannel)
    private aiAgentChannelRepository: Repository<AiAgentChannel>,
    @InjectRepository(VectorKnowledgeBase)
    private vectorKnowledgeBaseRepository: Repository<VectorKnowledgeBase>,
  ) {}

  async getAiAgents(): Promise<AiAgentDetails[]> {
    const aiAgents = await this.userRepository.find({
      where: { isAiAgent: true },
      relations: ['channels', 'aiAgentChannels', 'aiAgentChannels.channel'],
    });

    const agentDetails: AiAgentDetails[] = [];

    for (const agent of aiAgents) {
      const strategy = await this.aiAgentStrategyRepository.findOne({
        where: { agent: { id: agent.id } },
      });

      const personality = await this.aiAgentPersonalityRepository.findOne({
        where: { agent: { id: agent.id } },
      });

      // Filter to only include active channel associations
      const activeChannels = agent.aiAgentChannels
        .filter((ac: { isActive: boolean; channel: Channel }) => ac.isActive)
        .map((ac: { channel: Channel }) => ac.channel);

      agentDetails.push({
        id: agent.id,
        username: agent.username,
        email: agent.email,
        avatarUrl: agent.avatarUrl || '',
        channels: activeChannels.map((channel: Channel) => ({
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
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .select([
        'channel.id',
        'channel.name',
        'channel.visible',
        '(SELECT COUNT(*) FROM user_channels_channel WHERE "channelId" = channel.id) as userCount'
      ])
      .orderBy('channel.name', 'ASC')
      .getRawMany();

    return channels.map(channel => ({
      id: channel.channel_id,
      name: channel.channel_name,
      visible: channel.channel_visible,
      userCount: parseInt(channel.userCount) || 0
    }));
  }

  async updateAiAgentPersonality(
    agentId: string,
    updateDto: UpdateAiAgentPersonalityDto
  ) {
    // First check if the agent exists and is an AI agent
    const agent = await this.userRepository.findOne({
      where: { id: agentId, isAiAgent: true }
    });

    if (!agent) {
      throw new NotFoundException('AI agent not found');
    }

    // Find existing personality or create new one
    let personality = await this.aiAgentPersonalityRepository.findOne({
      where: { agent: { id: agentId } }
    });

    if (!personality) {
      personality = this.aiAgentPersonalityRepository.create({
        agent: agent
      });
    }

    // Update the personality fields
    Object.assign(personality, updateDto);

    // Save the updated personality
    await this.aiAgentPersonalityRepository.save(personality);

    return personality;
  }

  async addAgentChannel(agentId: string, channelId: string) {
    // Check if agent exists and is an AI agent
    const agent = await this.userRepository.findOne({
      where: { id: agentId, isAiAgent: true }
    });

    if (!agent) {
      throw new NotFoundException('AI agent not found');
    }

    // Check if channel exists
    const channel = await this.channelRepository.findOne({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if association already exists
    const existingAssociation = await this.aiAgentChannelRepository.findOne({
      where: {
        agent: { id: agentId },
        channel: { id: channelId }
      }
    });

    if (existingAssociation) {
      // If it exists but was inactive, reactivate it
      if (!existingAssociation.isActive) {
        existingAssociation.isActive = true;
        return this.aiAgentChannelRepository.save(existingAssociation);
      }
      return existingAssociation;
    }

    // Create new association
    const newAssociation = this.aiAgentChannelRepository.create({
      agent,
      channel,
      isActive: true
    });

    return this.aiAgentChannelRepository.save(newAssociation);
  }

  async removeAgentChannel(agentId: string, channelId: string) {
    // Find the association
    const association = await this.aiAgentChannelRepository.findOne({
      where: {
        agent: { id: agentId },
        channel: { id: channelId },
        isActive: true
      }
    });

    if (!association) {
      throw new NotFoundException('Agent channel association not found');
    }

    // Soft delete by marking as inactive
    association.isActive = false;
    return this.aiAgentChannelRepository.save(association);
  }

  async getAllVectorKnowledgeBases() {
    return this.vectorKnowledgeBaseRepository.find({
      relations: ['embeddings', 'corpusFiles'],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async updateVectorKnowledgeBase(id: string, updates: Partial<VectorKnowledgeBase>) {
    const kb = await this.vectorKnowledgeBaseRepository.findOne({ where: { id } });
    if (!kb) {
      throw new NotFoundException('Vector knowledge base not found');
    }
    
    Object.assign(kb, updates);
    return this.vectorKnowledgeBaseRepository.save(kb);
  }
} 