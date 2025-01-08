import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { Message } from '../entities/message.entity';
import { Reaction } from '../entities/reaction.entity';
import { Thread } from '../entities/thread.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Reaction, Thread])],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {} 