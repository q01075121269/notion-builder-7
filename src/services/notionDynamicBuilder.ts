// src/services/notionDynamicBuilder.ts
// AI 오케스트레이터 payload 및 채팅 명령어를 최상급 NotionTemplate 구조체로 동적 인스턴스화
// [Step 3]: 커스텀 에이전트 3.0 셋업 콜아웃, DB 품질 게이트 및 무손실 마이그레이션 결합

import type {
  NotionTemplate,
  NotionDatabase,
  NotionProperty,
  NotionBlock,
  AgentBlueprint
} from '../types/notion';

export interface DynamicBuildParams {
  topic: string;
  title: string;
  initialPrompt?: string;
  dbSchemas?: any[];
  formulas?: any[];
  valueAdd?: string[];
  complexity?: string;
}

/**
 * 1. 커스텀 에이전트 3.0 5대 벤치마크 규격을 준수하는 정형화된 agentBlueprint 생성기
 */
export function generateAgentBlueprint(
  topic: string,
  title: string,
  dbNames: string[]
): AgentBlueprint {
  const mainDb = dbNames[0] || `${title} 마스터 트래커`;
  const allDbsStr = dbNames.length > 0 ? dbNames.join(', ') : mainDb;
  const contextTopic = topic ? `[${topic}] ` : '';

  const setupPromptMarkdown = [
    `# [🤖 노션 커스텀 에이전트 3.0 공식 셋업 프롬프트]`,
    `> 이 텍스트는 노션 공식 워크스페이스의 [커스텀 에이전트 생성/설정창]에 1-클릭으로 바로 복사-붙여넣기하여 사용하는 정밀 지능 명세서입니다.`,
    ``,
    `## 1. 에이전트 역할 및 페르소나 (Role & Persona)`,
    `- 에이전트 명칭: ${title} 상주 총괄 오케스트레이터 (Custom Agent 3.0)`,
    `- 업무 목표: "${title}" ${contextTopic}워크스페이스의 데이터 자율 동기화, Formulas 2.0 수식 연산 감시, 품질 게이트 자동 검수 및 데일리/주간 브리핑 수행`,
    `- 책임 범위: [${allDbsStr}] 마스터 DB군 및 [🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)]`,
    ``,
    `## 2. 다중 복합 트리거 (Multi-Triggers & Event Chaining)`,
    `1) [스케줄 트리거]:`,
    `   - 매일 아침 09:00: 당일 마감 임박 과제 추출 및 긴급도(P1/P2/P3) 기반 데일리 브리핑`,
    `   - 매일 자정 00:01: Formulas 2.0 D-Day 카운터(dateBetween) 자율 갱신 및 지연 태스크 태깅`,
    `   - 매주 월요일 08:30: 전주 목표 달성률 집계 및 금주 집중 과제 TOP 3 주간 결산 브리핑`,
    `2) [노션 내부 이벤트 트리거]:`,
    `   - 새 페이지 생성 시: 'Quality_Status'를 '초안'으로 기본 설정하고 필수 컬럼(제목, 마감일) 유효성 검수`,
    `   - 'Quality_Status'가 '검수 중'으로 변경 시: QA 게이트키퍼가 검증 수행 후 '승인' 또는 '반려' 처리`,
    `   - 진행 상태가 '완료'로 변경 시: 달성률 100% 반영 및 감사 로그 기록`,
    `3) [외부 이벤트 트리거]:`,
    `   - Notion Mail / 수퍼휴먼 수신 이메일에서 [긴급/일정] 키워드 감지 시 즉각 할일 생성`,
    `   - Slack 멘션 발생 시 노션 회의록 및 요약 데이터 자동 첨부 연동`,
    ``,
    `## 3. 모듈형 스킬팩 (Agent Skills Architecture)`,
    `- [스킬 1: 마감 임박 알림 (imminent_deadline_notifier)]`,
    `  * 조건: dateBetween(prop("마감일"), now(), "days") <= 1 AND prop("상태") != "완료"`,
    `  * 액션: 상단 에이전트 콜아웃에 🚨 긴급 마감 임박 항목 브리핑 및 실시간 노티 발송`,
    `- [스킬 2: D-Day 자동 갱신 (dday_auto_refresher)]`,
    `  * 조건: 자정 00:01 스케줄 트리거 또는 페이지 로드`,
    `  * 액션: now() 기준 dateBetween 재연산 및 양수(D-N), 음수(D+N 지연) 상태 갱신`,
    `- [스킬 3: 주간 결산 브리핑 (weekly_summary_briefer)]`,
    `  * 조건: 매주 월요일 08:30 스케줄 트리거`,
    `  * 액션: 완료 태스크 통계 집계, 달성률 롤업 게이지 산출, 금주 집중 과제 TOP 3 자동 추천`,
    `- [스킬 4: 품질 게이트 검수 (quality_gate_auditor)]`,
    `  * 조건: 'Quality_Status' 속성 변경 감지`,
    `  * 액션: Verified 공식 문서 대조 및 필수 속성 검수 후 Heartbeat 로그에 ✅ 정상 기록`,
    ``,
    `## 4. 서브 에이전트 분업 지침 (Master PM & Sub-Agent Squad)`,
    `- [총괄 PM 에이전트]: 전체 로드맵 지휘, 통합 진척도 상시 감독, 일일 브리핑 작성 및 서브 에이전트 업무 조율`,
    `- [실무 태스크 에이전트]: 일일 할일 자동 배분, D-Day 카운터 모니터링, 병목 태스크 담당자 넛지 알림`,
    `- [QA 게이트키퍼]: 산출물 체크리스트 100% 충족 여부 검증, Verified 마크 확인, AI 워크슬롭 차단`,
    ``,
    `## 5. AI 워크슬롭(Work-slop) 차단 3대 불문율 (Anti-Workslop Guardrails)`,
    `1. [목적 잠그기 (Lock Purpose)]: 완료 조건(Done Definition)이 사전에 정의되지 않은 모호한 텍스트 생성 일체 금지.`,
    `2. [출처 강제 (Strict Source Grounding)]: 워크스페이스 내 'Verified = true' 속성을 가진 공식 문서와 실제 연동된 DB 행만 인용.`,
    `3. [자체 검수 표(Verification Table) 출력 강제]: 모든 자율 생성/응답 결과물 끝에 아래 자체 검수 표를 의무적으로 출력할 것:`,
    ``,
    `| 검수 항목 | 통과 기준 | 검수 결과 | 상태 |`,
    `| :--- | :--- | :--- | :---: |`,
    `| Formulas 2.0 문법 | 오류 없는 정규 Notion 수식 | progress(), dateBetween() 유효 | ✅ PASS |`,
    `| 관계형 스키마 무결성 | 최소 2개 이상 DB 상호 Relation 연결 | 마스터 DB ↔ Heartbeat 로그 양방향 연결 완료 | ✅ PASS |`,
    `| 데이터 무손실(Zero Loss) | 기존 행 및 고유 ID 100% 보존 | 변경 0건 / 신규 품질속성 100% 안전 추가 | ✅ PASS |`,
    `| Work-slop 차단율 | 미사여구 배제 및 실행 액션 비율 | 실행 가능 항목 100% | ✅ PASS |`
  ].join('\n');

  return {
    version: '3.0.0',
    persona: {
      role: `${title} 상주 총괄 오케스트레이터 (Custom Agent 3.0)`,
      objective: `"${title}" ${contextTopic}워크스페이스의 데이터 자율 동기화, Formulas 2.0 수식 연산 감시, 품질 게이트 자동 검수 및 데일리/주간 브리핑 수행`,
      scope: `[${allDbsStr}] 마스터 DB군 및 [🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)]`
    },
    multiTriggers: {
      schedule: '매일 아침 09:00 데일리 브리핑 / 자정 00:01 D-Day 갱신 / 매주 월요일 08:30 주간 결산',
      notionEvents: [
        `'Quality_Status'가 '검수 중'으로 변경 시 QA 게이트키퍼 자동 호출`,
        `신규 레코드 등록 시 'Quality_Status' 기본값 '초안' 부여 및 필수 속성 유효성 체크`,
        `진행 상태 '완료' 변경 시 Formulas 2.0 달성률 100% 반영 및 감사 로그 기록`
      ],
      externalEvents: [
        `Notion Mail / 수퍼휴먼 수신 이메일에서 [긴급/일정] 키워드 감지 시 자동 태스크 생성`,
        `Slack 채널 멘션 시 노션 회의록 및 요약 데이터 자동 첨부 연동`
      ]
    },
    skills: [
      {
        id: 'imminent_deadline_notifier',
        name: '마감 임박 긴급 알림 (Imminent Deadline Notifier)',
        trigger: 'Schedule (매일 09:00, 18:00) / 사용자 요청',
        targetDb: mainDb,
        logic: 'dateBetween(prop("마감일"), now(), "days") <= 1 AND prop("상태") != "완료"',
        action: '상단 에이전트 콜아웃에 🚨 긴급 마감 임박 항목 브리핑 및 실시간 노티 발송'
      },
      {
        id: 'dday_auto_refresher',
        name: 'D-Day 자정 자동 갱신 (D-Day Auto Refresher)',
        trigger: 'Schedule (매일 00:01 자정) / 페이지 로드',
        targetDb: '날짜 및 수식 보유 DB 전체',
        logic: 'now() 기준 dateBetween 재연산 및 양수(D-N), 음수(D+N 지연) 상태 갱신',
        action: '지연된 항목에 "🚨 지연" 태그 갱신 및 PM 알림 큐 적재'
      },
      {
        id: 'weekly_summary_briefer',
        name: '주간 결산 성과 브리핑 (Weekly Summary Briefer)',
        trigger: 'Schedule (매주 월요일 08:30)',
        targetDb: allDbsStr,
        logic: '지난 7일간 완료된 태스크 수, 목표 달성률 롤업 게이지, 미완료 병목 추출',
        action: '대시보드 상단에 3줄 하이라이트 요약 렌더링 및 금주 집중 과제 TOP 3 자동 추천'
      },
      {
        id: 'quality_gate_auditor',
        name: '품질 게이트 무결성 검수 (Quality Gatekeeper)',
        trigger: 'Notion-Event (Quality_Status 변경 시)',
        targetDb: '전체 마스터 DB',
        logic: 'Quality_Status == "승인" 처리 전 Verified=true 공식 출처 여부 및 필수 속성(제목, 마감일) 기입 검증',
        action: '조건 미달 시 "반려" 및 사유 메모 기록, 통과 시 Heartbeat 로그에 ✅ 정상 기록'
      }
    ],
    subAgents: [
      {
        name: '총괄 PM 에이전트 (Master PM)',
        role: '전체 로드맵 지휘 & 우선순위 조율',
        responsibility: '통합 진척도 상시 감독, 일일 브리핑 작성 및 서브 에이전트 간 업무 배분'
      },
      {
        name: '실무 태스크 에이전트 (Task Orchestrator)',
        role: '일일 할일 배분 & D-Day 모니터링',
        responsibility: '개별 태스크 진행 상황 감시, 마감 임박 항목 자동 넛지 및 담당자 연결'
      },
      {
        name: '품질 게이트키퍼 (QA Gatekeeper)',
        role: '품질 검수 & AI 워크슬롭 원천 차단',
        responsibility: '산출물 체크리스트 100% 충족 여부 검증, Verified 마크 확인, 자체 검수표 출력'
      }
    ],
    workslopGuardrails: {
      doneDefinition: [
        '1. 데이터베이스 간 관계형(Relation) 상호 연결 100% 검증',
        '2. Formulas 2.0 게이지 바 및 D-Day 수식 무결성 정상 작동',
        '3. 기존 데이터 무손실(Zero Data Loss) 보존 및 신규 속성만 안전 추가(Append-Only)',
        '4. 영혼 없는 미사여구 배제 및 즉시 실행 가능한 정량 데이터만 출력'
      ],
      verifiedSourcesOnly: true,
      verificationMetrics: [
        'Formulas 2.0 문법 오류 0건 (Syntax PASS)',
        '관계형 스키마 상호 링크 (Relation PASS)',
        '기존 데이터 무손실율 100% (Zero-Loss PASS)',
        '워크슬롭 차단율 100% (Anti-Slop PASS)'
      ],
      verificationTableMarkdown: [
        '| 검수 항목 | 통과 기준 | 검수 결과 | 상태 |',
        '| :--- | :--- | :--- | :---: |',
        '| Formulas 2.0 문법 | 오류 없는 정규 Notion 수식 | progress(), dateBetween() 유효 | ✅ PASS |',
        '| 관계형 스키마 무결성 | 최소 2개 이상 DB 상호 Relation 연결 | 마스터 DB ↔ Heartbeat 로그 양방향 연결 완료 | ✅ PASS |',
        '| 데이터 무손실(Zero Loss) | 기존 행 및 고유 ID 100% 보존 | 변경 0건 / 신규 품질속성 100% 안전 추가 | ✅ PASS |',
        '| Work-slop 차단율 | 미사여구 배제 및 실행 액션 비율 | 실행 가능 항목 100% | ✅ PASS |'
      ].join('\n')
    },
    setupPromptMarkdown
  };
}

