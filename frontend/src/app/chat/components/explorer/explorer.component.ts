import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ExplorerItem {
  icon: string;
  label: string;
  type: 'map' | 'setlist' | 'stream' | 'photos' | 'merch' | 'tickets' | 'gear';
  isNew?: boolean;
}

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ExplorerComponent {
  @Output() itemSelected = new EventEmitter<ExplorerItem['type']>();

  explorerItems: ExplorerItem[] = [
    { icon: '🗺️', label: 'Event Map', type: 'map', isNew: true },
    { icon: '🎵', label: 'Lineup', type: 'setlist' },
    { icon: '📺', label: 'Live Streams', type: 'stream' },
    { icon: '📸', label: 'Photo & Video', type: 'photos' },
    { icon: '👕', label: 'Gear', type: 'gear' },
    { icon: '🎟️', label: 'Tickets', type: 'tickets', isNew: true }
  ];

  onItemClick(type: ExplorerItem['type']) {
    this.itemSelected.emit(type);
  }
} 