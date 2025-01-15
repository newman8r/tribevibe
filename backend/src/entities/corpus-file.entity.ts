import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VectorKnowledgeBase } from './vector-knowledge-base.entity';

@Entity()
export class CorpusFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  s3Key: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @ManyToOne(() => VectorKnowledgeBase, kb => kb.corpusFiles)
  knowledgeBase: VectorKnowledgeBase;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 