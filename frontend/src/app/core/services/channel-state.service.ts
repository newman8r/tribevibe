import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Channel } from '../interfaces/channel.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelStateService {
  private selectedChannelSubject = new BehaviorSubject<Channel | null>(null);
  selectedChannel$ = this.selectedChannelSubject.asObservable();

  setSelectedChannel(channel: Channel) {
    this.selectedChannelSubject.next(channel);
  }

  getSelectedChannel() {
    return this.selectedChannelSubject.value;
  }
} 