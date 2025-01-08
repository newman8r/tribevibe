import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { User } from './src/entities/user.entity';
import { Channel } from './src/entities/channel.entity';
import { Message } from './src/entities/message.entity';
import { UserPresence } from './src/entities/user-presence.entity';
import { Reaction } from './src/entities/reaction.entity';

dotenv.config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(configService.get('DB_PORT') ?? '5432'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [User, Channel, Message, UserPresence, Reaction],
  synchronize: true,
  dropSchema: true,
  logging: true
});

export default dataSource;
module.exports = dataSource; 