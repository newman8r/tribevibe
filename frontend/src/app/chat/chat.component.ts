import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../core/services/websocket.service';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { ChannelListComponent } from './components/channel-list/channel-list.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { SocialHubComponent } from './components/social-hub/social-hub.component';
import { PromoSpaceComponent } from './components/promo-space/promo-space.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

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
    PromoSpaceComponent,
    UserProfileComponent
  ],
  standalone: true
})
export class ChatComponent {
  constructor(private websocketService: WebsocketService) {}
} 