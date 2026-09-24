export type OfficeSourceType = 'file' | 'url' | 'voice' | 'deep_research';

export interface OfficeSource {
  id: string;
  title: string;
  type: OfficeSourceType;
  content: string;
  url?: string;
  tokenCount: number;
  createdAt: string;
  isSelected?: boolean;
  fileSize?: string;
  summary?: string;
}

export interface PlanOption {
  title: string;
  concept: string;
  target: string;
  pricing: string;
  pros: string;
  cons: string;
  roadmap: string[];
}

export interface PlanTriad {
  optionA: PlanOption; // 정석·안정형
  optionB: PlanOption; // 파격·혁신형
  optionC: PlanOption; // 실속·초고속 MVP
  selectedOption?: 'A' | 'B' | 'C';
}

export type OfficeDocumentFormat = 'docs' | 'slides' | 'sheets' | 'minutes';

export interface DocSection {
  id: string;
  level: 1 | 2 | 3 | 4; // 1: 1., 2: □, 3: ○, 4: ―
  marker: string;
  text: string;
}

export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  badge?: string;
}

export interface SheetRow {
  id: string;
  cells: (string | number)[];
}

export interface OfficeCitation {
  id: string;
  sourceId: string;
  sourceTitle: string;
  textQuote: string;
  pageOrLine: string;
}

export interface DocumentHistoryEntry {
  action: string;
  timestamp: string;
  snapshot: any;
}

export interface OfficeDocument {
  id: string;
  projectId: string;
  title: string;
  format: OfficeDocumentFormat;
  metadata: {
    author: string;
    department: string;
    approvers: string[];
    docNumber: string;
    date: string;
  };
  content: {
    docsContent: {
      sections: DocSection[];
    };
    slidesContent: {
      slides: SlideItem[];
    };
    sheetsContent: {
      headers: string[];
      rows: SheetRow[];
      hasTotalRow?: boolean;
      totalFormula?: string;
    };
    citations: OfficeCitation[];
  };
  history: DocumentHistoryEntry[];
}

export interface OfficeProject {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  sources: OfficeSource[];
  currentDoc: OfficeDocument;
  planTriad?: PlanTriad;
}

export type CanvasViewMode = 'triad' | 'canvas';
