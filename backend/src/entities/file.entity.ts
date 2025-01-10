import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';
import { Message } from './message.entity';

export enum FileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  CODE = 'code',
  OTHER = 'other'
}

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  key: string; // S3 object key

  @Column()
  size: number;

  @Column()
  mimeType: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER
  })
  type: FileType;

  @Column({ nullable: true })
  thumbnailKey: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  uploader: User;

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn()
  channel: Channel;

  @ManyToOne(() => Message, message => message.files, { nullable: true })
  @JoinColumn()
  message: Message;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 