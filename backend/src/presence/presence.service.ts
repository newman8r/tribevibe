import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPresence } from '../entities/user-presence.entity';
import { UserStatus } from '../core/interfaces/user-status.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class PresenceService {
  private anonymousPresence: Map<string, Date> = new Map();
  private manualStatuses: Map<string, UserStatus> = new Map();

  constructor(
    @InjectRepository(UserPresence)
    private presenceRepository: Repository<UserPresence>,
    private userService: UserService
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
    // Check for manual status override first
    const manualStatus = this.manualStatuses.get(userId);
    if (manualStatus) return manualStatus;

    if (userId.startsWith('anonymous-')) {
      const lastActivity = this.anonymousPresence.get(userId);
      if (!lastActivity) return UserStatus.OFFLINE;

      const now = new Date();
      const diff = now.getTime() - lastActivity.getTime();
      const minutesDiff = diff / (1000 * 60);

      if (minutesDiff <= 15) return UserStatus.ONLINE;
      if (minutesDiff <= 30) return UserStatus.AWAY;
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
    if (minutesDiff <= 30) return UserStatus.AWAY;
    return UserStatus.OFFLINE;
  }

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

  async setManualStatus(userId: string, status: UserStatus): Promise<void> {
    this.manualStatuses.set(userId, status);
  }

  clearManualStatus(userId: string): void {
    this.manualStatuses.delete(userId);
  }

  async getAllUserStatuses(): Promise<{ userId: string; status: UserStatus }[]> {
    const allUsers = await this.userService.findAll();
    const statuses: { userId: string; status: UserStatus }[] = [];

    for (const user of allUsers) {
      const status = await this.getUserStatus(user.id);
      statuses.push({ userId: user.id, status });
    }

    return statuses;
  }

  private getAnonymousUserStatus(lastActivity: Date): UserStatus {
    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const minutesDiff = diff / (1000 * 60);

    if (minutesDiff <= 15) return UserStatus.ONLINE;
    if (minutesDiff <= 30) return UserStatus.AWAY;
    return UserStatus.OFFLINE;
  }
} 