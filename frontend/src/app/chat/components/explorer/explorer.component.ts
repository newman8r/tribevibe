import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ExplorerItem {
  icon: string;
  label: string;
  type: 'map' | 'setlist' | 'stream' | 'photos' | 'merch' | 'tickets' | 'gear' | 'event' | 'directions';
  isNew?: boolean;
  description?: string;
}

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ExplorerComponent {
  @Input() activeType: ExplorerItem['type'] = 'event';
  @Output() itemSelected = new EventEmitter<ExplorerItem['type']>();

  explorerItems: ExplorerItem[] = [
    { 
      icon: '📍', 
      label: 'Event Info', 
      type: 'event',
      description: 'Event details and schedule'
    },
    { 
      icon: '🗺️', 
      label: 'Event Map', 
      type: 'map', 
      isNew: true,
      description: 'Interactive venue layout'
    },
    { 
      icon: '🚗', 
      label: 'Directions', 
      type: 'directions',
      description: 'Getting to the venue'
    },
    { 
      icon: '🎵', 
      label: 'Lineup', 
      type: 'setlist',
      description: 'Performance schedule'
    },
    { 
      icon: '📺', 
      label: 'Live Streams', 
      type: 'stream',
      description: 'Watch live performances'
    },
    { 
      icon: '📸', 
      label: 'Photo & Video', 
      type: 'photos',
      description: 'Event media gallery'
    },
    { 
      icon: '👕', 
      label: 'Gear', 
      type: 'gear',
      description: 'Festival merchandise'
    },
    { 
      icon: '🎟️', 
      label: 'Tickets', 
      type: 'tickets', 
      isNew: true,
      description: 'Purchase tickets'
    }
  ];

  onItemClick(type: ExplorerItem['type']) {
    this.itemSelected.emit(type);
  }
} 