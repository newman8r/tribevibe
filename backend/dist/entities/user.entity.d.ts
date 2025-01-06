import { Channel } from './channel.entity';
export declare class User {
    id: string;
    username: string;
    ticketId: string;
    avatarUrl: string;
    channels: Channel[];
}
