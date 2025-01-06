import { User } from './user.entity';
import { Channel } from './channel.entity';
export declare class Message {
    id: string;
    content: string;
    createdAt: Date;
    user: User;
    channel: Channel;
}
