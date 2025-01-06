import { Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';
export declare class ChatGateway {
    private userService;
    private channelService;
    constructor(userService: UserService, channelService: ChannelService);
    handleJoinChannel(data: {
        userId: string;
        channelId: string;
    }, client: Socket): Promise<void>;
    handleMessage(data: {
        userId: string;
        channelId: string;
        content: string;
    }, client: Socket): Promise<void>;
}
