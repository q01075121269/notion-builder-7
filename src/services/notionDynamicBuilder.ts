// src/services/notionDynamicBuilder.ts
// AI 에이전트 payload 및 사용자 입력을 수신하여 완전한 NotionTemplate 객체로 동적 인스턴스화

import type {
  NotionTemplate,
  NotionDatabase,
  NotionBlock,
  AgentBlueprint
} from '../types/notion';

/**
 * 템플릿 제목 이스케이프 및 정동화(Sanitize)
 */
export function sanitizeTemplateTitle(rawTitle?: string, fallback = '마스터 워크스페이스'): string {
  if (!rawTitle) return fallback;
  const cleaned = rawTitle
    .replace(/^["'‘“`]+|["'’”`]+$/g, '')
    .replace(/[\[\]]/g, '')
    .trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * 동적 에이전트 블루프린트 생성 함수
 */
function buildDynamicAgentBlueprint(title: string, description?: string): AgentBlueprint {
  return {
    version: '3.0',
    persona: {
      role: `${title} 전담 오토메이션 에이전트`,
      objective: description || `${title} 데이터 수집, 검증, 상태 추적 및 자동 보고서 생성`,
      scope: `${title} 관련 모든 데이터베이스 및 실행 워크플로우`
    },
    multiTriggers: {
      schedule: '0 9 * * * (매일 오전 9시 정기 검수)',
      notionEvents: ['페이지 생성 시', '상태 변경 시', '속성 업데이트 시'],
      externalEvents: ['웹훅 알림 수신', '외부 API 데이터 변경']
    },
    skills: [
      {
        id: 'skill-1',
        name: '데이터 자동 검증 및 분류',
        trigger: '신규 데이터 등록 시',
        targetDb: `${title} 마스터 트래커`,
        logic: '필수 속성 누락 여부 확인 및 데이터 무결성 검증',
        action: '상태 속성 업데이트 및 알림 발송'
      },
      {
        id: 'skill-2',
        name: '정기 상태 리포트 생성',
        trigger: '매주 월요일 오전 9시',
        targetDb: `${title} 상세 실행 항목`,
        logic: '지난 주 미완료/지연 항목 집계 및 성과 달성률 계산',
        action: '요약 보고서 블록 자동 생성'
      }
    ],
    subAgents: [
      {
        name: '데이터 릴레이터',
        role: '연관 DB 간 관계성 및 수식 자동 동기화',
        responsibility: 'Relation 및 Rollup 속성 상호 연결 유지'
      },
      {
        name: '품질 모니터',
        role: '데이터 품질 검수 및 상태 레이블 지정',
        responsibility: 'Quality_Status 및 Verified 속성 검증'
      }
    ],
    workslopGuardrails: {
      doneDefinition: [
        '모든 mandatory 속성 값이 정상 입력됨',
        '연관 데이터베이스 간 관계가 올바르게 매핑됨',
        'AI 검증 절차(Verified) 완료'
      ],
      verifiedSourcesOnly: true,
      verificationMetrics: ['속성 입력 완성도 100%', '오류 및 누락 항목 0건'],
      verificationTableMarkdown: '| 검수 항목 | 상태 | 검수 기준 |\n| --- | --- | --- |\n| 필수 속성 | 정상 | 누락 없음 |\n| 연관 관계 | 정상 | Relation 정상 연결 |\n| 데이터 품질 | Verified | AI 검증 통과 |'
    },
    setupPromptMarkdown: `### 🤖 ${title} 전담 에이전트 3.0 프롬프트 사양\n\n- **역할**: ${title} 워크스페이스 데이터 관리 및 프로세스 자동화\n- **목표**: ${description || `${title} 수집, 분석 및 실시간 모니터링`}\n- **주요 기능**: 데이터 무결성 검수, 정기 알림, 자동 상태 업데이트`
  };
}

/**
 * 템플릿 내 AgentBlueprint 존재 보장 함수
 */
export function ensureTemplateAgentBlueprint(template: NotionTemplate): NotionTemplate {
  if (template.agentBlueprint) {
    return template;
  }
  const cleanTitle = sanitizeTemplateTitle(template.title);
  return {
    ...template,
    agentBlueprint: buildDynamicAgentBlueprint(cleanTitle, template.description)
  };
}

/**
 * 전달받은 title 기반 기본 동적 데이터베이스 생성
 */
export function buildDynamicDatabases(title: string, description?: string): NotionDatabase[] {
  const cleanTitle = sanitizeTemplateTitle(title);
  
  return [
    {
      name: `📌 ${cleanTitle} 마스터 트래커`,
      description: description || `${cleanTitle}의 핵심 목표 및 주요 항목 추적 데이터베이스`,
      view_type: 'table',
      properties: [
        { name: '항목명', type: 'title' },
        { name: '진행상태', type: 'status', options: ['대기', '진행중', '검토중', '완료'] },
        { name: '일정', type: 'date' },
        { name: '우선순위', type: 'select', options: ['높음 (P1)', '보통 (P2)', '낮음 (P3)'] },
        {
          name: '진행률(%)',
          type: 'formula',
          expression: 'ifs(prop("진행상태") == "완료", "100%", prop("진행상태") == "진행중", "50%", "0%")'
        },
        { name: 'Quality_Status', type: 'select', options: ['미검수', '검수중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '항목명': `${cleanTitle} 1단계 실행 계획 수립`, '진행상태': '완료', '우선순위': '높음 (P1)', 'Quality_Status': '승인', 'Verified': true },
        { '항목명': `${cleanTitle} 2단계 모니터링 및 모듈 적용`, '진행상태': '진행중', '우선순위': '보통 (P2)', 'Quality_Status': '검수중', 'Verified': false }
      ]
    },
    {
      name: `📋 ${cleanTitle} 상세 실행 항목`,
      description: `${cleanTitle}와 연결된 세부 실행 과제 및 데드라인 관리 DB`,
      view_type: 'table',
      properties: [
        { name: '작업명', type: 'title' },
        { name: '마스터 트래커', type: 'relation', target: `📌 ${cleanTitle} 마스터 트래커` },
        { name: '마감일', type: 'date' },
        { name: '우선순위', type: 'select', options: ['긴급 (P1)', '중요 (P2)', '일반 (P3)'] },
        { name: '상태', type: 'status', options: ['시작전', '진행중', '완료'] },
        {
          name: 'D-Day',
          type: 'formula',
          expression: 'ifs(empty(prop("마감일")), "미정", dateBetween(dateStart(prop("마감일")), now(), "days") < 0, "기한초과", dateBetween(dateStart(prop("마감일")), now(), "days") == 0, "D-Day", "D-" + dateBetween(dateStart(prop("마감일")), now(), "days"))'
        },
        { name: 'Quality_Status', type: 'select', options: ['미검수', '검수중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '작업명': `${cleanTitle} 초기 환경 설정 및 데이터 세팅`, '우선순위': '긴급 (P1)', '상태': '진행중', 'Quality_Status': '검수중', 'Verified': false },
        { '작업명': `${cleanTitle} 데이터 검수 기준표 문서화`, '우선순위': '중요 (P2)', '상태': '완료', 'Quality_Status': '승인', 'Verified': true }
      ]
    },
    {
      name: `📂 ${cleanTitle} 리소스 & 아카이브`,
      description: `${cleanTitle} 관련 참조 문서, URL, 매뉴얼 및 자원 보관 DB`,
      view_type: 'table',
      properties: [
        { name: '자료명', type: 'title' },
        { name: '마스터 트래커', type: 'relation', target: `📌 ${cleanTitle} 마스터 트래커` },
        { name: '카테고리', type: 'select', options: ['가이드/기획', '참조문서', 'API/기술', '기타'] },
        { name: '링크 URL', type: 'url' },
        { name: '메모', type: 'text' },
        { name: 'Quality_Status', type: 'select', options: ['미검수', '검수중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '자료명': `${cleanTitle} 운용 매뉴얼 및 가이드`, '카테고리': '가이드/기획', 'Quality_Status': '승인', 'Verified': true }
      ]
    }
  ];
}

export interface DynamicPayloadInput {
  topic?: string;
  title?: string;
  description?: string;
  icon?: string;
  cover_url?: string;
  tags?: string[];
  templateData?: Partial<NotionTemplate>;
  databases?: NotionDatabase[];
  valueAddList?: string[];
  initialPrompt?: string;
  [key: string]: any;
}

/**
 * 전달받은 동적 데이터(templateData / payload) 변수만으로
 * 상단 대시보드 타이틀과 콜아웃 3개 블록 및 전체 NotionTemplate 객체를 생성
 */
export function buildDynamicTemplateFromPayload(payload: DynamicPayloadInput): NotionTemplate {
  const data = payload.templateData || {};

  // 1. 동적 데이터 추출
  const rawTitle = data.title || payload.title || payload.topic || '마스터 워크스페이스';
  const cleanTitle = sanitizeTemplateTitle(rawTitle);

  const description = data.description || payload.description || `${cleanTitle} 관리를 위하여 최적화된 동적 노션 워크스페이스 시스템입니다.`;
  const icon = data.icon || payload.icon || '🎯';
  const cover_url = data.cover_url || payload.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80';
  const tags = data.tags || payload.tags || ['#동적워크스페이스', '#노션빌더', '#AI에이전트3.0'];

  // 2. 데이터베이스 구성 (전달받은 데이터 우선 사용)
  const databases: NotionDatabase[] = (data.databases && data.databases.length > 0)
    ? data.databases
    : (payload.databases && payload.databases.length > 0)
      ? payload.databases
      : buildDynamicDatabases(cleanTitle, description);

  // 3. 에이전트 블루프린트 구성 (전달받은 데이터 우선 사용)
  const agentBlueprint: AgentBlueprint = data.agentBlueprint || buildDynamicAgentBlueprint(cleanTitle, description);

  // 4. 가치 제안 목록 구성
  const valueAddList: string[] = data.valueAddList || payload.valueAddList || [
    `${cleanTitle} 맞춤형 실시간 트래킹 시스템 구축`,
    `AI 에이전트 3.0 기반 데이터 자동 검증 및 상태 관리`,
    `연관 데이터베이스 간 무결성 유지 및 1-클릭 리포팅`
  ];

  // 5. 콜아웃 3개 및 대시보드 타이틀 등 상단 블록들 렌더링 (오직 동적 변수 기반)
  const dbNamesText = databases.map(db => db.name).join(', ');
  const agentRoleObjectiveText = `${agentBlueprint.persona.role} - ${agentBlueprint.persona.objective}`;
  const valueAddSummaryText = valueAddList.join(' | ');

  const page_layout: NotionBlock[] = [
    // [블록 1] 상단 대시보드 타이틀 (전달받은 title 변수 기반)
    {
      type: 'heading_1',
      content: `📊 ${cleanTitle} 통합 대시보드`
    },
    // [블록 2] 콜아웃 1 - 워크스페이스 개요 및 목적 (전달받은 description 변수 기반)
    {
      type: 'callout',
      icon: '💡',
      color: 'blue_background',
      content: `📌 **시스템 개요**: ${description}`
    },
    // [블록 3] 콜아웃 2 - 연동 데이터베이스 구성 정보 (전달받은 databases 데이터 변수 기반)
    {
      type: 'callout',
      icon: '🗂️',
      color: 'purple_background',
      content: `📊 **연동 데이터베이스 (총 ${databases.length}개)**: ${dbNamesText}`
    },
    // [블록 4] 콜아웃 3 - 에이전트 3.0 실행 사양 및 가치 제안 (전달받은 agentBlueprint & valueAddList 변수 기반)
    {
      type: 'callout',
      icon: '🤖',
      color: 'green_background',
      content: `⚡ **AI 에이전트 3.0 운용 사양**: ${agentRoleObjectiveText}\n✨ **핵심 가치**: ${valueAddSummaryText}`
    },
    {
      type: 'divider'
    },
    // [블록 5] 데이터베이스 뷰 블록들
    ...databases.map((db): NotionBlock => {
      const allowedViews = ['table', 'board', 'calendar', 'gallery'] as const;
      const rawView = db.view_type as string | undefined;
      const validView = (rawView && allowedViews.includes(rawView as any))
        ? (rawView as 'table' | 'board' | 'calendar' | 'gallery')
        : 'table';
      return {
        type: 'database_view',
        database_name: db.name,
        view: validView
      };
    })
  ];

  return {
    schema_version: '1.0',
    title: cleanTitle,
    icon,
    cover_query: cleanTitle,
    cover_url,
    description,
    tags,
    databases,
    page_layout,
    valueAddList,
    agentBlueprint
  };
}
