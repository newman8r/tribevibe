import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { User } from '../../../core/interfaces/user.interface';
import { UserStatus } from '../../../core/interfaces/user-status.enum';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  anonymousId: string;
  anonymousAvatar: string;
  anonymousUsername: string | null = null;
  currentUserStatus: string = 'offline';

  private statusCycle = [
    UserStatus.ONLINE,
    UserStatus.AWAY,
    UserStatus.OFFLINE
  ];

  constructor(
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    // Get or generate anonymous ID
    this.anonymousId = localStorage.getItem('anonymousId') || 
      'anonymous-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousId', this.anonymousId);
    
    // Get stored anonymous username if available
    this.anonymousUsername = localStorage.getItem('anonymousUsername');
    
    // Generate avatar URL for anonymous users
    this.anonymousAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${this.anonymousId}`;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Subscribe to new messages to capture the anonymous username
    if (!this.currentUser && !this.anonymousUsername) {
      this.websocketService.onNewMessage().subscribe(message => {
        if (message.anonymousId === this.anonymousId && message.username) {
          this.anonymousUsername = message.username;
          localStorage.setItem('anonymousUsername', message.username);
        }
      });
    }

    // Subscribe to status updates
    this.websocketService.onUserStatusUpdate().subscribe(({userId, status}) => {
      if (userId === (this.currentUser?.id || this.anonymousId)) {
        this.currentUserStatus = status;
      }
    });
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/auth']);
  }

  cycleStatus(event: Event) {
    event.stopPropagation();
    const currentIndex = this.statusCycle.indexOf(this.currentUserStatus as UserStatus);
    const nextIndex = (currentIndex + 1) % this.statusCycle.length;
    const newStatus = this.statusCycle[nextIndex];
    
    const userId = this.currentUser?.id || this.anonymousId;
    console.log('Updating status to:', newStatus); // Debug log
    this.websocketService.updateManualStatus(userId, newStatus);
  }
} 