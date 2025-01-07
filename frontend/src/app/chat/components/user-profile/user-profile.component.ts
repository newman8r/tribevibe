import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { User } from '../../../core/interfaces/user.interface';

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
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/auth']);
  }
} 