import { User } from './user.entity';
import { Message } from './message.entity';
export declare class Channel {
    id: string;
    name: string;
    users: User[];
    messages: Message[];
}
