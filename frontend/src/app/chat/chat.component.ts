import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../core/services/websocket.service';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/interfaces/user.interface';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { ChannelListComponent } from './components/channel-list/channel-list.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { SocialHubComponent } from './components/social-hub/social-hub.component';
import { PromoSpaceComponent } from './components/promo-space/promo-space.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [
    CommonModule,
    ExplorerComponent,
    ChannelListComponent,
    ChatWindowComponent,
    SocialHubComponent,
    PromoSpaceComponent
  ],
  standalone: true
})
export class ChatComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private websocketService: WebsocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
} 