import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { Channel } from '../../../core/interfaces/channel.interface';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Subscription } from 'rxjs';
import { AuthPromptModalComponent } from '../../../shared/components/auth-prompt-modal/auth-prompt-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
  imports: [CommonModule, FormsModule, AuthPromptModalComponent],
  standalone: true
})
export class ChannelListComponent implements OnInit, OnDestroy {
  @Output() channelSelected = new EventEmitter<void>();

  channels: Channel[] = [];
  selectedChannel: Channel | null = null;
  isLoggedIn = false;
  showCreateModal = false;
  showAuthPromptModal = false;
  newChannelName = '';
  private subscriptions: Subscription[] = [];

  // SoundCloud player properties
  soundcloudPlayerUrl: SafeResourceUrl | null = null;
  readonly playlistUrl = 'https://soundcloud.com/bradmoontribe/sets/most-loved-moontribe-mixes';
  private readonly embedUrl = 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/bradmoontribe/sets/most-loved-moontribe-mixes&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private channelStateService: ChannelStateService,
    private websocketService: WebsocketService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadChannels();
    this.channelStateService.selectedChannel$.subscribe(channel => {
      this.selectedChannel = channel;
    });
    
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    // Subscribe to new channel notifications
    this.subscriptions.push(
      this.websocketService.onChannelCreated().subscribe(channel => {
        if (!this.channels.find(c => c.id === channel.id)) {
          this.channels.push(channel);
        }
      })
    );

    // Initialize SoundCloud player
    this.soundcloudPlayerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.channelSelected.emit();
  }

  openCreateChannelModal() {
    if (!this.isLoggedIn) {
      this.showAuthPromptModal = true;
      return;
    }
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
          // No need to manually add the channel here as it will come through the WebSocket
          this.selectChannel(newChannel);
          this.closeCreateChannelModal();
        },
        error: (error) => {
          console.error('Error creating channel:', error);
        }
      });
    }
  }
} 