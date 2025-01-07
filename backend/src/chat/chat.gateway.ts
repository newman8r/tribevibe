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
  ) {}

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { userId: string; channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Skip user lookup for anonymous users
    if (data.userId.startsWith('anonymous-')) {
      client.join(data.channelId);
      client.emit('joinedChannel', { channelId: data.channelId });
      return;
    }

    const user = await this.userService.findOne(data.userId);
    const channel = await this.channelService.findOne(data.channelId);

    if (user && channel) {
      await this.channelService.addUserToChannel(channel, user);
      client.join(data.channelId);
      client.emit('joinedChannel', { channelId: data.channelId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { userId: string; channelId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Handle anonymous users
    if (data.userId.startsWith('anonymous-')) {
      const message = {
        user: { id: data.userId, username: 'Anonymous User' },
        content: data.content,
        createdAt: new Date(),
      };
      // Emit to everyone in the channel INCLUDING the sender
      this.server.to(data.channelId).emit('newMessage', message);
      return;
    }

    const user = await this.userService.findOne(data.userId);
    const channel = await this.channelService.findOne(data.channelId);

    if (user && channel) {
      const message = {
        user: { id: user.id, username: user.username },
        content: data.content,
        createdAt: new Date(),
      };
      // Emit to everyone in the channel INCLUDING the sender
      this.server.to(data.channelId).emit('newMessage', message);
    }
  }
}

