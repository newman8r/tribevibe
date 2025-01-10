import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('channels')
export class ChannelController {
  constructor(
    private channelService: ChannelService,
    private chatGateway: ChatGateway
  ) {}

  @Post()
  async create(@Body() body: { name: string }) {
    const channel = await this.channelService.create(body.name);
    // Emit the new channel to all connected clients
    this.chatGateway.server.emit('channelCreated', channel);
    return channel;
  }

  @Get()
  async findAll() {
    return this.channelService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.channelService.findOne(id);
  }
}

