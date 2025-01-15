import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VectorKnowledgeBase, ChunkingStrategy } from '../entities/vector-knowledge-base.entity';
import { AiAgentKnowledgeBase } from '../entities/ai-agent-knowledge-base.entity';
import { User } from '../entities/user.entity';

@Injectable()
@Command({ name: 'manage-kb' })
export class ManageKnowledgeBaseCommand extends CommandRunner {
  private readonly logger = new Logger(ManageKnowledgeBaseCommand.name);

  constructor(
    @InjectRepository(VectorKnowledgeBase)
    private knowledgeBaseRepository: Repository<VectorKnowledgeBase>,
    @InjectRepository(AiAgentKnowledgeBase)
    private aiAgentKnowledgeBaseRepository: Repository<AiAgentKnowledgeBase>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super();
  }

  async run(passedParams: string[], options: Record<string, any> = {}): Promise<void> {
    const action = options?.action || 'list';
    
    switch (action) {
      case 'create':
        await this.createKnowledgeBase(options);
        break;
      case 'list':
        await this.listKnowledgeBases();
        break;
      case 'delete':
        await this.deleteKnowledgeBase(options?.id);
        break;
      case 'assign':
        await this.assignToAgent(options?.agentId, options?.knowledgeBaseId);
        break;
      case 'unassign':
        await this.unassignFromAgent(options?.agentId, options?.knowledgeBaseId);
        break;
      case 'list-agent-kbs':
        await this.listAgentKnowledgeBases(options?.agentId);
        break;
      default:
        this.logger.error('Invalid action. Use --action with create, list, delete, assign, unassign, or list-agent-kbs');
    }
  }

  private async assignToAgent(agentId?: string, knowledgeBaseId?: string): Promise<void> {
    if (!agentId || !knowledgeBaseId) {
      this.logger.error('Both agentId and knowledgeBaseId are required for assignment');
      return;
    }

    try {
      const agent = await this.userRepository.findOne({ where: { id: agentId } });
      if (!agent) {
        this.logger.error(`Agent with ID ${agentId} not found`);
        return;
      }
      if (!agent.isAiAgent) {
        this.logger.error(`User ${agentId} is not an AI agent`);
        return;
      }

      const kb = await this.knowledgeBaseRepository.findOne({ where: { id: knowledgeBaseId } });
      if (!kb) {
        this.logger.error(`Knowledge base with ID ${knowledgeBaseId} not found`);
        return;
      }

      // Check if assignment already exists
      const existing = await this.aiAgentKnowledgeBaseRepository.findOne({
        where: {
          agent: { id: agentId },
          knowledgeBase: { id: knowledgeBaseId }
        }
      });

      if (existing) {
        this.logger.log('Assignment already exists');
        return;
      }

      await this.aiAgentKnowledgeBaseRepository.save({
        agent: { id: agentId },
        knowledgeBase: { id: knowledgeBaseId }
      });

      this.logger.log(`Successfully assigned knowledge base ${knowledgeBaseId} to agent ${agentId}`);
    } catch (error) {
      this.logger.error('Error assigning knowledge base to agent:', error);
    }
  }

  private async unassignFromAgent(agentId?: string, knowledgeBaseId?: string): Promise<void> {
    if (!agentId || !knowledgeBaseId) {
      this.logger.error('Both agentId and knowledgeBaseId are required for unassignment');
      return;
    }

    try {
      await this.aiAgentKnowledgeBaseRepository.delete({
        agent: { id: agentId },
        knowledgeBase: { id: knowledgeBaseId }
      });

      this.logger.log(`Successfully unassigned knowledge base ${knowledgeBaseId} from agent ${agentId}`);
    } catch (error) {
      this.logger.error('Error unassigning knowledge base from agent:', error);
    }
  }

