import { ChannelService } from './channel.service';
export declare class ChannelController {
    private channelService;
    constructor(channelService: ChannelService);
    create(body: {
        name: string;
    }): Promise<import("../entities/channel.entity").Channel>;
    findAll(): Promise<import("../entities/channel.entity").Channel[]>;
    findOne(id: string): Promise<import("../entities/channel.entity").Channel>;
}
