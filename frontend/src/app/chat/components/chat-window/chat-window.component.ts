import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private isUserScrolled = false;
  private lastScrollHeight = 0;
  showNewMessageBar = false;
  unreadCount = 0;
  private viewInitialized = false;
  userStatuses: Map<string, string> = new Map();
  hoveredMessageId: string | null = null;
  availableEmojis = ['👍', '👎', '🔥', '💯', '❤️', '😄'];
  
  // Thread-related properties
  activeThread: Message | null = null;
  threadReplyText = '';

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
      this.websocketService.onChannelHistory().subscribe(({messages, userStatuses}) => {
        this.messages = messages;
        // Update user statuses
        Object.entries(userStatuses).forEach(([userId, status]) => {
          this.userStatuses.set(userId, status);
        });
        this.scrollToBottom(true);
      })
    );

    // Subscribe to new messages
    this.subscriptions.push(
      this.websocketService.onNewMessage().subscribe(message => {
        this.messages.push(message);
        this.scrollToBottom();
      })
    );

    // Subscribe to user status updates
    this.subscriptions.push(
      this.websocketService.onUserStatusUpdate().subscribe(({userId, status}) => {
        this.userStatuses.set(userId, status);
      })
    );

    // Subscribe to reaction updates
    this.subscriptions.push(
      this.websocketService.onMessageReactionUpdate().subscribe(updatedMessage => {
        const index = this.messages.findIndex(m => m.id === updatedMessage.id);
        if (index !== -1) {
          // Merge the updated message with the existing one to preserve all properties
          const existingMessage = this.messages[index];
          const mergedMessage = {
            ...existingMessage,
            reactions: updatedMessage.reactions
          };

          // Create a new array to trigger change detection
          this.messages = [
            ...this.messages.slice(0, index),
            mergedMessage,
            ...this.messages.slice(index + 1)
          ];
        }
      })
    );

// Set up presence interval for all users (including anonymous)
const currentUser = this.authService.getCurrentUser();
const userId = currentUser?.id || this.anonymousId;

// Initial presence update
this.websocketService.updatePresence(userId);

// Update presence every 15 seconds
setInterval(() => {
  this.websocketService.updatePresence(userId);
}, 15000);
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

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.scrollToBottom(true);
    this.setupScrollListener();
  }

  private setupScrollListener() {
    const container = this.messagesContainer.nativeElement;
    container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      this.isUserScrolled = !isAtBottom;
      
      if (!this.isUserScrolled) {
        this.showNewMessageBar = false;
        this.unreadCount = 0;
      }
    });
  }

  private scrollToBottom(force = false) {
    if (!this.viewInitialized) {
      setTimeout(() => this.scrollToBottom(force), 0);
      return;
    }
    
    if (!this.messagesContainer) return;
    
    const container = this.messagesContainer.nativeElement;
    if (!this.isUserScrolled || force) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: force ? 'auto' : 'smooth'
        });
        this.lastScrollHeight = container.scrollHeight;
      });
    } else {
      this.showNewMessageBar = true;
      this.unreadCount++;
    }
  }

  jumpToNewMessages() {
    this.showNewMessageBar = false;
    this.unreadCount = 0;
    this.scrollToBottom(true);
  }

  getUserStatus(message: Message): string {
    if (message.anonymousId) {
      return this.userStatuses.get(message.anonymousId) || 'offline';
    }
    return this.userStatuses.get(message.user?.id || '') || 'offline';
  }

  onMessageMouseEnter(messageId: string) {
    this.hoveredMessageId = messageId;
  }

  onMessageMouseLeave() {
    this.hoveredMessageId = null;
  }

  addReaction(message: Message, emoji: string) {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || this.anonymousId;
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(r => 
      (userId.startsWith('anonymous-') && r.anonymousId === userId) ||
      (!userId.startsWith('anonymous-') && r.user?.id === userId)
    );

    if (existingReaction?.emoji === emoji) {
      this.websocketService.removeReaction(message.id, emoji, userId);
    } else {
      this.websocketService.addReaction(message.id, emoji, userId);
    }
  }

  getReactionCount(message: Message, emoji: string): number {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  }

  hasUserReacted(message: Message, emoji: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || this.anonymousId;
    
    return message.reactions?.some(r => 
      r.emoji === emoji && 
      ((userId.startsWith('anonymous-') && r.anonymousId === userId) ||
       (!userId.startsWith('anonymous-') && r.user?.id === userId))
    ) || false;
  }

  openThread(message: Message) {
    this.activeThread = message;
    // Add animation class after a brief delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const threadPanel = document.querySelector('.thread-panel');
      if (threadPanel) {
        threadPanel.classList.add('animating');
      }
    });
  }

  closeThread() {
    const threadPanel = document.querySelector('.thread-panel');
    if (threadPanel) {
      threadPanel.classList.add('closing');
      // Wait for animation to complete before removing the thread
      setTimeout(() => {
        this.activeThread = null;
        threadPanel.classList.remove('closing', 'animating');
      }, 300); // Match this with CSS animation duration
    }
  }

  sendThreadReply() {
    // Will be implemented in the next step
    console.log('Sending thread reply:', this.threadReplyText);
    this.threadReplyText = '';
  }
} 