  private async listAgentKnowledgeBases(agentId?: string): Promise<void> {
    if (!agentId) {
      this.logger.error('AgentId is required to list knowledge bases');
      return;
    }

    try {
      const assignments = await this.aiAgentKnowledgeBaseRepository.find({
        where: { agent: { id: agentId } },
        relations: ['knowledgeBase', 'agent']
      });

      if (assignments.length === 0) {
        this.logger.log(`No knowledge bases assigned to agent ${agentId}`);
        return;
      }

      this.logger.log(`Knowledge bases assigned to agent ${agentId}:`);
      assignments.forEach(assignment => {
        this.logger.log('\n-------------------');
        this.logger.log(`Knowledge Base ID: ${assignment.knowledgeBase.id}`);
        this.logger.log(`Name: ${assignment.knowledgeBase.name}`);
        this.logger.log(`Description: ${assignment.knowledgeBase.description || 'N/A'}`);
        this.logger.log(`Assigned At: ${assignment.assignedAt}`);
      });
    } catch (error) {
      this.logger.error('Error listing agent knowledge bases:', error);
    }
  }

  private async createKnowledgeBase(options: Record<string, any>): Promise<void> {
    if (!options?.name) {
      this.logger.error('Name is required for creating a knowledge base');
      return;
    }

    try {
      const kb = await this.knowledgeBaseRepository.save({
        name: options.name,
        description: options.description,
        chunkingStrategy: options.chunkingStrategy || ChunkingStrategy.FIXED_SIZE,
        chunkingSettings: {
          chunkSize: options.chunkSize || 1000,
          chunkOverlap: options.chunkOverlap || 200,
        },
      });

      this.logger.log('Knowledge base created successfully:');
      this.logger.log(`ID: ${kb.id}`);
      this.logger.log(`Name: ${kb.name}`);
      this.logger.log(`Description: ${kb.description || 'N/A'}`);
    } catch (error) {
      this.logger.error('Error creating knowledge base:', error);
    }
  }

  private async listKnowledgeBases(): Promise<void> {
    try {
      const kbs = await this.knowledgeBaseRepository.find();
      
      if (kbs.length === 0) {
        this.logger.log('No knowledge bases found');
        return;
      }

      this.logger.log('Knowledge Bases:');
      kbs.forEach(kb => {
        this.logger.log('\n-------------------');
        this.logger.log(`ID: ${kb.id}`);
        this.logger.log(`Name: ${kb.name}`);
        this.logger.log(`Description: ${kb.description || 'N/A'}`);
        this.logger.log(`Chunking Strategy: ${kb.chunkingStrategy}`);
        this.logger.log(`Created At: ${kb.createdAt}`);
      });
    } catch (error) {
      this.logger.error('Error listing knowledge bases:', error);
    }
  }

  private async deleteKnowledgeBase(id?: string): Promise<void> {
    if (!id) {
      this.logger.error('ID is required for deleting a knowledge base');
      return;
    }

    try {
      await this.knowledgeBaseRepository.delete(id);
      this.logger.log(`Knowledge base ${id} deleted successfully`);
    } catch (error) {
      this.logger.error('Error deleting knowledge base:', error);
    }
  }

  @Option({
    flags: '-a, --action [string]',
    description: 'Action to perform (create, list, delete, assign, unassign, list-agent-kbs)',
  })
  parseAction(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name [string]',
    description: 'Name of the knowledge base (required for create)',
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-d, --description [string]',
    description: 'Description of the knowledge base',
  })
  parseDescription(val: string): string {
    return val;
  }

  @Option({
    flags: '-i, --id [string]',
    description: 'ID of the knowledge base (required for delete)',
  })
  parseId(val: string): string {
    return val;
  }

  @Option({
    flags: '--agent-id [string]',
    description: 'ID of the AI agent (required for assign/unassign/list-agent-kbs)',
  })
  parseAgentId(val: string): string {
    return val;
  }

  @Option({
    flags: '--knowledge-base-id [string]',
    description: 'ID of the knowledge base (required for assign/unassign)',
  })
  parseKnowledgeBaseId(val: string): string {
    return val;
  }

  @Option({
    flags: '--chunking-strategy [string]',
    description: 'Chunking strategy (fixed_size, semantic, paragraph)',
  })
  parseChunkingStrategy(val: string): ChunkingStrategy {
    return val as ChunkingStrategy;
  }

  @Option({
    flags: '--chunk-size [number]',
    description: 'Size of chunks when using fixed_size strategy',
  })
  parseChunkSize(val: string): number {
    return parseInt(val, 10);
  }

  @Option({
    flags: '--chunk-overlap [number]',
    description: 'Overlap between chunks when using fixed_size strategy',
  })
  parseChunkOverlap(val: string): number {
    return parseInt(val, 10);
  }
} 