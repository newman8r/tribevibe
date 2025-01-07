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
  private anonymousPresence: Map<string, Date> = new Map();

  constructor(
    @InjectRepository(UserPresence)
    private presenceRepository: Repository<UserPresence>
  ) {}

  async updatePresence(userId: string): Promise<void> {
    if (userId.startsWith('anonymous-')) {
      this.anonymousPresence.set(userId, new Date());
      return;
    }

    await this.presenceRepository.upsert(
      {
        userId,
        lastActivity: new Date()
      },
      ['userId']
    );
  }

  async getUserStatus(userId: string): Promise<UserStatus> {
    if (userId.startsWith('anonymous-')) {
      const lastActivity = this.anonymousPresence.get(userId);
      if (!lastActivity) return UserStatus.OFFLINE;

      const now = new Date();
      const diff = now.getTime() - lastActivity.getTime();
      const minutesDiff = diff / (1000 * 60);

      if (minutesDiff <= 15) return UserStatus.ONLINE;
      if (minutesDiff <= 30) return UserStatus.IDLE;
      return UserStatus.OFFLINE;
    }

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

  // Clean up old anonymous presence data periodically
  cleanupAnonymousPresence(): void {
    const now = new Date();
    for (const [userId, lastActivity] of this.anonymousPresence.entries()) {
      const diff = now.getTime() - lastActivity.getTime();
      const minutesDiff = diff / (1000 * 60);
      if (minutesDiff > 30) {
        this.anonymousPresence.delete(userId);
      }
    }
  }
} 