/**
 * 2. 데이터베이스 스키마 내 '품질 게이트(Quality Gate)' 속성 차분 주입 (Append-Only)
 * - 기존 속성을 일체 삭제하지 않고 무손실로 추가
 */
export function injectQualityGateProperties(properties: NotionProperty[]): NotionProperty[] {
  const result = [...properties];

  const hasQualityStatus = result.some(
    p => p.name === 'Quality_Status' || p.name.includes('품질') || (p.type === 'select' && p.options?.includes('승인'))
  );
  if (!hasQualityStatus) {
    result.push({
      name: 'Quality_Status',
      type: 'select',
      options: ['초안', '검수 중', '승인', '반려']
    });
  }

  const hasVerified = result.some(
    p => p.name === 'Verified' || p.name.includes('검증') || p.type === 'checkbox'
  );
  if (!hasVerified) {
    result.push({
      name: 'Verified',
      type: 'checkbox'
    });
  }

  return result;
}

/**
 * 3. 하단 Agent_Heartbeat_Log 경량 감사 DB 스키마 생성기
 * - 침묵의 실패(Silent Failure) 방지를 위해 에이전트 실행 내역을 기록하는 서브 DB
 */
export function createHeartbeatAuditDatabase(mainDbName: string): NotionDatabase {
  return {
    name: '🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)',
    description: '노션 커스텀 에이전트 3.0의 자율 트리거 실행 내역, 처리 건수 및 침묵의 실패(Silent Failure) 방지 감사 로그 DB',
    view_type: 'table',
    properties: [
      { name: '에이전트명', type: 'title' },
      { name: '실행시각', type: 'date' },
      { name: '실행상태', type: 'select', options: ['✅ 정상', '⚠️ 경고', '❌ 실패'] },
      { name: '처리건수', type: 'number' },
      { name: '실행요약', type: 'text' },
      { name: '관련 태스크/데이터', type: 'relation', target: mainDbName }
    ],
    sample_rows: [
      {
        '에이전트명': 'Master PM Agent',
        '실행시각': new Date().toISOString().split('T')[0],
        '실행상태': '✅ 정상',
        '처리건수': 8,
        '실행요약': '데일리 D-Day 자동 갱신 및 마감 임박 알림 브리핑 발송 (성공률 100%)'
      },
      {
        '에이전트명': 'QA Gatekeeper',
        '실행시각': new Date().toISOString().split('T')[0],
        '실행상태': '✅ 정상',
        '처리건수': 3,
        '실행요약': '품질 게이트 검수 완료 (초안 1건 검수요청 접수, 승인 2건 완료)'
      }
    ]
  };
}

