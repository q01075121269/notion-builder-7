import type { NotionTemplate } from './notion';

export type ArchiveCategoryType = 'templates' | 'prompts' | 'inspiration';

export interface TemplateFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ArchivedTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  cover_url: string;
  tags: string[];
  templateData: NotionTemplate;
  notionUrl?: string;
  folderId?: string | null;
  source?: 'created' | 'curated';
  createdAt: number;
  updatedAt: number;
}

export type PromptCategory = '프롬프트' | 'JSON스니펫' | '수식코드' | '자동화팁';

export interface PromptSnippet {
  id: string;
  title: string;
  category: PromptCategory;
  content: string;
  description: string;
  tags: string[];
  createdAt: number;
}

export type InspirationCategory = '커버 이미지' | '아이콘/배경' | '레이아웃 영감' | '컬러 팔레트';

export interface InspirationItem {
  id: string;
  title: string;
  imageUrl: string;
  category: InspirationCategory;
  tags: string[];
  sourceUrl?: string;
  author?: string;
  createdAt: number;
}

export interface GoogleSyncConfig {
  googleClientId: string;
  googleCalendarId: string;
  gmailWebhookUrl: string;
  isCalendarConnected: boolean;
  isGmailConnected: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt?: number;
}
