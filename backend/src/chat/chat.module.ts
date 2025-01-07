import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';
import { AuthModule } from '../auth/auth.module';
import { WsGuard } from './ws.guard';
import { NameGenerator } from '../utils/name-generator';

@Module({
  imports: [
    UserModule,
    ChannelModule,
    MessageModule,
    AuthModule // Import AuthModule to use AuthService
  ],
  providers: [
    ChatGateway,
    WsGuard,
    NameGenerator
  ]
})
export class ChatModule {} 