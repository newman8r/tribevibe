export interface FileAttachment {
  id: string;
  originalName: string;
  displayName?: string;
  type: string;
  size: number;
  url?: string;
  thumbnailUrl?: string | undefined;
  metadata?: {
    description?: string;
    tags?: string[];
  };
} 