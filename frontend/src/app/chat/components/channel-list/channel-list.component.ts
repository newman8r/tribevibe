import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
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
  currentChannel: Channel | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadChannels();
  }

  loadChannels() {
    this.apiService.getAllChannels().subscribe(channels => {
      this.channels = channels;
    });
  }

  selectChannel(channel: Channel) {
    this.currentChannel = channel;
  }

  createChannel() {
    // Implement channel creation logic
  }
} 