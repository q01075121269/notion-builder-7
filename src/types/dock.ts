// src/types/dock.ts
// 만능 Noa 커맨드 독(Universal Command Dock) 데이터 규격 정의

export interface DockAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'document' | 'audio';
  previewUrl?: string;
}

export interface DockPayload {
  text: string;
  attachments: DockAttachment[];
  timestamp: number;
}
