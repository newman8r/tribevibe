import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';
import { SignUpDto, SignInDto, AuthResponse } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionTokenSubject = new BehaviorSubject<string | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  sessionToken$ = this.sessionTokenSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedToken = localStorage.getItem('sessionToken');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          this.currentUserSubject.next(parsedUser);
        }
      }
      
      if (storedToken) {
        this.sessionTokenSubject.next(storedToken);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      this.clearStorage();
    }
  }

  signUp(data: SignUpDto): Observable<AuthResponse> {
    return this.apiService.signUp(data).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  signIn(data: SignInDto): Observable<AuthResponse> {
    return this.apiService.signIn(data).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  private setSession(response: AuthResponse): void {
    if (response.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
    
    if (response.session?.access_token) {
      localStorage.setItem('sessionToken', response.session.access_token);
      this.sessionTokenSubject.next(response.session.access_token);
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('anonymousId');
    localStorage.removeItem('anonymousUsername');
    this.currentUserSubject.next(null);
    this.sessionTokenSubject.next(null);
  }

  signOut(): void {
    this.clearStorage();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getSessionToken(): string | null {
    return this.sessionTokenSubject.value;
  }
} 