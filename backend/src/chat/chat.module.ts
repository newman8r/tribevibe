import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';
import { PresenceModule } from '../presence/presence.module';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { AutonomousAgentModule } from '../autonomous-agent/autonomous-agent.module';
import { NameGenerator } from '../utils/name-generator';

@Module({
  imports: [
    UserModule,
    forwardRef(() => ChannelModule),
    MessageModule,
    PresenceModule,
    DirectMessageModule,
    AutonomousAgentModule
  ],
  providers: [
    ChatGateway,
    NameGenerator
  ],
  exports: [ChatGateway]
})
export class ChatModule {} 