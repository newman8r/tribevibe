import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';
import { ChatModule } from './chat/chat.module';
import { User } from './entities/user.entity';
import { Channel } from './entities/channel.entity';
import { Message } from './entities/message.entity';
import { UtilsModule } from './utils/utils.module';
import { UserPresence } from './entities/user-presence.entity';
import { Reaction } from './entities/reaction.entity';
import { PresenceModule } from './presence/presence.module';
import { Thread } from './entities/thread.entity';
import { DirectMessageModule } from './direct-message/direct-message.module';
import { DirectMessageConversation } from './entities/direct-message-conversation.entity';
import { SearchModule } from './search/search.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ChannelModule,
    MessageModule,
    UtilsModule,
    PresenceModule,
    DirectMessageModule,
    ChatModule,
    SearchModule,
    FileModule,
  ],
})
export class AppModule {}

