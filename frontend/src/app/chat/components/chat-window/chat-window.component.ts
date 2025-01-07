import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-window',
  template: `
    <div class="chat-window">
      <!-- Placeholder for chat window -->
      <p>Chat Window Component</p>
    </div>
  `,
  styles: [`
    .chat-window {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-light);
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ChatWindowComponent {} 