import { Socket, Server } from 'socket.io';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';
import { MessageService } from '../message/message.service';
import { NameGenerator } from '../utils/name-generator';
import { PresenceService } from '../presence/presence.service';
export declare class ChatGateway {
    private userService;
    private channelService;
    private messageService;
    private nameGenerator;
    private presenceService;
    server: Server;
    constructor(userService: UserService, channelService: ChannelService, messageService: MessageService, nameGenerator: NameGenerator, presenceService: PresenceService);
    handleJoinChannel(data: {
        userId: string;
        channelId: string;
    }, client: Socket): Promise<void>;
    handleMessage(data: {
        userId: string;
        channelId: string;
        content: string;
    }, client: Socket): Promise<void>;
    handlePresenceUpdate(data: {
        userId: string;
    }): Promise<void>;
    private broadcastUserStatus;
}
