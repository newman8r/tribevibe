import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { Thread } from '../entities/thread.entity';
import { File, FileType } from '../entities/file.entity';
import { FileService } from '../file/file.service';

interface FileWithUrls extends File {
  url: string;
  thumbnailUrl?: string;
}

interface MessageWithFileUrls extends Omit<Message, 'files'> {
  files: FileWithUrls[];
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
    @InjectRepository(Thread)
    private threadRepository: Repository<Thread>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private fileService: FileService,
  ) {}

  async create(data: {
    content: string;
    channel: Channel;
    user?: User;
    anonymousId?: string;
    username: string;
  }): Promise<Message> {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  async getChannelMessages(channelId: string, limit = 100): Promise<MessageWithFileUrls[]> {
    const messages = await this.messageRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user', 'files'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Add URLs for files
    const messagesWithFileUrls = await Promise.all(messages.map(async (message) => {
      if (message.files?.length) {
        const filesWithUrls = await Promise.all(message.files.map(async (file) => {
          const fileWithUrls = file as FileWithUrls;
          fileWithUrls.url = await this.fileService.getPresignedUrl(file);
          if (file.type === FileType.IMAGE) {
            const thumbnailUrl = await this.fileService.getThumbnailUrl(file);
            if (thumbnailUrl) {
              fileWithUrls.thumbnailUrl = thumbnailUrl;
            }
          }
          return fileWithUrls;
        }));
        return { ...message, files: filesWithUrls };
      }
      return { ...message, files: [] };
    }));

    return messagesWithFileUrls;
  }

  async findMessageWithReactions(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({ 
      where: { id: messageId },
      relations: ['reactions', 'reactions.user', 'channel']
    });
    
    if (!message) throw new Error('Message not found');
    return message;
  }

  async addReaction(messageId: string, emoji: string, userId?: string, anonymousId?: string): Promise<Message> {
    const message = await this.findMessageWithReactions(messageId);
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(r => 
      (userId && r.user?.id === userId) || (anonymousId && r.anonymousId === anonymousId)
    );

    if (existingReaction && existingReaction.emoji === emoji) {
      return message;
    }

    // Check reaction limit
    if (message.reactions.length >= 10) {
      throw new Error('Maximum reactions reached for this message');
    }

    const reaction = this.reactionRepository.create({
      emoji,
      message,
      anonymousId,
      user: userId ? { id: userId } : undefined
    });

    await this.reactionRepository.save(reaction);
    return this.findMessageWithReactions(messageId);
  }

  async removeReaction(messageId: string, emoji: string, userId?: string, anonymousId?: string): Promise<Message> {
    const message = await this.findMessageWithReactions(messageId);
    
    await this.reactionRepository.delete({
      message: { id: messageId },
      emoji,
      ...(userId ? { user: { id: userId } } : {}),
      ...(anonymousId ? { anonymousId } : {})
    });

    return this.findMessageWithReactions(messageId);
  }

  async createThreadReply(data: {
    content: string;
    parentMessageId: string;
    user?: User;
    anonymousId?: string;
    username: string;
  }): Promise<Message> {
    const parentMessage = await this.messageRepository.findOne({
      where: { id: data.parentMessageId },
      relations: ['thread']
    });

    if (!parentMessage) {
      throw new Error('Parent message not found');
    }

    let thread = parentMessage.thread;
    if (!thread) {
      // Create new thread if it doesn't exist
      thread = this.threadRepository.create({
        parentMessage
      });
      thread = await this.threadRepository.save(thread);
    }

    const reply = this.messageRepository.create({
      content: data.content,
      user: data.user,
      anonymousId: data.anonymousId,
      username: data.username,
      threadParent: thread
    });

    const savedReply = await this.messageRepository.save(reply);

    // Update reply count
    await this.messageRepository.update(
      { id: parentMessage.id },
      { replyCount: () => '"replyCount" + 1' }
    );

    return savedReply;
  }

  async getThreadReplies(messageId: string): Promise<Message[]> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['thread', 'thread.replies', 'thread.replies.user']
    });

    if (!message || !message.thread) {
      return [];
    }

    return message.thread.replies;
  }

  async findMessageWithThread(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: [
        'thread',
        'thread.replies',
        'thread.replies.user',
        'thread.replies.reactions',
        'thread.replies.reactions.user',
        'reactions',
        'reactions.user',
        'channel'
      ]
    });

    if (!message) {
      throw new Error('Message not found');
    }

    return message;
  }

  async attachFileToMessage(messageId: string, fileId: string): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new Error('Message not found');
    }

    await this.fileRepository.update(
      { id: fileId },
      { message: { id: messageId } }
    );
  }

  async findMessageWithFiles(messageId: string): Promise<MessageWithFileUrls> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['user', 'files'],
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Add URLs for files
    if (message.files?.length) {
      const filesWithUrls = await Promise.all(message.files.map(async (file) => {
        const fileWithUrls = file as FileWithUrls;
        fileWithUrls.url = await this.fileService.getPresignedUrl(file);
        if (file.type === FileType.IMAGE) {
          const thumbnailUrl = await this.fileService.getThumbnailUrl(file);
          if (thumbnailUrl) {
            fileWithUrls.thumbnailUrl = thumbnailUrl;
          }
        }
        return fileWithUrls;
      }));
      return { ...message, files: filesWithUrls };
    }
    return { ...message, files: [] };
  }
} 