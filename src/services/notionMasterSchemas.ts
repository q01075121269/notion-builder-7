// src/services/notionMasterSchemas.ts
// 노션 마스터 데이터베이스 통합 최신 스키마 정의 (웹 앱 기능 100% 동기화 + 에이전트 3.0 품질 게이트 & 감사 로그 연동)

export interface MasterDbSchema {
  name: string;
  icon: string;
  description?: string;
  properties: Record<string, any>;
}

// 공통 품질 게이트 (Quality Gate) 속성 정의
export const QUALITY_GATE_SCHEMA_PROPERTIES = {
  Quality_Status: {
    select: {
      options: [
        { name: '초안', color: 'gray' },
        { name: '검수 중', color: 'yellow' },
        { name: '승인', color: 'green' },
        { name: '반려', color: 'red' }
      ]
    }
  },
  Verified: { checkbox: {} }
};

// 1. 라이프 허브 DB 스키마 (24시간 데일리 일정·할일·루틴 통합)
export const LIFE_HUB_DB_SCHEMA: MasterDbSchema = {
  name: '📅 라이프 허브 (24H 데일리·일정·할일)',
  icon: '📅',
  description: '24시간 일정, 데일리 루틴, 업무 및 개인 할 일을 스마트하게 통합 관리하는 라이프 허브 마스터 DB',
  properties: {
    '이름': { title: {} },
    '일정/날짜': { date: {} },
    '진행 상태': {
      status: {
        options: [
          { name: '대기 중', color: 'gray' },
          { name: '진행 중', color: 'yellow' },
          { name: '완료', color: 'green' },
          { name: '보류/이동', color: 'purple' }
        ]
      }
    },
    '분류': {
      select: {
        options: [
          { name: '일정/약속', color: 'blue' },
          { name: '핵심 할 일', color: 'green' },
          { name: '반복 루틴', color: 'pink' },
          { name: '아이디어', color: 'purple' },
          { name: '지출 메모', color: 'orange' },
          { name: '외근/휴가', color: 'red' }
        ]
      }
    },
    '우선순위': {
      select: {
        options: [
          { name: '🔥 긴급 (P1)', color: 'red' },
          { name: '⚡ 중요 (P2)', color: 'orange' },
          { name: '🌱 일반 (P3)', color: 'blue' }
        ]
      }
    },
    '관련 챕터': {
      select: {
        options: [
          { name: 'Chapter 1: 템플릿 빌더', color: 'blue' },
          { name: 'Chapter 2: 라이프 허브', color: 'green' },
          { name: 'Chapter 3: 오피스 스튜디오', color: 'purple' },
          { name: 'Chapter 4: AI 미디어 랩', color: 'orange' }
        ]
      }
    },
    'Quality_Status': {
      select: {
        options: [
          { name: '초안', color: 'gray' },
          { name: '검수 중', color: 'yellow' },
          { name: '승인', color: 'green' },
          { name: '반려', color: 'red' }
        ]
      }
    },
    'Verified': { checkbox: {} },
    '진행률 Formula': {
      formula: {
        expression: 'if(prop("진행 상태") == "완료", "100% 🟢", if(prop("진행 상태") == "진행 중", "50% 🟡", "0% ⚪"))'
      }
    },
    'AI 메모 & 요약': { rich_text: {} }
  }
};

