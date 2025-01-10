import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';
import { AuthModule } from '../auth/auth.module';
import { PresenceModule } from '../presence/presence.module';
import { WsGuard } from './ws.guard';
import { NameGenerator } from '../utils/name-generator';
import { DirectMessageModule } from '../direct-message/direct-message.module';

@Module({
  imports: [
    UserModule,
    ChannelModule,
    forwardRef(() => MessageModule),
    AuthModule,
    PresenceModule,
    DirectMessageModule
  ],
  providers: [
    ChatGateway,
    WsGuard,
    NameGenerator
  ],
  exports: [ChatGateway]
})
export class ChatModule {} 