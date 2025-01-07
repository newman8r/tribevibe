import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { Channel } from '../../../core/interfaces/channel.interface';

@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class ChannelListComponent implements OnInit {
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;

  constructor(
    private apiService: ApiService,
    private channelStateService: ChannelStateService
  ) {}

  ngOnInit() {
    this.loadChannels();
    this.channelStateService.selectedChannel$.subscribe(channel => {
      this.selectedChannel = channel;
    });
  }

  loadChannels() {
    this.apiService.getAllChannels().subscribe(channels => {
      this.channels = channels;
      if (channels.length > 0 && !this.selectedChannel) {
        this.selectChannel(channels[0]);
      }
    });
  }

  selectChannel(channel: Channel) {
    this.channelStateService.setSelectedChannel(channel);
  }
} 