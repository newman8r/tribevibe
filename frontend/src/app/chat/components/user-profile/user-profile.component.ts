import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { User } from '../../../core/interfaces/user.interface';
import { UserStatus } from '../../../core/interfaces/user-status.enum';
import { UserService } from '../../../core/services/user.service';
import { firstValueFrom } from 'rxjs';

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

  // Add new properties for settings modal
  showSettingsModal = false;
  selectedAvatarFile: File | null = null;
  avatarUploadError: string | null = null;
  hasUnsavedChanges = false;

  // Add document property for template access
  get document(): Document {
    return document;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService,
    private userService: UserService
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

  getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ONLINE:
        return '#44b700';
      case UserStatus.AWAY:
        return '#ffa500';
      case UserStatus.BUSY:
        return '#ff0000';
      case UserStatus.OFFLINE:
        return '#808080';
      default:
        return 'transparent';
    }
  }

  // Add new methods for settings modal
  openSettingsModal() {
    this.showSettingsModal = true;
  }

  closeSettingsModal() {
    this.showSettingsModal = false;
    this.selectedAvatarFile = null;
    this.avatarUploadError = null;
    this.hasUnsavedChanges = false;
  }

  async onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        this.avatarUploadError = 'File size must be less than 5MB';
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.avatarUploadError = 'File must be an image';
        return;
      }

      this.selectedAvatarFile = file;
      this.hasUnsavedChanges = true;
      this.avatarUploadError = null;
    }
  }

  async updateSettings() {
    if (!this.selectedAvatarFile) return;

    try {
      const { uploadUrl, fileId } = await firstValueFrom(
        this.userService.requestAvatarUpload(this.selectedAvatarFile)
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        body: this.selectedAvatarFile,
        headers: {
          'Content-Type': this.selectedAvatarFile.type
        }
      });

      const { avatarUrl } = await firstValueFrom(
        this.userService.confirmAvatarUpload(fileId)
      );

      if (this.currentUser) {
        this.currentUser.avatarUrl = avatarUrl;
      }

      this.closeSettingsModal();
    } catch (error) {
      console.error('Failed to update avatar:', error);
      this.avatarUploadError = 'Failed to upload avatar. Please try again.';
    }
  }

  async removeAvatar() {
    try {
      const { avatarUrl } = await firstValueFrom(this.userService.removeAvatar());
      
      if (this.currentUser) {
        this.currentUser.avatarUrl = avatarUrl;
      }

      this.closeSettingsModal();
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      this.avatarUploadError = 'Failed to remove avatar. Please try again.';
    }
  }
} 