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
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
  accessToken$ = this.accessTokenSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    try {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        if (auth.user) this.currentUserSubject.next(auth.user);
        if (auth.session?.access_token) {
          console.log('Initializing with token:', auth.session.access_token);
          this.accessTokenSubject.next(auth.session.access_token);
        }
      }
    } catch (error) {
      console.error('Error parsing stored auth data:', error);
      this.clearAuth();
    }
  }

  signUp(data: SignUpDto): Observable<AuthResponse> {
    return this.apiService.signUp(data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  signIn(data: SignInDto): Observable<AuthResponse> {
    return this.apiService.signIn(data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  private handleAuthResponse(response: AuthResponse): void {
    const authData = {
      user: response.user,
      session: response.session
    };
    
    console.log('Handling auth response:', authData);
    localStorage.setItem('auth', JSON.stringify(authData));
    
    this.currentUserSubject.next(response.user);
    if (response.session?.access_token) {
      this.accessTokenSubject.next(response.session.access_token);
    }
  }

  getAccessToken(): string | null {
    const token = this.accessTokenSubject.value;
    console.log('Getting access token:', token);
    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  signOut(): void {
    this.clearAuth();
  }

  private clearAuth(): void {
    localStorage.removeItem('auth');
    this.currentUserSubject.next(null);
    this.accessTokenSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getSessionToken(): string | null {
    return this.accessTokenSubject.value;
  }
} 