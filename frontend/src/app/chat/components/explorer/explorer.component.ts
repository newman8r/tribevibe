import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ExplorerItem {
  icon: string;
  label: string;
  type: 'map' | 'setlist' | 'stream' | 'photos' | 'merch' | 'tickets';
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
  explorerItems: ExplorerItem[] = [
    { icon: '🗺️', label: 'Tour Map', type: 'map', isNew: true },
    { icon: '🎵', label: 'Setlists', type: 'setlist' },
    { icon: '📺', label: 'Live Streams', type: 'stream' },
    { icon: '📸', label: 'Photo Albums', type: 'photos' },
    { icon: '👕', label: 'Merch', type: 'merch' },
    { icon: '🎟️', label: 'Tickets', type: 'tickets', isNew: true }
  ];
} 