// 2. 스마트 가계부 DB 스키마 (소비·지출·AI 이상 탐지)
export const EXPENSE_LEDGER_DB_SCHEMA: MasterDbSchema = {
  name: '💰 스마트 가계부 (지출·소비·AI 이상 탐지)',
  icon: '💰',
  description: '지출 항목 자동 분류, 고정비 및 AI 이상 지출 감지 시스템 연동 마스터 가계부 DB',
  properties: {
    '상호명/내역': { title: {} },
    '금액': { number: { format: 'won' } },
    '결제일': { date: {} },
    '지출 카테고리': {
      select: {
        options: [
          { name: '🍔 식비/카페', color: 'orange' },
          { name: '🚗 교통/차량', color: 'blue' },
          { name: '🛍️ 쇼핑/의류', color: 'purple' },
          { name: '🏠 생활/주거', color: 'green' },
          { name: '🎬 문화/여가', color: 'pink' },
          { name: '💊 의료/건강', color: 'red' },
          { name: '⚡ 고정구독/통신', color: 'yellow' },
          { name: '기타', color: 'gray' }
        ]
      }
    },
    '결제 수단': {
      select: {
        options: [
          { name: '신용카드', color: 'blue' },
          { name: '체크카드', color: 'green' },
          { name: '계좌이체/현금', color: 'gray' },
          { name: '간편결제(Pay)', color: 'purple' }
        ]
      }
    },
    '처리 상태': {
      status: {
        options: [
          { name: '결제 완료', color: 'green' },
          { name: '예정/미결제', color: 'yellow' },
          { name: '이상 지출 감지', color: 'red' },
          { name: '취소/환불', color: 'gray' }
        ]
      }
    },
    'Quality_Status': {
      select: {
        options: [
          { name: '초안', color: 'gray' },
          { name: '검수 중', color: 'yellow' },
          { name: '승인', color: 'green' },
          { name: '반려', color: 'red' }
        ]
      }
    },
    'Verified': { checkbox: {} },
    '영수증/캡처 URL': { url: {} },
    'AI 이상 소비 진단 메모': { rich_text: {} }
  }
};

// 3. 템플릿 보관함 DB 스키마 (노션 빌더 & AI 큐레이션)
export const TEMPLATE_ARCHIVE_DB_SCHEMA: MasterDbSchema = {
  name: '🗂️ 템플릿 보관함 (노션 빌더 & 커스텀 생성)',
  icon: '🗂️',
  description: 'AI 오케스트레이터 및 템플릿 빌더에서 커스텀 제작한 노션 템플릿 아카이브 DB',
  properties: {
    '템플릿명': { title: {} },
    '카테고리': {
      select: {
        options: [
          { name: '업무/프로젝트', color: 'blue' },
          { name: '수험/자격증 합격', color: 'green' },
          { name: '라이프/해빗', color: 'orange' },
          { name: '개발/프롬프트', color: 'purple' },
          { name: 'AI 오피스 양식', color: 'pink' }
        ]
      }
    },
    '템플릿 출처': {
      select: {
        options: [
          { name: 'AI 채팅 커스텀 생성', color: 'purple' },
          { name: 'URL 역설계', color: 'blue' },
          { name: '사내 프리셋', color: 'green' }
        ]
      }
    },
    'Quality_Status': {
      select: {
        options: [
          { name: '초안', color: 'gray' },
          { name: '검수 중', color: 'yellow' },
          { name: '승인', color: 'green' },
          { name: '반려', color: 'red' }
        ]
      }
    },
    'Verified': { checkbox: {} },
    '관계형 DB 수': { number: { format: 'number' } },
    'Formulas 2.0 수식': { rich_text: {} },
    '스키마 명세 요약': { rich_text: {} },
    '노션 공유 URL': { url: {} },
    '생성일': { created_time: {} }
  }
};

