import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  @Output() close = new EventEmitter<void>();
  
  selectedFile: File | null = null;
  metadata: FileUploadMetadata = {
    filename: '',
    description: '',
    tags: []
  };
  newTag = '';
  dragActive = false;

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
    // This will be implemented in the next step
    console.log('File upload triggered:', { file: this.selectedFile, metadata: this.metadata });
  }
} 