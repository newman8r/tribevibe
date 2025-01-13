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

  constructor(
    private websocketService: WebsocketService,
    private directMessageService: DirectMessageService,
    private authService: AuthService
  ) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    this.currentUserId = currentUser.id;
  }

  ngOnInit() {
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
        this.users = this.users.map(user => 
          user.id === userId ? { ...user, status: status as UserStatus } : user
        );
        this.groupUsers();
      })
    );

    // Subscribe to user conversations with better error handling
    this.subscriptions.push(
      this.websocketService.onUserConversations().subscribe({
        next: ({ conversations }) => {
          console.log('Received conversations:', conversations);
          this.conversations = conversations;
          
          // Debug each conversation
          conversations.forEach(conv => {
            console.log(`Conversation ${conv.id}:`);
            console.log(`- User1: ${conv.user1.id} (${conv.user1.username})`);
            console.log(`- User2: ${conv.user2.id} (${conv.user2.username})`);
          });
          
          this.updateUserUnreadCounts();
        },
        error: (error) => console.error('Conversation subscription error:', error)
      })
    );

    // Add subscription for new direct messages
    this.subscriptions.push(
      this.websocketService.onNewDirectMessage().subscribe({
        next: (message) => {
          console.log('Processing new DM for unread counts:', message);
          // Request updated unread counts when new message arrives
          this.websocketService.getUnreadCounts(this.currentUserId);
        },
        error: (error) => console.error('New DM subscription error:', error)
      })
    );

    // Modify existing unread counts subscription to show more debug info
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

    // Request initial data
    this.websocketService.getUserList();
    this.websocketService.getUnreadCounts(this.currentUserId);

    // Make sure we're requesting conversations
    this.websocketService.getUserConversations(this.currentUserId);
  }

  private groupUsers() {
    // Create new object to force change detection
    const newGroupedUsers: { [key in UserStatus]: UserWithStatus[] } = {
      [UserStatus.ONLINE]: [],
      [UserStatus.AWAY]: [],
      [UserStatus.BUSY]: [],
      [UserStatus.OFFLINE]: []
    };

    // Group users while preserving unread counts
    this.users.forEach(user => {
      // Create a new user object with the unread count
      const userWithCount: UserWithStatus = {
        ...user,
        unreadCount: user.unreadCount || 0
      };
      newGroupedUsers[user.status].push(userWithCount);
    });

    // Sort each group
    Object.values(newGroupedUsers).forEach(group => {
      group.sort((a, b) => a.username.localeCompare(b.username));
    });

    // Update the grouped users
    this.groupedUsers = newGroupedUsers;
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