import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  id: string;
  content: string;
  createdAt: Date;
  username: string;
  avatarUrl: string;
  channelId?: string;
  channelName?: string;
  directMessageConversationId?: string;
  userId?: string;
  anonymousId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    // Ensure apiUrl doesn't end with a slash
    this.apiUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  }

  searchMessages(query: string): Observable<SearchResult[]> {
    const url = `${this.apiUrl}/search/messages`;
    console.log('Searching messages with query:', query);
    console.log('Search URL:', url);
    
    return this.http.get<SearchResult[]>(url, {
      params: { q: query }
    }).pipe(
      tap({
        next: (results) => console.log('Search results:', results),
        error: (error) => console.error('Search error:', error)
      })
    );
  }
} 