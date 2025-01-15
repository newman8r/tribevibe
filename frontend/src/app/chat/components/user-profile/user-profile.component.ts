import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule]
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  currentUserStatus: UserStatus = UserStatus.OFFLINE;
  anonymousUsername: string | null = null;
  anonymousId: string;
  anonymousAvatar: string;
  private statusCycle = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

  constructor(
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService
  ) {
    this.anonymousId = localStorage.getItem('anonymousId') || '';
    this.anonymousAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${this.anonymousId}`;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.websocketService.userStatus$.subscribe((status: UserStatus) => {
      if (status) {
        this.currentUserStatus = status;
      }
    });

    this.websocketService.anonymousUsername$.subscribe((username: string | null) => {
      this.anonymousUsername = username;
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
    const currentIndex = this.statusCycle.indexOf(this.currentUserStatus);
    const nextIndex = (currentIndex + 1) % this.statusCycle.length;
    const newStatus = this.statusCycle[nextIndex];
    
    const userId = this.currentUser?.id || this.anonymousId;
    console.log('Updating status to:', newStatus); // Debug log
    this.websocketService.updateManualStatus(userId, newStatus);
  }
} 