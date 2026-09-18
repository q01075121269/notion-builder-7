// src/plugins/types.ts
// AI 플러그인 시스템의 표준화된 입출력 규격 및 인터페이스 정의

import type { NotionTemplate, GeminiConversationResponse } from '../types/notion';
import type { AttachedFile } from '../types/fileAttachment';
import type { ChatMessage } from '../types/chat';

/** AI 모듈이 지원하는 핵심 기능 유형 */
export type PluginCapability = 
  | 'TEMPLATE_BUILD'      // 노션 템플릿 생성/수정
  | 'DIAGRAM_GENERATION'  // 시각화 도식/다이어그램 (냅킨 AI 등)
  | 'CONVERSATION'        // 일반 사용자 가이드 및 질의응답
  | 'DOCUMENT_PARSING';   // 문서 데이터 역설계 분석

/** 모든 AI 플러그인이 받아들이는 표준 요청 규격 */
export interface AIPluginRequest {
  prompt: string;
  apiKey?: string;
  currentTemplate?: NotionTemplate | null;
  attachedFiles?: AttachedFile[];
  chatHistory?: ChatMessage[];
  options?: Record<string, any>;
}

/** 모든 AI 플러그인이 반환하는 표준 응답 규격 */
export interface AIPluginResponse {
  success: boolean;
  pluginId: string;
  result?: GeminiConversationResponse | Record<string, any>;
  errorMessage?: string;
  metadata?: {
    latencyMs?: number;
    tokensUsed?: number;
    modelName?: string;
  };
}

/** 모든 AI 도구가 반드시 준수해야 하는 추상 인터페이스 */
export interface IAIPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: PluginCapability[];

  /** 플러그인 실행 메서드 */
  execute(request: AIPluginRequest): Promise<AIPluginResponse>;
  
  /** 헬스체크 및 설정 검증 (선택) */
  validateConfig?(apiKey?: string): boolean;
}
