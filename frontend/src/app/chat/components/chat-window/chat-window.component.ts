import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { Channel } from '../../../core/interfaces/channel.interface';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatWindowComponent implements OnInit {
  messages: any[] = [];
  messageText = '';
  currentChannel: Channel | null = null;

  constructor(private channelStateService: ChannelStateService) {}

  ngOnInit() {
    this.channelStateService.selectedChannel$.subscribe(channel => {
      this.currentChannel = channel;
    });
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
    if (this.messageText.trim()) {
      // Implement message sending logic
      this.messageText = '';
    }
  }
} 