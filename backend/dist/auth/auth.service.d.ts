import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
export declare class AuthService {
    private configService;
    private userService;
    private supabase;
    constructor(configService: ConfigService, userService: UserService);
    signUp(email: string, password: string, ticketId: string): Promise<any>;
    signIn(email: string, password: string): Promise<any>;
    validateToken(token: string): Promise<any>;
}
