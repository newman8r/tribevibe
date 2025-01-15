import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    // Remove trailing slash from apiBaseUrl if it exists
    const baseUrl = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl.slice(0, -1)
      : environment.apiBaseUrl;
    this.apiUrl = `${baseUrl}/admin`;
  }

  getSystemInfo(): Observable<SystemInfo> {
    return this.http.get<SystemInfo>(`${this.apiUrl}/info`);
  }
} 