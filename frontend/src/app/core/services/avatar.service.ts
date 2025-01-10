import { Injectable } from '@angular/core';
import { Message } from '../interfaces/message.interface';
import { User } from '../interfaces/user.interface';
import { SearchResult } from './search.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  getAvatarUrl(entity: Message | User | SearchResult): string {
    // For registered users
    if ('user' in entity && entity.user?.avatarUrl) {
      return entity.user.avatarUrl;
    }
    
    // For user objects directly
    if ('avatarUrl' in entity && entity.avatarUrl) {
      return entity.avatarUrl;
    }
    
    // For anonymous users
    if ('anonymousId' in entity && entity.anonymousId) {
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${entity.anonymousId}`;
    }

    // Fallback to generated avatar using ID
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${entity.id}`;
  }
} 