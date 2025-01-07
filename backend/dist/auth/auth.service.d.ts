import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';
export declare class AuthService {
    private configService;
    private userService;
    private channelService;
    private supabase;
    constructor(configService: ConfigService, userService: UserService, channelService: ChannelService);
    signUp(email: string, password: string, ticketId: string): Promise<any>;
    signIn(email: string, password: string): Promise<any>;
    validateToken(token: string): Promise<any>;
}
