import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { DocumentEmbedding } from './document-embedding.entity';
import { CorpusFile } from './corpus-file.entity';
import { User } from './user.entity';

export enum ChunkingStrategy {
  FIXED_SIZE = 'fixed_size',
  SEMANTIC = 'semantic',
  PARAGRAPH = 'paragraph'
}

@Entity()
export class VectorKnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  usage: string;

  @Column({
    type: 'enum',
    enum: ChunkingStrategy,
    default: ChunkingStrategy.FIXED_SIZE
  })
  chunkingStrategy: ChunkingStrategy;

  @Column({ type: 'jsonb', nullable: true })
  chunkingSettings: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  };

  @OneToMany(() => CorpusFile, file => file.knowledgeBase)
  corpusFiles: CorpusFile[];

  @OneToMany(() => DocumentEmbedding, embedding => embedding.knowledgeBase)
  embeddings: DocumentEmbedding[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'vector_kb_chat_histories',
    joinColumn: {
      name: 'knowledge_base_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    }
  })
  chatHistoryUsers: User[];

  @Column({ default: false })
  needsRebuild: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 