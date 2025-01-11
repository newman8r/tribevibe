import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

export type ExplorerType = 'map' | 'setlist' | 'stream' | 'photos' | 'merch' | 'tickets' | 'gear';

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
export class DataDisplayComponent implements OnChanges {
  @Input() activeType: ExplorerType | null = null;
  isExpanded = false;

  // Dummy data for each type
  dummyData = {
    map: {
      title: 'Event Map',
      content: 'Interactive venue map showing all stages, facilities, and points of interest.'
    },
    setlist: {
      title: 'Festival Lineup',
      content: 'Complete schedule of performances across all stages.'
    },
    stream: {
      title: 'Live Streams',
      content: 'Currently active streams from various stages and events.'
    },
    photos: {
      title: 'Photo Gallery',
      content: 'Recent photos and videos from the event.'
    },
    merch: {
      title: 'Merchandise',
      content: 'Available merchandise and collectibles.'
    },
    tickets: {
      title: 'Ticket Information',
      content: 'Available tickets and passes for upcoming events.'
    },
    gear: {
      title: 'Festival Gear',
      content: 'Essential gear and equipment recommendations.'
    }
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeType'] && changes['activeType'].currentValue) {
      this.isExpanded = true;
    }
  }

  togglePanel() {
    this.isExpanded = !this.isExpanded;
  }
} 