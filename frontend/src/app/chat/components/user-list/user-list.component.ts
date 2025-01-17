import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../../core/services/websocket.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { User } from '../../../core/interfaces/user.interface';
import { UserStatus } from '../../../core/interfaces/user-status.enum';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DirectMessageConversation } from '../../../core/interfaces/direct-message-conversation.interface';

// Define interface for user with status and unread count
interface UserWithStatus extends User {
  status: UserStatus;
  unreadCount?: number;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserListComponent implements OnInit, OnDestroy {
  readonly UserStatus = UserStatus;
  
  users: UserWithStatus[] = [];
  groupedUsers: { [key in UserStatus]: UserWithStatus[] } = {
    [UserStatus.ONLINE]: [],
    [UserStatus.AWAY]: [],
    [UserStatus.BUSY]: [],
    [UserStatus.OFFLINE]: []
  };
  
  private subscriptions: Subscription[] = [];
  private unreadCounts: { [conversationId: string]: number } = {};
  private currentUserId: string;
  private conversations: DirectMessageConversation[] = [];
  showDebug = false;

  // Add this property to track user statuses
  private userStatuses = new Map<string, UserStatus>();

  constructor(
    private websocketService: WebsocketService,
    private directMessageService: DirectMessageService,
    private authService: AuthService
  ) {
    // Get either authenticated user ID or anonymous ID
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || 
      localStorage.getItem('anonymousId') || 
      'anonymous-' + Math.random().toString(36).substr(2, 9);
    
    if (!this.currentUserId) {
      console.warn('No user ID found, generating anonymous ID');
      this.currentUserId = 'anonymous-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymousId', this.currentUserId);
    }
  }

  ngOnInit() {
    // Existing user list subscription
    this.websocketService.getUserList();

    this.subscriptions.push(
      this.websocketService.onUserList().subscribe(users => {
        console.log('Received users:', users);
        this.users = users.map(user => ({
          ...user,
          status: user.status as UserStatus
        }));
        this.groupUsers();
      })
    );

    this.subscriptions.push(
      this.websocketService.onUserStatusUpdate().subscribe(({userId, status}) => {
        this.updateUserStatus(userId, status as UserStatus);
      })
    );

    // Subscribe to user conversations
    this.subscriptions.push(
      this.websocketService.onUserConversations().subscribe({
        next: ({ conversations }) => {
          console.log('Received conversations:', conversations);
          this.conversations = conversations;
          this.updateUserUnreadCounts();
          
          // After receiving conversations, request initial unread counts
          this.websocketService.getUnreadCounts(this.currentUserId);
        },
        error: (error) => console.error('Conversation subscription error:', error)
      })
    );

    // Subscribe to new direct messages immediately
    this.subscriptions.push(
      this.websocketService.onNewDirectMessage().subscribe({
        next: (message) => {
          console.log('New DM received:', message);
          // Request updated unread counts when new message arrives
          this.websocketService.getUnreadCounts(this.currentUserId);
          // Also request updated conversations to ensure we have the latest state
          this.websocketService.getUserConversations(this.currentUserId);
        },
        error: (error) => console.error('New DM subscription error:', error)
      })
    );

    // Subscribe to unread counts updates
    this.subscriptions.push(
      this.websocketService.onUnreadCountsUpdate().subscribe({
        next: (counts) => {
          console.log('Received unread counts update:', counts);
          this.unreadCounts = counts;
          this.updateUserUnreadCounts();
        },
        error: (error) => console.error('Unread counts subscription error:', error)
      })
    );

    // Request initial data in sequence
    this.websocketService.getUserList();
    this.websocketService.getUserConversations(this.currentUserId);
    // Initial unread counts will be requested after conversations are received
  }

  private groupUsers() {
    // Initialize groups
    this.groupedUsers = {
      [UserStatus.ONLINE]: [],
      [UserStatus.AWAY]: [],
      [UserStatus.BUSY]: [],
      [UserStatus.OFFLINE]: []
    };

    this.users.forEach(user => {
      // Always put AI users in the online group
      if (user.isAiAgent) {
        this.groupedUsers[UserStatus.ONLINE].push(user);
      } else {
        // Get user status from the map or default to offline
        const status = this.userStatuses.get(user.id) || UserStatus.OFFLINE;
        this.groupedUsers[status].push(user);
      }
    });

    // Sort each group by username
    Object.values(this.groupedUsers).forEach(group => {
      group.sort((a, b) => a.username.localeCompare(b.username));
    });
  }

  private updateUserStatus(userId: string, status: UserStatus) {
    this.userStatuses.set(userId, status);
    this.groupUsers();
  }

  private updateUserUnreadCounts() {
    console.log('=== Starting updateUserUnreadCounts ===');
    console.log('Conversations map:');
    this.conversations.forEach(conv => {
      console.log(`Conversation ${conv.id}:`);
      console.log(`- User1: ${conv.user1.id} (${conv.user1.username})`);
      console.log(`- User2: ${conv.user2.id} (${conv.user2.username})`);
    });
    console.log('Current unread counts:', this.unreadCounts);
    
    // Reset all unread counts first
    this.users = this.users.map(user => ({ ...user, unreadCount: 0 }));

    // Map conversation IDs to the other user's ID
    const conversationToUserMap = new Map<string, string>();
    this.conversations.forEach(conv => {
      // For each conversation, map it to the user that isn't the current user
      const otherUserId = conv.user1.id === this.currentUserId ? conv.user2.id : conv.user1.id;
      conversationToUserMap.set(conv.id, otherUserId);
      console.log(`Mapped conversation ${conv.id} to user ${otherUserId}`);
    });

    // Update unread counts for each conversation
    Object.entries(this.unreadCounts).forEach(([conversationId, count]) => {
      if (count > 0) {
        const otherUserId = conversationToUserMap.get(conversationId);
        if (otherUserId) {
          console.log(`Setting unread count ${count} for user ${otherUserId}`);
          this.users = this.users.map(user => 
            user.id === otherUserId 
              ? { ...user, unreadCount: (user.unreadCount || 0) + count }
              : user
          );
        }
      }
    });

    // Log the results
    const usersWithUnread = this.users.filter(u => u.unreadCount && u.unreadCount > 0);
    console.log('Users with unread messages:', usersWithUnread);

    // Update grouped users
    this.groupUsers();

    // Verify the grouped users
    Object.entries(this.groupedUsers).forEach(([status, users]) => {
      const withUnread = users.filter(u => u.unreadCount && u.unreadCount > 0);
      if (withUnread.length > 0) {
        console.log(`Users with unread in ${status} status:`, withUnread);
      }
    });
  }

  async openDirectMessage(userId: string) {
    this.directMessageService.openDirectMessage(userId);
    // Reset unread count when opening conversation
    const conversations = await this.findConversationByUserId(userId);
    if (conversations) {
      this.websocketService.resetUnreadCount(this.currentUserId, conversations.id);
    }
  }

  private findConversationByUserId(userId: string): Promise<DirectMessageConversation | null> {
    return Promise.resolve(
      this.conversations.find(conv => 
        conv.user1.id === userId || conv.user2.id === userId
      ) || null
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get debugInfo() {
    return {
      groupedUsers: this.groupedUsers,
      unreadCounts: this.unreadCounts,
      currentUserId: this.currentUserId,
      usersWithCounts: this.users.filter(u => u.unreadCount && u.unreadCount > 0)
    };
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
  }
} 