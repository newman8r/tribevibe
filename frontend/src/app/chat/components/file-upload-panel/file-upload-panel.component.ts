import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../../core/services/file.service';
import { finalize } from 'rxjs/operators';

interface FileUploadMetadata {
  filename: string;
  description?: string;
  tags?: string[];
}

@Component({
  selector: 'app-file-upload-panel',
  templateUrl: './file-upload-panel.component.html',
  styleUrls: ['./file-upload-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FileUploadPanelComponent {
  @Input() isOpen = false;
  @Input() channelId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() uploadComplete = new EventEmitter<string>();
  
  selectedFile: File | null = null;
  metadata = {
    filename: '',
    description: '',
    tags: [] as string[]
  };
  newTag = '';
  dragActive = false;
  isUploading = false;
  uploadError: string | null = null;

  constructor(private fileService: FileService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.selectedFile = file;
    this.metadata.filename = file.name;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragActive = false;
    
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  addTag() {
    if (this.newTag.trim() && !this.metadata.tags?.includes(this.newTag.trim())) {
      this.metadata.tags = [...(this.metadata.tags || []), this.newTag.trim()];
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.metadata.tags = this.metadata.tags?.filter(t => t !== tag);
  }

  onClose() {
    this.selectedFile = null;
    this.metadata = { filename: '', description: '', tags: [] };
    this.close.emit();
  }

  uploadFile() {
    if (!this.selectedFile || !this.metadata.filename) {
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    this.fileService.uploadFile(
      this.selectedFile,
      this.metadata,
      this.channelId
    ).pipe(
      finalize(() => this.isUploading = false)
    ).subscribe({
      next: (fileId) => {
        this.uploadComplete.emit(fileId);
        this.onClose();
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadError = error.message || 'Failed to upload file';
      }
    });
  }
} 