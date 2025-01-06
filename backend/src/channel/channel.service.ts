import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async create(name: string): Promise<Channel> {
    const channel = this.channelRepository.create({ name });
    return this.channelRepository.save(channel);
  }

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find();
  }

  async findOne(id: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({ where: { id }, relations: ['users'] });
    if (!channel) throw new Error('Channel not found');
    return channel;
  }

  async addUserToChannel(channel: Channel, user: User): Promise<Channel> {
    channel.users.push(user);
    return this.channelRepository.save(channel);
  }
}

