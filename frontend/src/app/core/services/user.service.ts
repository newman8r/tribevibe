import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../interfaces/user.interface';

interface AvatarUploadResponse {
  uploadUrl: string;
  fileId: string;
}

interface AvatarConfirmResponse {
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  requestAvatarUpload(file: File): Observable<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AvatarUploadResponse>(`${this.apiUrl}/users/avatar/request-upload`, formData);
  }

  confirmAvatarUpload(fileId: string): Observable<AvatarConfirmResponse> {
    return this.http.post<AvatarConfirmResponse>(`${this.apiUrl}/users/avatar/confirm`, { fileId });
  }

  removeAvatar(): Observable<AvatarConfirmResponse> {
    return this.http.delete<AvatarConfirmResponse>(`${this.apiUrl}/users/avatar`);
  }

  updateUser(userId: string, updates: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, updates);
  }
} 