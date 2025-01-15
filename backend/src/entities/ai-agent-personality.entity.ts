import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum MeyersBriggsType {
  INTJ = 'INTJ',
  INTP = 'INTP',
  ENTJ = 'ENTJ',
  ENTP = 'ENTP',
  INFJ = 'INFJ',
  INFP = 'INFP',
  ENFJ = 'ENFJ',
  ENFP = 'ENFP',
  ISTJ = 'ISTJ',
  ISFJ = 'ISFJ',
  ESTJ = 'ESTJ',
  ESFJ = 'ESFJ',
  ISTP = 'ISTP',
  ISFP = 'ISFP',
  ESTP = 'ESTP',
  ESFP = 'ESFP'
}

@Entity()
export class AiAgentPersonality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  agent: User;

  @Column({ type: 'text' })
  generalPersonality: string;

  @Column({
    type: 'enum',
    enum: MeyersBriggsType,
    nullable: true
  })
  meyersBriggs: MeyersBriggsType;

  @Column({ type: 'text', nullable: true })
  writingStyle: string;

  @Column({ length: 100, nullable: true })
  displayName: string;

  @Column({ length: 255, nullable: true })
  contactEmail: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 