import { User } from './user.entity';
import { Channel } from './channel.entity';
export declare class Message {
    id: string;
    content: string;
    createdAt: Date;
    anonymousId: string;
    username: string;
    avatarUrl: string;
    user: User;
    channel: Channel;
}
