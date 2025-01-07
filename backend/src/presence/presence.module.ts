import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPresence } from '../entities/user-presence.entity';
import { PresenceService } from './presence.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPresence])],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {} 