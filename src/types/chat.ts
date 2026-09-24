import type { NotionTemplate } from './notion';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessageAttachment {
  name: string;
  category: string;
  sizeFormatted: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  templateData?: NotionTemplate;
  isLoading?: boolean;
  error?: string;
  attachments?: ChatMessageAttachment[];
}

export type GeminiModelType = 
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.8-flash' 
  | 'gemini-3.1-pro' 
  | 'gemini-3.1-thinking'
  | 'auto' 
  | 'gemini-3.6-flash' 
  | 'gemini-2.0-flash' 
  | 'gemini-1.5-flash' 
  | 'gemini-1.5-pro';