// 4. AI 오피스 스튜디오 DB 스키마 (Docs · Sheets · Slides)
export const DEV_LAB_DB_SCHEMA: MasterDbSchema = {
  name: '📄 AI 오피스 스튜디오 (Docs·Sheets·Slides)',
  icon: '📄',
  description: '스마트 독스, 시트, 슬라이드 라이브 문서 및 결재 양식 기록 DB',
  properties: {
    '작업/문서명': { title: {} },
    '오피스 문서 타입': {
      select: {
        options: [
          { name: '📄 기안서/품의서 (Gems)', color: 'blue' },
          { name: '📊 지출결의서/시트 (Gems)', color: 'green' },
          { name: '📝 주간보고/제안서 (Genspark)', color: 'purple' },
          { name: '💡 개발 아이디어', color: 'orange' },
          { name: '🐛 버그 트러블슈팅', color: 'red' },
          { name: '🤖 AI 프롬프트 스니펫', color: 'pink' }
        ]
      }
    },
    '생성 엔진': {
      select: {
        options: [
          { name: 'Gems Engine (사내 표준)', color: 'blue' },
          { name: 'Genspark Engine (자유 기획)', color: 'purple' },
          { name: 'Antigravity IDE Auto', color: 'green' }
        ]
      }
    },
    '테스트/검수 상태': {
      status: {
        options: [
          { name: '검수 완료', color: 'green' },
          { name: '작성/테스트 중', color: 'yellow' },
          { name: '개선 필요', color: 'red' }
        ]
      }
    },
    'Quality_Status': {
      select: {
        options: [
          { name: '초안', color: 'gray' },
          { name: '검수 중', color: 'yellow' },
          { name: '승인', color: 'green' },
          { name: '반려', color: 'red' }
        ]
      }
    },
    'Verified': { checkbox: {} },
    '본문 및 소스코드': { rich_text: {} },
    '오류 조치 프롬프트': { rich_text: {} }
  }
};

// 5. AI 미디어 & 지식 스크랩 DB 스키마 (오디오·이미지·웹 스크랩)
export const MEDIA_SCRAP_DB_SCHEMA: MasterDbSchema = {
  name: '🎨 AI 미디어 & 지식 스크랩 (오디오·에셋·아카이브)',
  icon: '🎨',
  description: '출근길 오디오 브리핑, 생성형 이미지/동영상 에셋 및 웹 퀵 스크랩 보관 마스터 DB',
  properties: {
    '에셋/제목': { title: {} },
    '에셋 유형': {
      select: {
        options: [
          { name: '🎧 오디오 브리핑', color: 'blue' },
          { name: '🌙 팟캐스트 대본', color: 'purple' },
          { name: '🖼️ AI 이미지 에셋', color: 'pink' },
          { name: '🎬 AI 동영상 에셋', color: 'orange' },
          { name: '🔗 웹 퀵 캡처', color: 'green' }
        ]
      }
    },
    'Quality_Status': {
      select: {
        options: [
          { name: '초안', color: 'gray' },
          { name: '검수 중', color: 'yellow' },
          { name: '승인', color: 'green' },
          { name: '반려', color: 'red' }
        ]
      }
    },
    'Verified': { checkbox: {} },
    '원본 미디어/웹 URL': { url: {} },
    '핵심 요약 메모': { rich_text: {} },
    '아카이빙 시각': { created_time: {} }
  }
};

// 6. 에이전트 감사 로그 DB 스키마 (Agent_Heartbeat_Log)
export const AGENT_HEARTBEAT_LOG_DB_SCHEMA: MasterDbSchema = {
  name: '🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)',
  icon: '🤖',
  description: '노션 커스텀 에이전트 3.0의 자율 실행 내역, 트리거 로그 및 무손실 무결성 감사 기록 DB',
  properties: {
    '에이전트명': { title: {} },
    '실행시각': { date: {} },
    '실행상태': {
      select: {
        options: [
          { name: '✅ 정상', color: 'green' },
          { name: '⚠️ 경고', color: 'yellow' },
          { name: '❌ 실패', color: 'red' }
        ]
      }
    },
    '처리건수': { number: { format: 'number' } },
    '실행요약': { rich_text: {} },
    '관련 태스크/데이터': { relation: {} }
  }
};

export const ALL_MASTER_SCHEMAS: MasterDbSchema[] = [
  LIFE_HUB_DB_SCHEMA,
  EXPENSE_LEDGER_DB_SCHEMA,
  TEMPLATE_ARCHIVE_DB_SCHEMA,
  DEV_LAB_DB_SCHEMA,
  MEDIA_SCRAP_DB_SCHEMA,
  AGENT_HEARTBEAT_LOG_DB_SCHEMA
];
