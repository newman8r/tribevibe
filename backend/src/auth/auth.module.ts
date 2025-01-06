import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { ChannelModule } from '../channel/channel.module';

@Module({
  imports: [ConfigModule, UserModule, ChannelModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

