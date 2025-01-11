import { Component, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type ExplorerType = 'map' | 'setlist' | 'stream' | 'photos' | 'merch' | 'tickets' | 'gear' | 'event' | 'directions';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  styleUrls: ['./data-display.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('panelState', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        padding: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1'
      })),
      transition('expanded <=> collapsed', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class DataDisplayComponent implements OnInit {
  @Input() activeType: ExplorerType = 'event';
  isExpanded = true;
  isMobile = window.innerWidth <= 992;
  youtubeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.youtubeUrl = this.getRandomizedYoutubeUrl();
  }

  ngOnInit() {
    // Set initial state based on screen size
    this.isExpanded = !this.isMobile;
  }

  @HostListener('window:resize')
  onResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 992;
    
    // Collapse when transitioning to mobile
    if (!wasMobile && this.isMobile) {
      this.isExpanded = false;
    }
    // Expand when transitioning to desktop
    else if (wasMobile && !this.isMobile) {
      this.isExpanded = true;
    }
  }

  togglePanel() {
    this.isExpanded = !this.isExpanded;
  }

  private getRandomizedYoutubeUrl(): SafeResourceUrl {
    const videoId = 'AkdzXzeiHF4';
    const startTime = Math.floor(Math.random() * 300); // Random start time between 0-300 seconds
    const url = `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  readonly dummyData = {
    event: {
      title: 'Event Information',
      content: 'Welcome to Neon Nights 2025, the most immersive cyberpunk music festival experience. Featuring groundbreaking artists, interactive installations, and cutting-edge technology integrations across multiple stages.'
    },
    map: {
      title: 'Festival Map',
      content: 'Interactive map showing all stages, facilities, and points of interest.'
    },
    directions: {
      title: 'Getting There',
      content: 'Multiple transportation options available including automated shuttles and designated landing pads for flying vehicles.'
    },
    setlist: {
      title: 'Performance Schedule',
      content: 'Complete lineup and timing information for all stages.'
    },
    stream: {
      title: 'Live Streams',
      content: 'Watch live performances from any stage in real-time.'
    },
    photos: {
      title: 'Photo Gallery',
      content: 'Captured moments from previous events and current installations.'
    },
    merch: {
      title: 'Merchandise',
      content: 'Official festival merchandise and exclusive collectibles.'
    },
    tickets: {
      title: 'Tickets',
      content: 'Purchase tickets and VIP packages for the festival.'
    },
    gear: {
      title: 'Festival Gear',
      content: 'Essential gear and accessories for the festival experience.'
    }
  };
} 