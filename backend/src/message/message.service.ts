import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
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

  async getChannelMessages(channelId: string, limit = 100): Promise<Message[]> {
    return this.messageRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
} 