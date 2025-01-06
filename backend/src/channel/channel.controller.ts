import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Controller('channels')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Post()
  async create(@Body() body: { name: string }) {
    return this.channelService.create(body.name);
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

