import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
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
export class ChatComponent implements OnInit {
  @ViewChild(DataDisplayComponent) dataDisplay!: DataDisplayComponent;
  
  activeExplorerType: ExplorerType = 'event';
  showLeftPanel = false;
  showRightPanel = false;
  isMobile = window.innerWidth <= 992;
  lastScrollTop = 0;
  hideNavOnScroll = false;
  isScrolling = false;
  scrollTimeout: any;
  stylesLoaded = false;
  private isClickFromMenu = false;
  private isClickFromToggle = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartedInsidePanel: boolean = false;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit() {
    // Short delay to ensure styles are loaded
    setTimeout(() => {
      this.stylesLoaded = true;
    }, 1000);

    // Set initial state based on screen size
    if (this.isMobile && this.dataDisplay) {
      this.dataDisplay.isExpanded = false;
    }
  }

  @HostListener('window:resize')
  onResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 992;
    
    if (wasMobile && !this.isMobile) {
      // Switching to desktop
      this.showLeftPanel = false;
      this.showRightPanel = false;
      if (this.dataDisplay) {
        this.dataDisplay.isExpanded = true;
      }
    } else if (!wasMobile && this.isMobile) {
      // Switching to mobile
      if (this.dataDisplay) {
        this.dataDisplay.isExpanded = false;
      }
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    if (!this.isMobile) return;

    // If left panel is open, close it on any scroll
    if (this.showLeftPanel) {
      this.closeLeftPanel();
    }

    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    const st = window.pageYOffset || document.documentElement.scrollTop;
    
    // Immediately collapse on scroll down
    if (st > this.lastScrollTop && st > 20) {
      this.hideNavOnScroll = true;
      if (this.dataDisplay) {
        this.dataDisplay.isExpanded = false;
      }
    } else if (st < this.lastScrollTop || st <= 20) {
      this.hideNavOnScroll = false;
      // Don't auto-expand on scroll up, let user control that
    }
    
    this.lastScrollTop = st <= 0 ? 0 : st;
    
    // Set a flag that we're currently scrolling
    this.isScrolling = true;
    
    // Reset the scrolling flag after scrolling stops
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  }

  toggleLeftPanel() {
    if (this.showLeftPanel) {
      this.closeLeftPanel();
    } else {
      this.showLeftPanel = true;
      if (this.isMobile) {
        this.showRightPanel = false;
      }
    }
  }

  toggleRightPanel() {
    this.showRightPanel = !this.showRightPanel;
    if (this.showRightPanel && this.isMobile) {
      this.showLeftPanel = false;
    }
  }

  onExplorerItemSelected(type: ExplorerType) {
    this.activeExplorerType = type;
    if (this.isMobile) {
      this.showRightPanel = false;
      if (this.dataDisplay) {
        this.dataDisplay.isExpanded = true;
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isMobile || !this.showLeftPanel) return;

    const target = event.target as Element;
    const isInsideLeftPanel = target.closest('.left-panel');
    const isMenuButton = target.closest('.menu-button');

    // Only close if click is outside panel and menu button
    if (!isInsideLeftPanel && !isMenuButton) {
      this.closeLeftPanel();
    }
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (!this.isMobile || !this.showLeftPanel) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    
    const target = event.target as Element;
    this.touchStartedInsidePanel = !!target.closest('.left-panel');
    const isMenuButton = target.closest('.menu-button');

    // Only close if touch starts outside panel and menu button
    if (!this.touchStartedInsidePanel && !isMenuButton) {
      this.closeLeftPanel();
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isMobile || !this.showLeftPanel || this.touchStartedInsidePanel) return;

    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const deltaX = touchX - this.touchStartX;
    const deltaY = touchY - this.touchStartY;
    
    // Only close if touch started outside panel and moved significantly
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      this.closeLeftPanel();
    }
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (!this.isMobile || !this.showLeftPanel || this.touchStartedInsidePanel) return;
    
    const target = event.target as Element;
    const isInsideLeftPanel = target.closest('.left-panel');
    const isMenuButton = target.closest('.menu-button');

    // Only close if touch ends outside panel and menu button
    if (!isInsideLeftPanel && !isMenuButton) {
      this.closeLeftPanel();
    }
  }

  private closeLeftPanel() {
    this.showLeftPanel = false;
    this.isClickFromMenu = false;
    this.isClickFromToggle = false;
  }
} 