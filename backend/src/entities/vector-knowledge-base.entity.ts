import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DocumentEmbedding } from './document-embedding.entity';

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

  @Column('text', { array: true, default: [] })
  associatedFiles: string[];  // Array of file paths or S3 keys

  @OneToMany(() => DocumentEmbedding, embedding => embedding.knowledgeBase)
  embeddings: DocumentEmbedding[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 