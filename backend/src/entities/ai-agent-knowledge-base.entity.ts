import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { VectorKnowledgeBase } from './vector-knowledge-base.entity';

@Entity()
export class AiAgentKnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  agent: User;

  @ManyToOne(() => VectorKnowledgeBase)
  knowledgeBase: VectorKnowledgeBase;

  @CreateDateColumn()
  assignedAt: Date;
} 