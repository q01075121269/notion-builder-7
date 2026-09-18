export type CaptureMode = 'voice' | 'photo' | 'memo';

export type CaptureIntent = 
  | 'schedule' // 일정 / 캘린더
  | 'expense'  // 가계부 / 지출
  | 'todo'     // 할 일 / 체크리스트
  | 'contact'  // 인맥 / 연락처 / 명함
  | 'idea'     // 독서 / 아이디어 / 메모
  | 'general'; // 일반 메모

export interface RoutedNotionTask {
  id: string;
  intent: CaptureIntent;
  targetDbHint: string; // 예: "일정/캘린더 DB", "가계부/지출 DB"
  title: string;
  summary: string;
  properties: Record<string, any>;
  suggestedIcon?: string;
  tags?: string[];
}

export interface QuickCaptureAnalysisResult {
  rawInput: string;
  correctedText?: string;
  detectedType?: 'receipt' | 'business_card' | 'book_memo' | 'general_text';
  tasks: RoutedNotionTask[];
}

export interface QuickCaptureRecord {
  id: string;
  timestamp: number;
  mode: CaptureMode;
  rawContent: string;
  imageUrl?: string;
  correctedSummary: string;
  tasks: RoutedNotionTask[];
  status: 'sent' | 'local_saved' | 'failed';
  notionPageUrls?: string[];
  errorMessage?: string;
}