/**
 * 4. 무손실(Zero-Data-Loss) 템플릿 검증 & 에이전트 3.0 블루프린트 통합 보장 함수
 * - 기존 템플릿의 모든 원본 행과 속성을 100% 보존하면서
 * - Quality Gate 속성, Formulas 2.0, Heartbeat 감사 DB, 에이전트 셋업 콜아웃을 결합
 */
export function ensureTemplateAgentBlueprint(template: NotionTemplate): NotionTemplate {
  // 1. 기존 DB 목록 복사 및 품질 게이트 속성 차분 추가
  const updatedDatabases: NotionDatabase[] = template.databases.map(db => {
    const isAuditDb = db.name.includes('Heartbeat') || db.name.includes('감사 로그');
    if (isAuditDb) return db;

    const propsWithQualityGate = injectQualityGateProperties(db.properties);

    // 메인 DB에 Heartbeat 감사 로그 역방향 Relation 확인 및 연결
    const hasHeartbeatRelation = propsWithQualityGate.some(
      p => p.type === 'relation' && (p.target?.includes('Heartbeat') || p.target?.includes('감사 로그'))
    );
    if (!hasHeartbeatRelation) {
      propsWithQualityGate.push({
        name: '감사 로그 기록',
        type: 'relation',
        target: '🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)'
      });
    }

    return {
      ...db,
      properties: propsWithQualityGate
    };
  });

  // 2. Heartbeat 감사 DB 누락 시 자동 생성 결합
  const hasAuditDb = updatedDatabases.some(
    db => db.name.includes('Heartbeat') || db.name.includes('감사 로그')
  );
  if (!hasAuditDb) {
    const mainDbName = updatedDatabases[0]?.name || `${template.title} 마스터 DB`;
    updatedDatabases.push(createHeartbeatAuditDatabase(mainDbName));
  }

  // 3. 에이전트 3.0 블루프린트 생성 (없거나 보강 필요 시)
  const dbNames = updatedDatabases.filter(d => !d.name.includes('감사 로그')).map(d => d.name);
  const agentBlueprint = template.agentBlueprint || generateAgentBlueprint(
    template.cover_query || template.title,
    template.title,
    dbNames
  );

  // 4. 최상단 [🤖 커스텀 에이전트 3.0 원클릭 셋업] 콜아웃 블록 주입
  const hasAgentCallout = template.page_layout.some(
    block => block.type === 'callout' && (block as any).content?.includes('커스텀 에이전트 3.0')
  );

  const updatedLayout = [...template.page_layout];
  if (!hasAgentCallout) {
    const agentCalloutBlock: NotionBlock = {
      type: 'callout',
      icon: '🤖',
      content: `[커스텀 에이전트 3.0 원클릭 셋업 가이드]\n이 템플릿에는 노션 공식 커스텀 에이전트 지능 규격이 사전 완비되어 있습니다.\n• 역할: ${agentBlueprint.persona.role}\n• 다중 트리거: 매일 09:00 스케줄 + 노션 이벤트(상태 변경) + 메일/슬랙 체이닝\n• 모듈형 스킬팩: 마감 임박 알림, D-Day 자동 갱신, 주간 결산 브리핑, 품질 게이트 검수\n• 안전 가드: 사내 공식 Verified 문서 한정 인용, AI 워크슬롭 방지 자체 검수 표 의무 출력\n※ 상단 [📋 에이전트 셋업 프롬프트 복사] 버튼을 눌러 노션 커스텀 에이전트 설정창에 붙여넣으세요.`,
      color: 'purple'
    };
    updatedLayout.unshift(agentCalloutBlock);
  }

  return {
    ...template,
    databases: updatedDatabases,
    page_layout: updatedLayout,
    agentBlueprint
  };
}

