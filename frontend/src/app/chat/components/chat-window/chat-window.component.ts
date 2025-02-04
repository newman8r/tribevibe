import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { Channel } from '../../../core/interfaces/channel.interface';
import { Message } from '../../../core/interfaces/message.interface';
import { User } from '../../../core/interfaces/user.interface';
import { FileService } from '../../../core/services/file.service';
import { Subscription } from 'rxjs';
import { SearchPanelComponent } from '../search-panel/search-panel.component';
import { SearchResult } from '../../../core/services/search.service';
import { FileUploadPanelComponent } from '../file-upload-panel/file-upload-panel.component';
import { AuthPromptModalComponent } from '../../../shared/components/auth-prompt-modal/auth-prompt-modal.component';
import { EmojiPickerComponent } from '../../../shared/components/emoji-picker/emoji-picker.component';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { firstValueFrom } from 'rxjs';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
}

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SearchPanelComponent,
    FileUploadPanelComponent,
    AuthPromptModalComponent,
    EmojiPickerComponent
  ]
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  messageText = '';
  currentChannel: Channel | null = null;
  currentUser$ = new BehaviorSubject<User | null>(null);
  anonymousId: string;
  private subscriptions: Subscription[] = [];
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private isUserScrolled = false;
  private lastScrollHeight = 0;
  showNewMessageBar = false;
  unreadCount = 0;
  private viewInitialized = false;
  userStatuses: Map<string, string> = new Map();
  hoveredMessageId: string | null = null;
  availableEmojis = ['👍', '👎', '🔥', '💯', '❤️', '😄'];
  users: User[] = [];
  
  // Thread-related properties
  activeThread: Message | null = null;
  threadReplyText = '';
  threadReplies: Message[] = [];
  @ViewChild('threadContent') private threadContent!: ElementRef;

  // Direct Message properties
  activeDMUser: User | null = null;
  directMessages: Message[] = [];
  dmMessageText = '';
  @ViewChild('dmContent') private dmContent!: ElementRef;
  private currentDMConversationId: string | null = null;

  isSearchPanelOpen = false;

  private highlightedMessageId: string | null = null;
  private highlightTimeout: any;

  isFileUploadPanelOpen = false;

  selectedChannel: Channel | null = null;

  attachedFile: AttachedFile | null = null;

  showAuthPromptModal = false;

  authPromptFeature = '';

  showEmojiPicker = false;
  private messageInputElement: HTMLTextAreaElement | null = null;

  // Add new property for iOS Safari detection
  isSafariIOS = false;

  // Add these new properties
  showingUserSettingsModal = false;
  selectedAvatarFile: File | null = null;
  avatarUploadError: string | null = null;
  hasUnsavedChanges = false;

  constructor(
    private channelStateService: ChannelStateService,
    private websocketService: WebsocketService,
    private authService: AuthService,
    private directMessageService: DirectMessageService,
    private fileService: FileService,
    private router: Router,
    private userService: UserService
  ) {
    // Get or generate anonymous ID
    this.anonymousId = localStorage.getItem('anonymousId') || 
      'anonymous-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousId', this.anonymousId);

    // Add iOS Safari detection
    this.isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       !('MSStream' in window) &&
                       /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  ngOnInit() {
    // Subscribe to auth state changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser$.next(user);
        // Remove the navigation logic - allow anonymous users
      })
    );

    // Subscribe to auth changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser$ = new BehaviorSubject<User | null>(user);
      })
    );

    // Get initial channel state
    const initialChannel = this.channelStateService.getCurrentChannel();
    if (initialChannel) {
      this.currentChannel = initialChannel;
      this.selectedChannel = initialChannel;
      this.joinChannel(initialChannel.id);
    }

    // Subscribe to channel changes
    this.subscriptions.push(
      this.channelStateService.selectedChannel$.subscribe(channel => {
        if (channel && channel.id !== this.currentChannel?.id) {
          this.currentChannel = channel;
          this.selectedChannel = channel;
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

    // Subscribe to thread history
    this.subscriptions.push(
      this.websocketService.onThreadHistory().subscribe(message => {
        // Preserve the parent message data but update the thread/replies
        if (this.activeThread) {
          this.activeThread = {
            ...this.activeThread,
            thread: message.thread
          };
        }
        if (message.thread?.replies) {
          this.threadReplies = message.thread.replies;
          this.scrollThreadToBottom();
        }
      })
    );

    // Subscribe to thread updates
    this.subscriptions.push(
      this.websocketService.onThreadUpdate().subscribe(message => {
        // Preserve the parent message data but update the thread/replies
        if (this.activeThread) {
          this.activeThread = {
            ...this.activeThread,
            thread: message.thread
          };
        }
        if (message.thread?.replies) {
          this.threadReplies = message.thread.replies;
          this.scrollThreadToBottom();
        }
      })
    );

    // Subscribe to user list updates
    this.subscriptions.push(
      this.websocketService.onUserList().subscribe(users => {
        this.users = users;
      })
    );

    // Subscribe to direct message history
    this.subscriptions.push(
      this.websocketService.onDirectMessageHistory().subscribe(({conversation, messages, userStatuses}) => {
        this.directMessages = messages;
        // Update user statuses
        Object.entries(userStatuses).forEach(([userId, status]) => {
          this.userStatuses.set(userId, status);
        });
        this.currentDMConversationId = conversation.id;
        this.scrollDMToBottom(true);
      })
    );

    // Subscribe to new direct messages
    this.subscriptions.push(
      this.websocketService.onNewDirectMessage().subscribe(message => {
        this.directMessages.push(message);
        this.scrollDMToBottom();
      })
    );

    // Subscribe to direct message requests
    this.subscriptions.push(
      this.directMessageService.openDM$.subscribe(userId => {
        this.openDirectMessage(userId);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private joinChannel(channelId: string) {
    const userId = this.getUserIdentifier();
    this.websocketService.joinChannel(userId, channelId);
  }

  openEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  onEnterPress(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if ((this.messageText.trim() || this.attachedFile) && this.currentChannel) {
      const currentUser = this.authService.getCurrentUser();
      const userId = currentUser?.id || this.anonymousId;
      
      this.websocketService.sendMessage(
        userId,
        this.currentChannel.id,
        this.messageText.trim(),
        this.attachedFile?.id
      );
      
      this.messageText = '';
      this.attachedFile = null;
    }
  }

  // Helper method to get consistent avatar URL
  getAvatarUrl(message: Message): string {
    // For registered users, use their avatar
    if (message.user?.avatarUrl) {
      return message.user.avatarUrl;
    }
    
    // For anonymous users, generate an avatar
    if (message.anonymousId) {
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${message.anonymousId}`;
    }

    // If message has a direct avatarUrl property, use that
    if (message.avatarUrl) {
      return message.avatarUrl;
    }

    // Fallback to generated avatar using message ID
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${message.id}`;
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
          top: container.scrollHeight + 100,
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
    // Always show AI user as online
    if (message.user?.isAiAgent) {
      return 'online';
    }
    
    // For regular users, get their status from the map
    if (message.user?.id) {
      return this.userStatuses.get(message.user.id) || 'offline';
    }
    
    // For anonymous users
    return message.anonymousId ? 'none' : 'offline';
  }

  // Add this helper method for status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return '#44b700';
      case 'away':
        return '#ffa500';
      case 'busy':
        return '#ff0000';
      case 'offline':
        return '#808080';
      default:
        return 'transparent';
    }
  }

  onMessageMouseEnter(messageId: string) {
    this.hoveredMessageId = messageId;
  }

  onMessageMouseLeave() {
    this.hoveredMessageId = null;
  }

  addReaction(message: Message, emoji: string) {
    if (!this.checkAuthAndPrompt('Message reactions')) return;
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
    const userId = this.getUserIdentifier();
    return message.reactions?.some(r => 
      ((userId.startsWith('anonymous-') && r.anonymousId === userId) ||
       (!userId.startsWith('anonymous-') && r.user?.id === userId)) &&
      r.emoji === emoji
    ) || false;
  }

  openThread(message: Message) {
    if (!this.checkAuthAndPrompt('Threaded replies')) return;
    // Create a deep copy of the message to preserve its data
    this.activeThread = {
      ...message,
      user: message.user ? { ...message.user } : undefined,
      reactions: [...(message.reactions || [])],
      channel: { ...message.channel }
    };
    this.threadReplies = [];
    this.websocketService.joinThread(message.id);
    
    // Add animation class after a brief delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const threadPanel = document.querySelector('.thread-panel');
      if (threadPanel) {
        threadPanel.classList.add('animating');
      }
    });
  }

  closeThread() {
    if (this.activeThread) {
      this.websocketService.leaveThread(this.activeThread.id);
    }

    const threadPanel = document.querySelector('.thread-panel');
    if (threadPanel) {
      threadPanel.classList.add('closing');
      // Wait for animation to complete before removing the thread
      setTimeout(() => {
        this.activeThread = null;
        this.threadReplies = [];
        threadPanel.classList.remove('closing', 'animating');
      }, 300); // Match this with CSS animation duration
    }
  }

  sendThreadReply() {
    if (this.threadReplyText.trim() && this.activeThread) {
      const currentUser = this.authService.getCurrentUser();
      const userId = currentUser?.id || this.anonymousId;
      
      this.websocketService.sendThreadReply(
        this.activeThread.id,
        userId,
        this.threadReplyText.trim()
      );
      
      this.threadReplyText = '';
    }
  }

  private scrollThreadToBottom() {
    setTimeout(() => {
      if (this.threadContent) {
        const element = this.threadContent.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  onThreadReplyEnterPress(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendThreadReply();
    }
  }

  async openDirectMessage(userId: string | undefined) {
    if (!userId) return;
    
    if (!this.checkAuthAndPrompt('Direct messages')) return;
    if (userId.startsWith('anonymous-')) return;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Leave current DM conversation if any
    if (this.currentDMConversationId) {
      this.websocketService.leaveDirectMessage(this.currentDMConversationId);
    }

    // Start new DM conversation
    this.websocketService.startDirectMessage(currentUser.id, userId);
    
    // Find and set the active user
    const targetUser = this.users.find(u => u.id === userId);
    if (targetUser) {
      this.activeDMUser = targetUser;
      
      // Add animation class after a brief delay to ensure DOM is ready
      requestAnimationFrame(() => {
        const dmPanel = document.querySelector('.direct-message-panel');
        if (dmPanel) {
          dmPanel.classList.add('animating');
        }
      });
    }

    // Reset unread count when opening DM panel
    if (this.currentDMConversationId) {
      this.websocketService.resetUnreadCount(currentUser.id, this.currentDMConversationId);
    }
  }

  closeDirectMessage() {
    const dmPanel = document.querySelector('.direct-message-panel');
    if (dmPanel) {
      dmPanel.classList.add('closing');
      // Wait for animation to complete before clearing data
      setTimeout(() => {
        this.activeDMUser = null;
        this.directMessages = [];
        this.currentDMConversationId = null;
        dmPanel.classList.remove('closing', 'animating');
      }, 300); // Match this with CSS animation duration
    }
  }

  onDMEnterPress(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendDirectMessage();
    }
  }

  sendDirectMessage() {
    if (this.dmMessageText.trim() && this.currentDMConversationId && this.activeDMUser) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;
      
      this.websocketService.sendDirectMessage(
        currentUser.id,
        this.currentDMConversationId,
        this.dmMessageText.trim()
      );
      
      this.dmMessageText = '';
      this.scrollDMToBottom();
    }
  }

  getDMUserStatus(): string {
    if (!this.activeDMUser) return 'offline';
    return this.userStatuses.get(this.activeDMUser.id) || 'offline';
  }

  private scrollDMToBottom(force = false) {
    setTimeout(() => {
      if (this.dmContent) {
        const element = this.dmContent.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  toggleSearchPanel() {
    this.isSearchPanelOpen = !this.isSearchPanelOpen;
  }

  onJumpToMessage(result: SearchResult) {
    // Wait for messages to load if we switched channels
    setTimeout(() => {
      const messageElement = this.messages.find(m => m.id === result.id);
      if (messageElement) {
        // Find the DOM element
        const element = document.querySelector(`[data-message-id="${result.id}"]`);
        if (element) {
          // Scroll the message into view
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight effect
          this.highlightedMessageId = result.id;
          if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
          }
          this.highlightTimeout = setTimeout(() => {
            this.highlightedMessageId = null;
          }, 3000); // Remove highlight after 3 seconds
        }
      }
    }, 500); // Give time for channel switch and message loading
  }

  isMessageHighlighted(messageId: string): boolean {
    return this.highlightedMessageId === messageId;
  }

  toggleFileUploadPanel() {
    if (!this.checkAuthAndPrompt('File upload')) return;
    this.isFileUploadPanelOpen = !this.isFileUploadPanelOpen;
  }

  onFileUploaded(fileId: string) {
    this.isFileUploadPanelOpen = false;
    // Get file metadata to display in the attachment indicator
    this.fileService.getFileUrl(fileId).subscribe(metadata => {
      this.attachedFile = {
        id: fileId,
        name: metadata.metadata.displayName,
        size: metadata.metadata.size
      };
    });
  }

  removeAttachedFile() {
    this.attachedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private checkAuthAndPrompt(feature: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.authPromptFeature = feature;
      this.showAuthPromptModal = true;
      return false;
    }
    return true;
  }

  onEmojiSelected(emoji: string) {
    if (!this.messageInputElement) {
      const element = document.querySelector('.message-input');
      if (element instanceof HTMLTextAreaElement) {
        this.messageInputElement = element;
      } else {
        this.messageText += emoji;
        return;
      }
    }

    const start = this.messageInputElement.selectionStart ?? this.messageText.length;
    const end = this.messageInputElement.selectionEnd ?? this.messageText.length;
    const text = this.messageText;
    
    this.messageText = text.substring(0, start) + emoji + text.substring(end);
    
    // Reset cursor position after emoji insertion
    setTimeout(() => {
      if (this.messageInputElement) {
        this.messageInputElement.selectionStart = start + emoji.length;
        this.messageInputElement.selectionEnd = start + emoji.length;
        this.messageInputElement.focus();
      }
    });
    
    this.showEmojiPicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const emojiButton = document.querySelector('.emoji-trigger');
    const emojiPicker = document.querySelector('.emoji-picker');
    
    if (!emojiButton?.contains(event.target as Node) && 
        !emojiPicker?.contains(event.target as Node)) {
      this.showEmojiPicker = false;
    }
  }

  getCurrentTime(): Date {
    return new Date();
  }

  getDMAvatarUrl(user: User): string {
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    // Generate an avatar using the user's ID
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`;
  }

  private getUserIdentifier(): string {
    return this.currentUser$.value?.id || this.anonymousId;
  }

  updatePresence(userId: string = this.getUserIdentifier()) {
    this.websocketService.updatePresence(userId);
  }

  handleReaction(message: Message, emoji: string) {
    const userId = this.getUserIdentifier();
    const hasReacted = message.reactions?.some(r => 
      (userId.startsWith('anonymous-') && r.anonymousId === userId) ||
      (!userId.startsWith('anonymous-') && r.user?.id === userId)
    );

    if (hasReacted) {
      this.websocketService.removeReaction(message.id, emoji, userId);
    } else {
      this.websocketService.addReaction(message.id, emoji, userId);
    }
  }

  showUserSettingsModal() {
    this.showingUserSettingsModal = true;
  }

  hideUserSettingsModal() {
    this.showingUserSettingsModal = false;
    this.selectedAvatarFile = null;
    this.avatarUploadError = null;
    this.hasUnsavedChanges = false;
  }

  async onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.avatarUploadError = 'File size must be less than 5MB';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.avatarUploadError = 'File must be an image';
        return;
      }

      this.selectedAvatarFile = file;
      this.hasUnsavedChanges = true;
      this.avatarUploadError = null;
    }
  }

  async updateUserSettings() {
    if (!this.selectedAvatarFile) return;

    try {
      // Get upload URL
      const { uploadUrl, fileId } = await firstValueFrom(
        this.userService.requestAvatarUpload(this.selectedAvatarFile)
      );

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: this.selectedAvatarFile,
        headers: {
          'Content-Type': this.selectedAvatarFile.type
        }
      });

      // Confirm upload
      const { avatarUrl } = await firstValueFrom(
        this.userService.confirmAvatarUpload(fileId)
      );

      // Update current user's avatar URL
      const currentUser = this.currentUser$.value;
      if (currentUser) {
        currentUser.avatarUrl = avatarUrl;
        this.currentUser$.next(currentUser);
      }

      this.hideUserSettingsModal();
    } catch (error) {
      console.error('Failed to update avatar:', error);
      this.avatarUploadError = 'Failed to upload avatar. Please try again.';
    }
  }

  async removeAvatar() {
    try {
      const { avatarUrl } = await firstValueFrom(this.userService.removeAvatar());
      
      // Update the current user's avatar URL
      const currentUser = this.currentUser$.value;
      if (currentUser) {
        currentUser.avatarUrl = avatarUrl;
        this.currentUser$.next(currentUser);
      }

      this.hideUserSettingsModal();
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      this.avatarUploadError = 'Failed to remove avatar. Please try again.';
    }
  }

  // Add document property for template access
  get document(): Document {
    return document;
  }
} 