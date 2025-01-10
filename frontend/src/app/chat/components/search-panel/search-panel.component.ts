import { Component, EventEmitter, Input, Output, HostListener, ViewChild, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { ChannelStateService } from '../../../core/services/channel-state.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { Channel } from '../../../core/interfaces/channel.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-search-panel',
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SearchPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() jumpToMessage = new EventEmitter<SearchResult>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  searchQuery = '';
  searchResults: SearchResult[] = [];
  isLoading = false;

  constructor(
    private searchService: SearchService,
    private channelStateService: ChannelStateService,
    private directMessageService: DirectMessageService,
    private avatarService: AvatarService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      setTimeout(() => {
        this.searchInput?.nativeElement?.focus();
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed() {
    if (this.isOpen) {
      this.closePanel();
    }
  }

  onSearch(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.searchQuery.trim()) {
      this.performSearch();
    }
  }

  closePanel() {
    this.close.emit();
    // Don't clear results or query to preserve state
  }

  private performSearch() {
    this.isLoading = true;
    this.searchService.searchMessages(this.searchQuery)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (results) => {
          this.searchResults = results;
        },
        error: (error) => {
          console.error('Error searching messages:', error);
          // You might want to show an error message to the user here
        }
      });
  }

  getAvatarUrl(result: SearchResult): string {
    return this.avatarService.getAvatarUrl(result);
  }

  onJumpToMessage(result: SearchResult) {
    if (result.channelId) {
      const channel: Channel = {
        id: result.channelId,
        name: result.channelName || '',
        users: [],  // The channel service will load the actual users
        messages: [] // The channel service will load the actual messages
      };
      this.channelStateService.setSelectedChannel(channel);
    } else if (result.directMessageConversationId) {
      // Open the DM conversation
      // Note: You'll need the user ID for this, which might need to be added to the search results
      // this.directMessageService.openDirectMessage(result.userId);
    }

    // Emit the result for the parent component to handle scrolling
    this.jumpToMessage.emit(result);
    this.closePanel();
  }
} 