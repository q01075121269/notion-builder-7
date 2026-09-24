// src/services/localTemplateFallback.ts
// AI_DEV_RULES 준수: 은폐형 Fallback Mock 템플릿 전면 폐기 & Fail-Fast 정직 고지 모듈

import type { GeminiConversationResponse, NotionTemplate } from '../types/notion';

export function generateLocalFallbackResponse(
  prompt: string,
  _currentTemplate: NotionTemplate | null
): GeminiConversationResponse {
  // AI_DEV_RULES 제2원칙: 은폐형 가짜(Mock) 우회 금지
  // AI 모델 응답 지연 또는 데이터 부재 시 사전에 정의된 임의의 템플릿(Mock)을 몰래 생성하지 않고
  // 정직하게 안내 메시지를 출력하며 템플릿(canvas)은 null 상태를 유지합니다.
  return {
    mode: 'CONVERSATION_GUIDE',
    explanation: `⚠️ **AI 응답 지연 또는 분석 실패 안내**\n\n요청하신 "${prompt}" 내용에 대한 백엔드 AI 분석 결과가 정상적으로 수신되지 않았거나 유효 데이터가 부족합니다.\n임의의 가짜 템플릿(Mock)을 대신 렌더링하지 않으며, 캔버스 상태를 정직하게 유지합니다. 잠시 후 다시 시도해 주시거나 구체적인 요구사항을 입력해 주세요.`
  };
}

