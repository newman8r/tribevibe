import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

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
  private apiUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/files`;

  constructor(private http: HttpClient) {}

  uploadFile(
    file: File,
    metadata: { filename: string; description?: string; tags?: string[] },
    channelId?: string
  ): Observable<string> {
    return this.http
      .post<FileUploadResponse>(`${this.apiUrl}/request-upload`, {
        filename: metadata.filename,
        mimeType: file.type,
        size: file.size,
        channelId
      })
      .pipe(
        switchMap(response => {
          return from(
            fetch(response.uploadUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type
              }
            })
          ).pipe(
            map(uploadResponse => {
              if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to S3');
              }
              return response.fileId;
            })
          );
        }),
        switchMap(fileId => {
          if (file.type.startsWith('image/')) {
            return this.http.post(`${this.apiUrl}/${fileId}/thumbnail`, {}).pipe(
              map(() => fileId)
            );
          }
          return from([fileId]);
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