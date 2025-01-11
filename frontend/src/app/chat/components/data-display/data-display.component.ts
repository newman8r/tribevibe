import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, state, style, animate, transition } from '@angular/animations';

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
        opacity: 0,
        padding: '0',
        margin: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class DataDisplayComponent implements OnChanges, OnInit {
  @Input() activeType: ExplorerType | null = 'event';
  isExpanded = true;
  youtubeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.youtubeUrl = this.getRandomizedYoutubeUrl();
  }

  ngOnInit() {
    this.activeType = 'event';
    this.isExpanded = true;
  }

  private getRandomizedYoutubeUrl(): SafeResourceUrl {
    // Video is 2:13 long (133 seconds), let's start at a random point
    const maxSeconds = 133;
    const randomStart = Math.floor(Math.random() * maxSeconds);
    const url = `https://www.youtube.com/embed/AkdzXzeiHF4?start=${randomStart}&autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=AkdzXzeiHF4`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Dummy data for each type
  dummyData = {
    event: {
      title: 'Event Information',
      content: 'Neon Nights Festival 2025 - A three-day immersive experience featuring top electronic artists, interactive art installations, and cutting-edge technology displays.'
    },
    map: {
      title: 'Event Map',
      content: 'Interactive venue map showing all stages, facilities, and points of interest. Navigate between the Main Stage, Cyber Stage, and Digital Dreams Arena.'
    },
    directions: {
      title: 'Getting Here',
      content: 'Located at TechPark Plaza. Accessible via public transit (Cyber Line) or car with dedicated parking. Shuttle service available from downtown.'
    },
    setlist: {
      title: 'Festival Lineup',
      content: 'Complete schedule of performances across all stages. Featuring headliners ByteBeats, Digital Dreamers, and Quantum Collective.'
    },
    stream: {
      title: 'Live Streams',
      content: 'Watch live performances from any stage in real-time. Multi-angle views and interactive chat available.'
    },
    photos: {
      title: 'Photo Gallery',
      content: 'Explore professional shots and community uploads from the event. Share your own festival moments with #NeonNights2024.'
    },
    merch: {
      title: 'Merchandise',
      content: 'Official festival merchandise and limited edition collectibles. Pre-order exclusive items for pickup at the venue.'
    },
    tickets: {
      title: 'Ticket Information',
      content: 'Available passes include Single Day, Full Festival, and VIP Experience. Early bird pricing ends soon.'
    },
    gear: {
      title: 'Festival Gear',
      content: 'Essential gear recommendations and rental options. From LED accessories to comfort items for the perfect festival experience.'
    }
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeType'] && changes['activeType'].currentValue) {
      this.isExpanded = true;
      if (changes['activeType'].currentValue === 'event') {
        this.youtubeUrl = this.getRandomizedYoutubeUrl();
      }
    }
  }

  togglePanel() {
    this.isExpanded = !this.isExpanded;
  }
} 