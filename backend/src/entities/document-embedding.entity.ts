import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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
    nullable: true 
  })
  embedding: number[] | null;

  @CreateDateColumn()
  createdAt: Date;
} 