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

export interface CorpusFile {
  id: string;
  filename: string;
  s3Key: string;
  mimeType: string;
  size: number;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorKnowledgeBase {
  id: string;
  name: string;
  description?: string;
  chunkingStrategy: 'fixed_size' | 'semantic' | 'paragraph';
  chunkingSettings?: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  };
  corpusFiles: CorpusFile[];
  embeddings?: any[];
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

  getUploadUrl(knowledgeBaseId: string, file: File): Observable<{ uploadUrl: string; file: CorpusFile }> {
    return this.http.post<{ uploadUrl: string; file: CorpusFile }>(
      `${this.apiUrl}/vector-knowledge-bases/${knowledgeBaseId}/files`,
      {
        filename: file.name,
        mimeType: file.type || 'text/plain',
        size: file.size
      },
      { headers: this.getAuthHeaders() }
    );
  }

  uploadFileToS3(uploadUrl: string, file: File): Observable<any> {
    // Create a clean HttpClient request without any interceptors
    const xhr = new XMLHttpRequest();
    
    return new Observable(observer => {
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'text/plain');
      xhr.setRequestHeader('x-amz-server-side-encryption', 'AES256');
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          observer.next(xhr.response);
          observer.complete();
        } else {
          observer.error(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        observer.error(new Error('Upload failed'));
      };
      
      xhr.send(file);
      
      // Cleanup on unsubscribe
      return () => {
        if (xhr.readyState !== 4) {
          xhr.abort();
        }
      };
    });
  }

  getCorpusFiles(knowledgeBaseId: string): Observable<CorpusFile[]> {
    return this.http.get<CorpusFile[]>(
      `${this.apiUrl}/vector-knowledge-bases/${knowledgeBaseId}/files`,
      { headers: this.getAuthHeaders() }
    );
  }

  removeCorpusFile(knowledgeBaseId: string, fileId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/vector-knowledge-bases/${knowledgeBaseId}/files/${fileId}`,
      { headers: this.getAuthHeaders() }
    );
  }
} 