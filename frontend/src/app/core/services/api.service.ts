import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../src/environments/environment';
import { User } from '../interfaces/user.interface';
import { Channel } from '../interfaces/channel.interface';
import { SignUpDto, SignInDto, AuthResponse } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash if present

  constructor(private http: HttpClient) {}

  // Auth endpoints
  signUp(data: SignUpDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/signup`, data);
  }

  signIn(data: SignInDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/signin`, data);
  }

  // User endpoints
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`);
  }

  // Channel endpoints
  createChannel(name: string): Observable<Channel> {
    return this.http.post<Channel>(`${this.API_URL}/channels`, { name });
  }

  getAllChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.API_URL}/channels`);
  }

  getChannel(id: string): Observable<Channel> {
    return this.http.get<Channel>(`${this.API_URL}/channels/${id}`);
  }
} 