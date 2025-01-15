import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemInfo {
  system: {
    platform: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
  application: {
    userCount: number;
    databaseSize: string;
    nodeVersion: string;
    processUptime: number;
  };
}

export interface AiAgentDetails {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  channels: {
    id: string;
    name: string;
  }[];
  strategy?: {
    name: string;
    settings: Record<string, any>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const baseUrl = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl.slice(0, -1)
      : environment.apiBaseUrl;
    this.apiUrl = `${baseUrl}/admin`;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getSystemInfo(): Observable<SystemInfo> {
    return this.http.get<SystemInfo>(`${this.apiUrl}/info`, {
      headers: this.getAuthHeaders()
    });
  }

  getAiAgents(): Observable<AiAgentDetails[]> {
    return this.http.get<AiAgentDetails[]>(`${this.apiUrl}/ai-agents`, {
      headers: this.getAuthHeaders()
    });
  }
} 