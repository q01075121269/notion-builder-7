// src/types/spark.ts
// 젠스파크(Genspark)형 실시간 구글 웹 그라운딩 스파크페이지 데이터 스키마

export interface SparkTakeaway {
  id: number;
  title: string;
  desc: string;
}

export interface SparkHero {
  title: string;
  summary: string;
  confidence: number; // 예: 99.4
  takeaways: SparkTakeaway[];
}

export interface SparkKPI {
  label: string;
  value: string;
  sub: string;
  change: string;
  progress: number; // 0 ~ 100
}

export interface SparkMilestone {
  step: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  desc: string;
  status: '완료' | '진행중' | '대기';
}

export interface SparkStrategy {
  id: 'A' | 'B' | 'C';
  name: string;
  type: string; // '정석 하이브리드' | '완전 자율 무인화' | '초단기 MVP'
  budget: string;
  pros: string;
  cons: string;
}

export interface SparkSource {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface SparkpagePayload {
  topic: string;
  hero: SparkHero;
  kpis: SparkKPI[];
  milestones: SparkMilestone[];
  strategies: SparkStrategy[];
  sources: SparkSource[];
  generatedAt?: string;
}
