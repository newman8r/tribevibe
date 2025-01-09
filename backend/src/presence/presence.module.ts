import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPresence } from '../entities/user-presence.entity';
import { PresenceService } from './presence.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPresence]),
    UserModule
  ],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {} 