import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../../core/services/websocket.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { User } from '../../../core/interfaces/user.interface';
import { UserStatus } from '../../../core/interfaces/user-status.enum';
import { Subscription } from 'rxjs';

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

  constructor(
    private websocketService: WebsocketService,
    private directMessageService: DirectMessageService
  ) {}

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
  }

  private groupUsers() {
    // Reset groups
    this.groupedUsers = {
      [UserStatus.ONLINE]: [],
      [UserStatus.AWAY]: [],
      [UserStatus.BUSY]: [],
      [UserStatus.OFFLINE]: []
    };

    // Sort users by username within each status group
    this.users.forEach(user => {
      this.groupedUsers[user.status].push(user);
    });

    // Sort each group by username
    Object.values(this.groupedUsers).forEach(group => {
      group.sort((a, b) => a.username.localeCompare(b.username));
    });
  }

  openDirectMessage(userId: string) {
    this.directMessageService.openDirectMessage(userId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
} 