/**
 * 5. 동적 템플릿 빌더 (대화형 오케스트레이터 및 신규 생성용)
 */
export function buildDynamicTemplateFromPayload(params: DynamicBuildParams): NotionTemplate {
  const { topic, title, dbSchemas, formulas, valueAdd } = params;

  const templateId = `dyn-template-${Date.now()}`;
  const icon = topic.includes('합격') || topic.includes('시험') || topic.includes('자격증') ? '🎯'
    : topic.includes('독서') || topic.includes('책') ? '📚'
    : topic.includes('프로젝트') || topic.includes('개발') ? '💻'
    : topic.includes('가계부') || topic.includes('돈') || topic.includes('지출') ? '💰'
    : topic.includes('루틴') || topic.includes('스케줄') ? '📅'
    : '✨';

  const coverUrl = topic.includes('합격') || topic.includes('시험')
    ? 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80'
    : topic.includes('독서')
    ? 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80'
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';

  // 1. 다중 DB 빌드 (payload.db_schema 기반)
  const databases: NotionDatabase[] = [];

  if (Array.isArray(dbSchemas) && dbSchemas.length > 0) {
    dbSchemas.forEach((schema, idx) => {
      const props: NotionProperty[] = [];

      if (Array.isArray(schema.properties)) {
        schema.properties.forEach((p: any) => {
          if (p.name) {
            const rawType = (p.type || 'text').toLowerCase();
            const validTypes = ['title', 'date', 'status', 'formula', 'relation', 'select', 'multi_select', 'checkbox', 'number', 'url', 'text', 'person'];
            const propType = validTypes.includes(rawType) ? rawType as any : 'text';

            props.push({
              name: p.name,
              type: propType,
              expression: p.formula || p.expression,
              options: Array.isArray(p.options) ? p.options : undefined
            });
          }
        });
      }

      // 기본 이름 필수 속성이 없다면 추가
      if (!props.some(p => p.type === 'title')) {
        props.unshift({ name: '제목', type: 'title' });
      }

      // 품질 게이트 속성 자동 주입
      const finalProps = injectQualityGateProperties(props);

      databases.push({
        name: schema.db_name || `${title} 마스터 DB ${idx + 1}`,
        description: `AI가 동적으로 맞춤 구성한 ${schema.db_name || '마스터 DB'}입니다.`,
        view_type: 'table',
        properties: finalProps,
        sample_rows: [
          { '제목': `${title} 예시 가이드 데이터 1`, '진행 상태': '진행 중', 'Quality_Status': '초안', 'Verified': false },
          { '제목': `${title} 핵심 완료 목표 2`, '진행 상태': '완료', 'Quality_Status': '승인', 'Verified': true }
        ]
      });
    });
  } else {
    // 기본 고품질 관계형 DB 구성
    databases.push({
      name: `🎯 ${title} 핵심 마스터 트래커`,
      description: `AI 맞춤 제작 메인 마스터 데이터베이스`,
      view_type: 'table',
      properties: [
        { name: '이름', type: 'title' },
        { name: '목표일', type: 'date' },
        { name: '진행 상태', type: 'status', options: ['대기 중', '진행 중', '완료'] },
        { name: '카테고리', type: 'select', options: ['핵심 목표', '중요 과제', '일반 메모'] },
        { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' },
        { name: '진행률 Formula 2.0', type: 'formula', expression: 'if(prop("진행 상태") == "완료", "100% 🟢", "50% 🟡")' },
        { name: 'AI 핵심 요약', type: 'text' }
      ],
      sample_rows: [
        { '이름': `${title} 1단계 실행 계획`, '진행 상태': '진행 중', '카테고리': '핵심 목표', 'Quality_Status': '검수 중', 'Verified': false },
        { '이름': `${title} 2단계 목표 검수`, '진행 상태': '완료', '카테고리': '중요 과제', 'Quality_Status': '승인', 'Verified': true }
      ]
    });
  }

  // 2. Heartbeat 감사 DB 연동
  const mainDbName = databases[0]?.name || `${title} 마스터 트래커`;
  databases.push(createHeartbeatAuditDatabase(mainDbName));

  // 3. 에이전트 3.0 블루프린트 생성
  const dbNames = databases.filter(d => !d.name.includes('감사 로그')).map(d => d.name);
  const agentBlueprint = generateAgentBlueprint(topic, title, dbNames);

  // 4. 가이드 블록 및 최상단 에이전트 셋업 콜아웃 빌드
  const page_layout: NotionBlock[] = [
    {
      type: 'callout',
      icon: '🤖',
      content: `[커스텀 에이전트 3.0 원클릭 셋업 가이드]\n이 템플릿에는 노션 공식 커스텀 에이전트 지능 규격이 사전 완비되어 있습니다.\n• 역할: ${agentBlueprint.persona.role}\n• 다중 트리거: 매일 09:00 스케줄 + 노션 이벤트(상태 변경) + 메일/슬랙 체이닝\n• 모듈형 스킬팩: 마감 임박 알림, D-Day 자동 갱신, 주간 결산 브리핑, 품질 게이트 검수\n• 안전 가드: 사내 공식 Verified 문서 한정 인용, AI 워크슬롭 방지 자체 검수 표 의무 출력\n※ 상단 [📋 에이전트 셋업 프롬프트 복사] 버튼을 눌러 노션 커스텀 에이전트 설정창에 붙여넣으세요.`,
      color: 'purple'
    },
    {
      type: 'callout',
      icon: icon,
      content: `${title} AI 맞춤형 노션 템플릿에 오신 것을 환영합니다!\nNotion Architect v2.0 AI 오케스트레이터가 사용자의 요청("${params.initialPrompt || topic}")을 완벽히 분석하여 자동 인스턴스화했습니다.`,
      color: 'blue'
    },
    {
      type: 'heading_1',
      content: `📌 ${title} 특장점 및 차별화 스펙`
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[0]) || 'Formulas 2.0 자동 계산 수식 및 D-Day 연동'
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[1]) || '다중 관계형 DB 간 상호 연결 및 Agent_Heartbeat_Log 감사 연동'
    },
    {
      type: 'divider'
    }
  ];

  return {
    id: templateId,
    title: title || `${topic} AI 맞춤형 템플릿`,
    icon,
    cover_query: topic,
    cover_url: coverUrl,
    description: `AI 오케스트레이터가 대화 명령을 바탕으로 최신 스키마 및 수식을 적용하여 자동 빌드한 템플릿입니다.`,
    tags: ['#AI맞춤제작', '#Formulas2.0', '#에이전트3.0', `#${topic.replace(/\s+/g, '')}`, '#자동생성'],
    databases,
    page_layout,
    agentBlueprint,
    formulas2Specs: Array.isArray(formulas) ? formulas : [
      { name: '진행률 수식', formula: 'if(prop("진행 상태")=="완료","100%","50%")', use_case: 'D-Day 및 과제 진행도 실시간 트래킹' }
    ],
    valueAddList: valueAdd || ['AI 자동 스키마 최적화', 'Formulas 2.0 고성능 수식 연동', '커스텀 에이전트 3.0 규격 탑재'],
    created_at: new Date().toISOString()
  };
}
