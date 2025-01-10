import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface FileUploadResponse {
  uploadUrl: string;
  fileId: string;
}

export interface FileMetadata {
  url: string;
  thumbnailUrl: string | null;
  metadata: {
    type: string;
    size: number;
    mimeType: string;
    displayName: string;
    description: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/files`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  uploadFile(
    file: File,
    metadata: { filename: string; description?: string; tags?: string[] },
    channelId?: string
  ): Observable<string> {
    // Debug log
    console.log('Current token:', this.authService.getAccessToken());

    // First request to get the presigned URL
    return this.http.post<FileUploadResponse>(`${this.apiUrl}/request-upload`, {
      filename: metadata.filename,
      mimeType: file.type,
      size: file.size,
      channelId,
      metadata: {
        description: metadata.description,
        tags: metadata.tags
      }
    }).pipe(
      switchMap(response => {
        // Upload to S3 using the presigned URL
        return from(
          fetch(response.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
              'x-amz-server-side-encryption': 'AES256'
            },
            mode: 'cors'
          })
        ).pipe(
          map(uploadResponse => {
            if (!uploadResponse.ok) {
              console.error('S3 upload failed:', uploadResponse);
              throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
            }
            return response.fileId;
          })
        );
      }),
      // Generate thumbnail if it's an image
      switchMap(fileId => {
        if (file.type.startsWith('image/')) {
          return this.http.post(`${this.apiUrl}/${fileId}/thumbnail`, {}).pipe(
            map(() => fileId)
          );
        }
        return from([fileId]);
      }),
      // Update metadata
      switchMap(fileId => {
        return this.http.patch(`${this.apiUrl}/${fileId}`, {
          displayName: metadata.filename,
          description: metadata.description,
          metadata: {
            tags: metadata.tags
          }
        }).pipe(
          map(() => fileId)
        );
      }),
      catchError(error => {
        console.error('File upload failed:', error);
        return throwError(() => new Error('Failed to upload file'));
      })
    );
  }

  getFileUrl(fileId: string): Observable<FileMetadata> {
    return this.http.get<FileMetadata>(`${this.apiUrl}/${fileId}/url`);
  }
} 