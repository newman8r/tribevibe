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
  ) {}

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { userId: string; channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.channelId);
    
    // Send last 100 messages to the user
    const messages = await this.messageService.getChannelMessages(data.channelId);
    client.emit('channelHistory', messages.reverse());
    
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
}

