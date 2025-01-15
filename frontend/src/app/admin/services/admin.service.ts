import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeyersBriggsType, AiAgentPersonality } from '../interfaces/ai-agent.interface';

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

export interface Channel {
  id: string;
  name: string;
  visible: boolean;
  userCount: number;
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
  personality?: AiAgentPersonality;
}

export interface VectorKnowledgeBase {
  id: string;
  name: string;
  description: string;
  chunkingStrategy: string;
  chunkingSettings: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  };
  associatedFiles: string[];
  createdAt: Date;
  updatedAt: Date;
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

  getAllChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.apiUrl}/channels`, {
      headers: this.getAuthHeaders()
    });
  }

  updateAiAgentPersonality(agentId: string, personality: AiAgentPersonality): Observable<AiAgentPersonality> {
    return this.http.patch<AiAgentPersonality>(
      `${this.apiUrl}/ai-agents/${agentId}/personality`,
      personality,
      { headers: this.getAuthHeaders() }
    );
  }

  addAgentChannel(agentId: string, channelId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/ai-agents/${agentId}/channels`,
      { channelId },
      { headers: this.getAuthHeaders() }
    );
  }

  removeAgentChannel(agentId: string, channelId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/ai-agents/${agentId}/channels/${channelId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  saveAgentChanges(
    agentId: string, 
    personality: AiAgentPersonality,
    channelsToAdd: string[],
    channelsToRemove: string[]
  ): Observable<any> {
    const requests: Observable<any>[] = [];

    if (personality) {
      requests.push(this.updateAiAgentPersonality(agentId, personality));
    }

    channelsToAdd.forEach(channelId => {
      requests.push(this.addAgentChannel(agentId, channelId));
    });

    channelsToRemove.forEach(channelId => {
      requests.push(this.removeAgentChannel(agentId, channelId));
    });

    return forkJoin(requests);
  }

  getAllVectorKnowledgeBases(): Observable<VectorKnowledgeBase[]> {
    return this.http.get<VectorKnowledgeBase[]>(`${this.apiUrl}/vector-knowledge-bases`, {
      headers: this.getAuthHeaders()
    });
  }
} 