import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(body: {
        email: string;
        password: string;
        username: string;
        ticketId?: string;
    }): Promise<any>;
    signIn(body: {
        email: string;
        password: string;
    }): Promise<any>;
}
