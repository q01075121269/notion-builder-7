// src/services/notionMasterSchemas.ts
// 노션 3대 마스터 데이터베이스 스키마 정의 (65줄 최적화)

export interface MasterDbSchema {
  name: string;
  icon: string;
  properties: Record<string, any>;
}

// 1. 라이프 허브 DB 스키마 (퀵 캡처 & 개인 비서용)
export const LIFE_HUB_DB_SCHEMA: MasterDbSchema = {
  name: '📅 라이프 허브 (일정·할일·지출)',
  icon: '📅',
  properties: {
    '이름': { title: {} },
    '일정': { date: {} },
    '상태': {
      status: {
        options: [
          { name: '미완료', color: 'gray' },
          { name: '진행 중', color: 'yellow' },
          { name: '완료', color: 'green' }
        ]
      }
    },
    '분류': {
      select: {
        options: [
          { name: '일정', color: 'blue' },
          { name: '할 일', color: 'green' },
          { name: '아이디어', color: 'purple' },
          { name: '지출', color: 'orange' },
          { name: '메모', color: 'gray' }
        ]
      }
    },
    'AI 메모': { rich_text: {} }
  }
};

// 2. 템플릿 보관함 DB 스키마 (노션 빌더용)
export const TEMPLATE_ARCHIVE_DB_SCHEMA: MasterDbSchema = {
  name: '🗂️ 템플릿 보관함 (노션 빌더)',
  icon: '🗂️',
  properties: {
    '템플릿명': { title: {} },
    '카테고리': {
      select: {
        options: [
          { name: '업무', color: 'blue' },
          { name: '학습', color: 'green' },
          { name: '라이프', color: 'orange' },
          { name: '프로젝트', color: 'purple' }
        ]
      }
    },
    '스키마 요약': { rich_text: {} },
    '생성일': { created_time: {} }
  }
};

// 3. 개발 랩 DB 스키마 (프롬프트 & 개발용)
export const DEV_LAB_DB_SCHEMA: MasterDbSchema = {
  name: '🔬 개발 랩 (프롬프트·테스트)',
  icon: '🔬',
  properties: {
    '작업명': { title: {} },
    '프롬프트': { rich_text: {} },
    '테스트 결과': {
      select: {
        options: [
          { name: '성공', color: 'green' },
          { name: '개선 필요', color: 'yellow' },
          { name: '테스트 대기', color: 'gray' }
        ]
      }
    },
    '연동 모듈': {
      multi_select: {
        options: [
          { name: 'Gemini', color: 'blue' },
          { name: 'Napkin AI', color: 'purple' },
          { name: 'Notion API', color: 'orange' }
        ]
      }
    }
  }
};

// 4. 가계부 DB 스키마 (소비 & 지출 관리용)
export const EXPENSE_LEDGER_DB_SCHEMA: MasterDbSchema = {
  name: '💰 가계부 (지출·소비 내역)',
  icon: '💰',
  properties: {
    '상호명': { title: {} },
    '금액': { number: { format: 'won' } },
    '결제일': { date: {} },
    '분류': {
      select: {
        options: [
          { name: '식비', color: 'orange' },
          { name: '교통', color: 'blue' },
          { name: '쇼핑', color: 'purple' },
          { name: '생활/주거', color: 'green' },
          { name: '문화/여가', color: 'pink' },
          { name: '기타', color: 'gray' }
        ]
      }
    },
    '상태': {
      status: {
        options: [
          { name: '결제 완료', color: 'green' },
          { name: '예정/미결제', color: 'yellow' },
          { name: '취소/환불', color: 'red' }
        ]
      }
    },
    'AI 메모': { rich_text: {} }
  }
};
