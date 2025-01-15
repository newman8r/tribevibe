import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { VectorKnowledgeBase } from './vector-knowledge-base.entity';
import { VectorTransformer } from './column-types/vector.column-type';

@Entity()
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column('text')
  source: string;

  @Column('text')
  sourceId: string;

  @Column('float8', { 
    array: true,
    nullable: true,
    transformer: new VectorTransformer()
  })
  embedding: number[] | null;

  @ManyToOne(() => VectorKnowledgeBase, kb => kb.embeddings, { nullable: true })
  knowledgeBase: VectorKnowledgeBase | null;

  @CreateDateColumn()
  createdAt: Date;
} 