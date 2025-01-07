import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Channel } from '../../../core/interfaces/channel.interface';
import { Message } from '../../../core/interfaces/message.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  messageText = '';
  currentChannel: Channel | null = null;
  private subscriptions: Subscription[] = [];
  private anonymousId: string;

  constructor(
    private channelStateService: ChannelStateService,
    private websocketService: WebsocketService,
    private authService: AuthService
  ) {
    // Get or create anonymous ID
    this.anonymousId = localStorage.getItem('anonymousId') || 
      'anonymous-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousId', this.anonymousId);
  }

  ngOnInit() {
    // Get initial channel state
    const initialChannel = this.channelStateService.getCurrentChannel();
    if (initialChannel) {
      this.currentChannel = initialChannel;
      this.joinChannel(initialChannel.id);
    }

    // Subscribe to channel changes
    this.subscriptions.push(
      this.channelStateService.selectedChannel$.subscribe(channel => {
        if (channel && channel.id !== this.currentChannel?.id) {
          this.currentChannel = channel;
          this.messages = [];
          this.joinChannel(channel.id);
        }
      })
    );

    // Subscribe to channel history
    this.subscriptions.push(
      this.websocketService.onChannelHistory().subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to new messages
    this.subscriptions.push(
      this.websocketService.onNewMessage().subscribe(message => {
        this.messages.push(message);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private joinChannel(channelId: string) {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || this.anonymousId;
    this.websocketService.joinChannel(userId, channelId);
  }

  openEmojiPicker() {
    // Implement emoji picker logic
  }

  onEnterPress(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.messageText.trim() && this.currentChannel) {
      const currentUser = this.authService.getCurrentUser();
      const userId = currentUser?.id || this.anonymousId;
      
      this.websocketService.sendMessage(
        userId,
        this.currentChannel.id,
        this.messageText.trim()
      );
      
      this.messageText = '';
    }
  }

  // Helper method to get consistent avatar URL
  getAvatarUrl(message: Message): string {
    if (message.user?.avatarUrl) {
      return message.user.avatarUrl;
    }
    return message.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${message.anonymousId}`;
  }
} 