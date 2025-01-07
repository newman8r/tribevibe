import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { Channel } from '../../../core/interfaces/channel.interface';

@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class ChannelListComponent implements OnInit {
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;
  isLoggedIn = false;
  showCreateModal = false;
  newChannelName = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private channelStateService: ChannelStateService
  ) {}

  ngOnInit() {
    this.loadChannels();
    this.channelStateService.selectedChannel$.subscribe(channel => {
      this.selectedChannel = channel;
    });
    
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
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

  openCreateChannelModal() {
    this.showCreateModal = true;
    this.newChannelName = '';
  }

  closeCreateChannelModal() {
    this.showCreateModal = false;
  }

  createChannel() {
    if (this.newChannelName.trim()) {
      this.apiService.createChannel(this.newChannelName.trim()).subscribe({
        next: (newChannel) => {
          this.channels.push(newChannel);
          this.selectChannel(newChannel);
          this.closeCreateChannelModal();
        },
        error: (error) => {
          console.error('Error creating channel:', error);
          // Here you could add error handling UI feedback
        }
      });
    }
  }
} 