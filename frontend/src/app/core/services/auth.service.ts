import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';
import { SignUpDto, SignInDto, AuthResponse } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private hadPreviousSessionFlag = false;
  private tokenRefreshTimer: any;
  
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
        this.hadPreviousSessionFlag = true;
        if (auth.user) this.currentUserSubject.next(auth.user);
        if (auth.session?.access_token) {
          console.log('Initializing with token:', auth.session.access_token);
          this.accessTokenSubject.next(auth.session.access_token);
          if (auth.session?.refresh_token) {
            this.refreshTokenSubject.next(auth.session.refresh_token);
            this.setupTokenRefresh();
          }
        }
      }
    } catch (error) {
      console.error('Error parsing stored auth data:', error);
      this.clearAuth();
    }
  }

  private setupTokenRefresh(): void {
    // Clear any existing timer
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }

    // Refresh token every 45 minutes (before the 1-hour expiration)
    this.tokenRefreshTimer = setInterval(() => {
      this.refreshToken().subscribe({
        error: (error) => {
          console.error('Error refreshing token:', error);
          this.signOut(); // Sign out if refresh fails
        }
      });
    }, 45 * 60 * 1000); // 45 minutes
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshTokenSubject.value;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.refreshToken(refreshToken).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.signOut();
        return throwError(() => error);
      })
    );
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
    this.hadPreviousSessionFlag = true;
    
    this.currentUserSubject.next(response.user);
    if (response.session?.access_token) {
      this.accessTokenSubject.next(response.session.access_token);
      if (response.session?.refresh_token) {
        this.refreshTokenSubject.next(response.session.refresh_token);
        this.setupTokenRefresh();
      }
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
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    this.clearAuth();
  }

  private clearAuth(): void {
    localStorage.removeItem('auth');
    this.currentUserSubject.next(null);
    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    // Don't reset hadPreviousSessionFlag on logout
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getSessionToken(): string | null {
    return this.accessTokenSubject.value;
  }

  hadPreviousSession(): boolean {
    return this.hadPreviousSessionFlag;
  }
} 