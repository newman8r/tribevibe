import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../core/services/websocket.service';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { ChannelListComponent } from './components/channel-list/channel-list.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { PromoSpaceComponent } from './components/promo-space/promo-space.component';
import { DataDisplayComponent } from './components/data-display/data-display.component';
import { ExplorerType } from './components/data-display/data-display.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [
    CommonModule,
    ExplorerComponent,
    ChannelListComponent,
    ChatWindowComponent,
    UserProfileComponent,
    UserListComponent,
    PromoSpaceComponent,
    DataDisplayComponent
  ],
  standalone: true
})
export class ChatComponent {
  activeExplorerType: ExplorerType = 'event';

  constructor(private websocketService: WebsocketService) {}

  onExplorerItemSelected(type: ExplorerType) {
    this.activeExplorerType = type;
  }
} 