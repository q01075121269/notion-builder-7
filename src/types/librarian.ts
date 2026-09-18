export interface NotionSourceReference {
  id: string;
  title: string;
  url: string;
  icon?: string;
  lastEditedTime?: string;
  snippet?: string;
}

export interface SmartLibrarianAnswer {
  question: string;
  answer: string;
  sources: NotionSourceReference[];
  confidence: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface AggregatedPeriodStats {
  periodDays: number; // 7 또는 30
  periodLabel: string; // 예: "최근 7일간의 데이터", "최근 30일간의 데이터"
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    delayed: number;
    completionRate: number; // 0 ~ 100
  };
  expenses: {
    totalAmount: number;
    transactionCount: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  habitsAndMemos: {
    totalRecords: number;
    topKeywords: string[];
    sentimentSummary: string;
  };
}

export interface SettlementReport {
  title: string;
  periodLabel: string;
  summaryHighlights: string[]; // 3줄 핵심 하이라이트
  charts: {
    taskProgressBar: string; // 유니코드 게이지 예: "■■■■■■■■□□ 80%"
    topExpenseBar: string;
  };
  goodPoints: string[]; // 잘한 점 2가지
  actionPlans: string[]; // 다음 주/달을 위한 추천 액션 플랜 3가지
  rawStats: AggregatedPeriodStats;
  createdAt: number;
}
