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

export type OfficeDocumentFormat = 'docs' | 'slides' | 'sheets' | 'minutes' | 'mindmap' | 'infographic' | 'briefing';

export interface DocSection {
  id: string;
  level: 1 | 2 | 3 | 4; // 1: 1., 2: □, 3: ○, 4: ―
  marker: string;
  text: string;
}

export type SlideLayoutType =
  | 'barchart'          // 1. [막대 그래프 분석형]
  | 'donut'             // 2. [도넛 비중 차트형]
  | 'kpi-impact'        // 3. [대형 KPI 임팩트형]
  | 'problem-solution'  // 4. [문제 vs 해결 2단 분할형]
  | 'triad-matrix'      // 5. [3-Way 전략 비교 매트릭스형]
  | 'timeline-roadmap'  // 6. [단계별 타임라인 로드맵형]
  | 'bento-dashboard'   // 7. [Bento Grid 복합 대시보드형]
  | 'system-pipeline'   // 8. [시스템 파이프라인형]
  | 'executive-quote'   // 9. [경영진 1-Page 결론 인용형]
  | 'budget-grid';      // 10. [예산/비용 상세 그리드형]

export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  badge?: string;
  layout?: SlideLayoutType;
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
