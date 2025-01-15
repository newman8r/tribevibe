import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import * as os from 'os';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private userService: UserService
  ) {}

  async getSystemInfo() {
    const [userCount, dbSize] = await Promise.all([
      this.userService.findAll().then(users => users.length),
      this.getDatabaseSize()
    ]);

    return {
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime()
      },
      application: {
        userCount,
        databaseSize: dbSize,
        nodeVersion: process.version,
        processUptime: process.uptime()
      }
    };
  }

  private async getDatabaseSize(): Promise<string> {
    const result = await this.dataSource.query(
      "SELECT pg_size_pretty(pg_database_size(current_database()))"
    );
    return result[0].pg_size_pretty;
  }
} 