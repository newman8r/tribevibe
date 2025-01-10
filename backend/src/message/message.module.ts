import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { Message } from '../entities/message.entity';
import { Reaction } from '../entities/reaction.entity';
import { Thread } from '../entities/thread.entity';
import { File } from '../entities/file.entity';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Reaction, Thread, File]),
    forwardRef(() => FileModule),
  ],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {} 