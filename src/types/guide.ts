export type GuideAudience = 'general' | 'kids' | 'seniors';

export interface FirstDayStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  actionExample: string;
  calloutBadge?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  tip?: string;
}

export interface BeginnerGuide {
  id: string;
  templateTitle: string;
  targetAudience: GuideAudience;
  headline: string;
  summary: string[]; // 3줄 요약
  firstDaySteps: FirstDayStep[]; // 첫날 딱 3가지만 따라하기
  calendarGuide: {
    title: string;
    description: string;
    steps: string[];
    proTip: string;
  };
  faqs: FAQItem[]; // 자주 묻는 질문
  mermaidFlowchart: string; // Mermaid.js 플로우차트 코드
  cheerMessage: string; // 응원 메시지
  createdAt: number;
}
