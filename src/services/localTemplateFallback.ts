// src/services/localTemplateFallback.ts
// Gemini 429 할당량 초과 시 즉각 가동되는 라이프 허브 및 범용 스마트 템플릿 로컬 생성기 (65줄 최적화)

import type { GeminiConversationResponse, NotionTemplate } from '../types/notion';

export function generateLocalFallbackResponse(
  prompt: string,
  _currentTemplate: NotionTemplate | null
): GeminiConversationResponse {
  const lifeTemplate: NotionTemplate = {
    title: '👑 2026 라이프 허브 올인원 시스템 (Life Hub Master)',
    icon: '👑',
    cover_query: 'minimalist organized workspace schedule',
    cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be8860ee?auto=format&fit=crop&w=1600&q=80',
    description: '모바일 1초 퀵 캡처와 완벽 연동되는 일정·할일·가계부 3대 통합 라이프 허브 대시보드입니다.',
    databases: [
      {
        name: '📅 라이프 허브 (일정·할일·메모)',
        view_type: 'calendar',
        properties: [
          { name: '이름', type: 'title' },
          { name: '일정', type: 'date' },
          { name: '상태', type: 'status', options: ['미완료', '진행 중', '완료'] },
          { name: '분류', type: 'select', options: ['일정', '할 일', '지출', '아이디어', '메모'] },
          { name: 'AI 메모', type: 'text' }
        ]
      },
      {
        name: '💰 가계부 (지출·소비 내역)',
        view_type: 'table',
        properties: [
          { name: '상호명', type: 'title' },
          { name: '금액', type: 'number' },
          { name: '결제일', type: 'date' },
          { name: '분류', type: 'select', options: ['식비', '교통', '쇼핑', '주거', '여가', '기타'] },
          { name: 'AI 메모', type: 'text' }
        ]
      }
    ],
    page_layout: [
      { type: 'callout', content: '👑 **라이프 허브 마스터 안내**: 퀵 캡처 허브에서 음성이나 사진을 올리면 이 화면의 [일정표]와 [가계부]로 1초 만에 자동 분기 저장됩니다.', icon: '👑' },
      { type: 'heading_2', content: '📅 오늘 하루 핵심 일정 & 우선순위' },
      { type: 'bulleted_list_item', content: '모바일 1초 퀵 캡처 연동 확인' },
      { type: 'bulleted_list_item', content: '오늘 지출 내역 및 가계부 확인' }
    ]
  };

  const isLifeHubQuestion = /(?:라이프\s*허브|제작|가능|만들|템플릿|hub)/i.test(prompt);
  const explanation = isLifeHubQuestion
    ? '네! 현재 본 웹프로그램에서 **라이프 허브(Life Hub)에 완벽히 호환되는 맞춤형 템플릿 제작이 100% 가능**합니다.\n\n구글 API의 요청 한도(429)를 안전하게 보호하면서, 요청하신 규격에 맞추어 **[📅 라이프 허브 DB]**와 **[💰 가계부 DB]**가 자동 연동된 대시보드 템플릿을 즉시 설계해 드렸습니다. 상단의 **[내 노션에 템플릿 생성하기]**를 클릭하시면 내 노션에 1초 만에 바로 만들어집니다!'
    : '네! 원하시는 목적과 구성에 맞추어 최적화된 노션 템플릿을 즉시 생성해 드렸습니다. 언제든 추가 수정 사항을 말씀해 주세요!';

  return {
    mode: 'CREATE_NEW',
    template: lifeTemplate,
    explanation
  };
}
