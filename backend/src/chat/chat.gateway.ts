import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';
import { MessageService } from '../message/message.service';
import { NameGenerator } from '../utils/name-generator';
import { PresenceService } from '../presence/presence.service';
import { UserStatus } from '../core/interfaces/user-status.enum';

@WebSocketGateway({
  cors: {
    origin: true,  // Allow all origins in development
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  transports: ['websocket', 'polling']
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private userService: UserService,
    private channelService: ChannelService,
    private messageService: MessageService,
    private nameGenerator: NameGenerator,
    private presenceService: PresenceService,
  ) {}

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { userId: string; channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.channelId);
    
    // Get messages
    const messages = await this.messageService.getChannelMessages(data.channelId);
    const userStatuses: { [key: string]: string } = {};
    
    // Get all user IDs (including anonymous)
    const userIds = [...new Set(
      messages.map(msg => msg.user?.id || msg.anonymousId).filter(Boolean)
    )];
    
    // Get status for each user
    for (const userId of userIds) {
      const status = await this.presenceService.getUserStatus(userId);
      userStatuses[userId] = status;
    }
    
    // Send both messages and statuses
    client.emit('channelHistory', {
      messages: messages.reverse(),
      userStatuses
    });
    
    client.emit('joinedChannel', { channelId: data.channelId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { userId: string; channelId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const channel = await this.channelService.findOne(data.channelId);
    if (!channel) return;

    let messageData: any = {
      content: data.content,
      channel,
    };

    if (data.userId.startsWith('anonymous-')) {
      messageData.anonymousId = data.userId;
      messageData.username = `anon ${this.nameGenerator.generateNickname(data.userId)}`;
      messageData.avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${data.userId}`;
    } else {
      const user = await this.userService.findOne(data.userId);
      if (user) {
        messageData.user = user;
        messageData.username = user.username;
      }
    }

    const savedMessage = await this.messageService.create(messageData);
    this.server.to(data.channelId).emit('newMessage', savedMessage);
  }

  @SubscribeMessage('updatePresence')
  async handlePresenceUpdate(
    @MessageBody() data: { userId: string }
  ) {
    await this.presenceService.updatePresence(data.userId);
    await this.broadcastUserStatus(data.userId);
  }

  @SubscribeMessage('updateManualStatus')
  async handleManualStatus(
    @MessageBody() data: { userId: string; status: string }
  ) {
    await this.presenceService.setManualStatus(data.userId, data.status as UserStatus);
    await this.broadcastUserStatus(data.userId);
  }

  private async broadcastUserStatus(userId: string) {
    const status = await this.presenceService.getUserStatus(userId);
    this.server.emit('userStatusUpdate', { userId, status });
  }
}

