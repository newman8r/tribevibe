import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageConversation } from '../entities/direct-message-conversation.entity';
import { Message } from '../entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessageConversation, Message])
  ],
  providers: [DirectMessageService],
  exports: [DirectMessageService]
})
export class DirectMessageModule {} 