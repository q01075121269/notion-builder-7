export type FileTypeCategory = 
  | 'spreadsheet' 
  | 'document' 
  | 'pdf' 
  | 'image' 
  | 'hwp' 
  | 'unsupported';

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  formulas: Array<{ cell: string; formula: string }>;
  markdownTable: string;
  rowCount: number;
}

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  category: FileTypeCategory;
  mimeType: string;
  previewUrl?: string; // 이미지인 경우 썸네일 미리보기용
  base64?: string; // 이미지 Gemini Vision API 전송용 순수 base64
  parsedContent?: string; // 텍스트/마크다운 추출 결과
  sheets?: ParsedSheetData[]; // 스프레드시트 시트별 파싱 데이터
  summaryBadge?: string;
  isParsing: boolean;
  error?: string;
  isUnsupportedHwp?: boolean;
  isTooShort?: boolean;
  warning?: string;
}

export interface FileContextItem {
  fileName: string;
  extension: string;
  category: FileTypeCategory;
  parsedContent?: string;
  textContent?: string;
  sheets?: ParsedSheetData[];
  summaryBadge?: string;
}

