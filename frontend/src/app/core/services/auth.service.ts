import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';
import { SignUpDto, SignInDto } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Initialize user from localStorage if available
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          this.currentUserSubject.next(parsedUser);
        } else {
          // Invalid user object, clear it
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
    }
  }

  signUp(data: SignUpDto): Observable<any> {
    return this.apiService.signUp(data).pipe(
      tap(response => {
        this.setCurrentUser(response.user);
      })
    );
  }

  signIn(data: SignInDto): Observable<any> {
    return this.apiService.signIn(data).pipe(
      tap(response => {
        this.setCurrentUser(response.user);
      })
    );
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  signOut(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
} 