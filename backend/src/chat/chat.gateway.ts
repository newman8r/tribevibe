import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';

@WebSocketGateway()
export class ChatGateway {
  constructor(
    private userService: UserService,
    private channelService: ChannelService,
  ) {}

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { userId: string; channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
    const user = await this.userService.findOne(data.userId);
    const channel = await this.channelService.findOne(data.channelId);

    if (user && channel) {
      // Here you would typically save the message to the database
      const message = {
        user: { id: user.id, username: user.username },
        content: data.content,
        createdAt: new Date(),
      };

      client.to(data.channelId).emit('newMessage', message);
    }
  }
}

