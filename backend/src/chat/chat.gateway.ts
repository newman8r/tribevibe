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
    origin: [
      'http://localhost:4200',
      'http://23.23.150.233'
    ],
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

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @MessageBody() data: { 
      messageId: string; 
      emoji: string;
      userId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const isAnonymous = data.userId.startsWith('anonymous-');
      const updatedMessage = await this.messageService.addReaction(
        data.messageId,
        data.emoji,
        isAnonymous ? undefined : data.userId,
        isAnonymous ? data.userId : undefined
      );
      
      // If the message is a thread reply, emit to thread room
      if (updatedMessage.threadParent) {
        const threadRoom = `thread:${updatedMessage.threadParent.parentMessage.id}`;
        this.server.to(threadRoom).emit('threadUpdate', 
          await this.messageService.findMessageWithThread(updatedMessage.threadParent.parentMessage.id)
        );
      } else {
        // Regular message, broadcast to channel
        this.server.to(updatedMessage.channel.id).emit('messageReactionUpdate', updatedMessage);
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @MessageBody() data: { 
      messageId: string; 
      emoji: string;
      userId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const isAnonymous = data.userId.startsWith('anonymous-');
      const updatedMessage = await this.messageService.removeReaction(
        data.messageId,
        data.emoji,
        isAnonymous ? undefined : data.userId,
        isAnonymous ? data.userId : undefined
      );
      
      // If the message is a thread reply, emit to thread room
      if (updatedMessage.threadParent) {
        const threadRoom = `thread:${updatedMessage.threadParent.parentMessage.id}`;
        this.server.to(threadRoom).emit('threadUpdate', 
          await this.messageService.findMessageWithThread(updatedMessage.threadParent.parentMessage.id)
        );
      } else {
        // Regular message, broadcast to channel
        this.server.to(updatedMessage.channel.id).emit('messageReactionUpdate', updatedMessage);
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messageService.findMessageWithThread(data.messageId);
    if (!message) return;

    // Join the thread's room
    const threadRoom = `thread:${data.messageId}`;
    client.join(threadRoom);

    // Send thread history
    client.emit('threadHistory', message);
  }

  @SubscribeMessage('sendThreadReply')
  async handleThreadReply(
    @MessageBody() data: { 
      parentMessageId: string;
      userId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    let replyData: any = {
      content: data.content,
      parentMessageId: data.parentMessageId,
    };

    if (data.userId.startsWith('anonymous-')) {
      replyData.anonymousId = data.userId;
      replyData.username = `anon ${this.nameGenerator.generateNickname(data.userId)}`;
    } else {
      const user = await this.userService.findOne(data.userId);
      if (user) {
        replyData.user = user;
        replyData.username = user.username;
      }
    }

    try {
      const savedReply = await this.messageService.createThreadReply(replyData);
      
      // Get updated message with thread
      const updatedMessage = await this.messageService.findMessageWithThread(data.parentMessageId);
      
      // Emit to thread room
      const threadRoom = `thread:${data.parentMessageId}`;
      this.server.to(threadRoom).emit('threadUpdate', updatedMessage);
      
      // Also emit message update to channel for reply count update
      if (updatedMessage.channel) {
        this.server.to(updatedMessage.channel.id).emit('messageUpdate', {
          id: updatedMessage.id,
          replyCount: updatedMessage.replyCount
        });
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveThread')
  async handleLeaveThread(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const threadRoom = `thread:${data.messageId}`;
    client.leave(threadRoom);
  }

  @SubscribeMessage('getUserList')
  async handleGetUserList() {
    const users = await this.userService.findAll();
    const userStatuses = await this.presenceService.getAllUserStatuses();
    
    // Combine user data with their statuses
    const usersWithStatus = users.map(user => {
      const statusObj = userStatuses.find(status => status.userId === user.id);
      return {
        ...user,
        status: statusObj?.status || UserStatus.OFFLINE
      };
    });
    
    this.server.emit('userList', usersWithStatus);
  }

  private async broadcastUserStatus(userId: string) {
    const status = await this.presenceService.getUserStatus(userId);
    this.server.emit('userStatusUpdate', { userId, status });
  }
}

