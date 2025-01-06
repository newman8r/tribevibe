import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
export declare class ChannelService {
    private channelRepository;
    constructor(channelRepository: Repository<Channel>);
    create(name: string): Promise<Channel>;
    findAll(): Promise<Channel[]>;
    findOne(id: string): Promise<Channel>;
    addUserToChannel(channel: Channel, user: User): Promise<Channel>;
}
