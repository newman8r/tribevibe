import { Channel } from './channel.entity';
export declare class User {
    id: string;
    email: string;
    username: string;
    password: string;
    ticketId: string;
    avatarUrl: string;
    channels: Channel[];
}
