import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPresence } from '../entities/user-presence.entity';

export enum UserStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  OFFLINE = 'offline'
}

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(UserPresence)
    private presenceRepository: Repository<UserPresence>
  ) {}

  async updatePresence(userId: string): Promise<void> {
    await this.presenceRepository.upsert(
      {
        userId,
        lastActivity: new Date()
      },
      ['userId']
    );
  }

  async getUserStatus(userId: string): Promise<UserStatus> {
    const presence = await this.presenceRepository.findOne({
      where: { userId }
    });

    if (!presence) return UserStatus.OFFLINE;

    const now = new Date();
    const diff = now.getTime() - presence.lastActivity.getTime();
    const minutesDiff = diff / (1000 * 60);

    if (minutesDiff <= 15) return UserStatus.ONLINE;
    if (minutesDiff <= 30) return UserStatus.IDLE;
    return UserStatus.OFFLINE;
  }
} 