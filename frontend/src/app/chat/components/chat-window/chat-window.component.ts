import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatWindowComponent {
  messages: any[] = []; // Initialize as empty array
  messageText = ''; // Remove explicit type as it's inferred

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