// src/services/notionDynamicBuilder.ts
// AI 에이전트 payload 및 사용자 입력을 수신하여 완전한 NotionTemplate 객체로 동적 인스턴스화

import type {
  NotionTemplate,
  NotionDatabase,
  NotionBlock,
  AgentBlueprint
} from '../types/notion';

/**
 * 프롬프트 지시문/시스템 명령어/Echo 문구 완전 박멸을 위한 정규식 패턴 목록
 */
export const INSTRUCTION_ECHO_PATTERNS = [
  /\/?문서의\s*실제\s*시트명[^\s]*\s*/gi,
  /컬럼\s*헤더[^\s]*\s*/gi,
  /어\s*현재\s*템플릿을[^\s]*\s*/gi,
  /(?:천북|첨부)\s*파일(?:이|을|의|에)?\s*(?:반영한|반영하여|반영된|참고한|참고된|분석한|분석된|기반|반영)[^\s]*\s*/gi,
  /(?:천북|첨부)\s*파일[^\s]*\s*/gi,
  /실무\s*작업\s*(?:에)?\s*활용할\s*수\s*있는[^\s]*\s*/gi,
  /(?:만들어|작성해|생성해|설계해)\s*(?:주세요|줘|주십시오)[^\s]*\s*/gi,
  /지침\s*:\s*사용자(?:가|의)?\s*(?:첨부한|입력한)?\s*(?:표|문서|파일|데이터)?[^\s]*/gi,
  /지침\s*:\s*/gi,
  /\[지침\]\s*/gi,
  /사용자(?:가|의)?\s*(?:첨부한|입력한|요청한)?\s*(?:표|문서|파일|데이터|프롬프트)?(?:의|를)?\s*/gi,
  /1\s*:\s*1\s*(?:로)?\s*(?:노션\s*DB|속성|데이터베이스)?[^\s]*/gi,
  /노션\s*DB\s*속성[^\s]*\s*/gi,
  /(?:반영|참고|대조)하여\s*(?:설계|생성|구축|작성)하십시오\s*/gi,
  /(?:반영하여\s*)?설계하십시오\s*/gi,
  /다음은\s*사용자의\s*/gi,
  /프롬프트\s*:\s*/gi,
  /명령어\s*:\s*/gi,
  /아래\s*지침에\s*따라\s*/gi,
  /아래\s*지침[^\s]*\s*/gi,
  /다음\s*지침을\s*준수하여\s*/gi,
  /다음\s*지침[^\s]*\s*/gi,
  /입력된\s*파일\s*/gi,
  /입력\s*데이터[^\s]*\s*/gi,
  /첨부된\s*문서\s*/gi,
  /템플릿\s*제작[^\s]*\s*/gi,
  /템플릿을?\s*(?:만들어|생성|설계|작성)[^\s]*/gi,
  /노션\s*(?:템플릿|페이지|워크스페이스)를?\s*/gi,
  /기반으로\s*(?:작성|생성|설계)\s*/gi,
];

/**
 * 일반 텍스트 내 프롬프트 지시어 / 시스템 Echo 제거
 */
export function sanitizeTextContent(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw;
  for (const pattern of INSTRUCTION_ECHO_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

/**
 * 맥락 기반 제목 정제기 (Contextual Title Sanitizer)
 * - 프롬프트 지시문/명령어 문자열 완전 제거
 * - 30자 이내의 핵심 도메인 명사형 제목만 추출하여 할당
 */
export function sanitizeTemplateTitle(rawTitle?: string, fallback = '[스마트 대시보드] 데이터 통합 관제 OS'): string {
  if (!rawTitle) return fallback;

  // 1. 업무일지 / 점검 / 시설 / 소방 키워드 감지 시 [시설관리] 정제 제목 강제 부여
  if (/업무일지|일지|점검|시설|소방|점검내용|특이사항|결함|설비/i.test(rawTitle)) {
    return '[일일 업무일지] 업무 진행 및 실행 관제 OS';
  }

  // 2. 프롬프트 지시어 및 Echo 패턴 정규식으로 차단
  let cleaned = sanitizeTextContent(rawTitle);

  // 3. 따옴표, 대괄호, 마크다운 특수기호 및 특수문자 정리
  cleaned = cleaned
    .replace(/^["'‘“`]+|["'’”`]+$/g, '')
    .replace(/[\[\]]/g, '')
    .replace(/^[\s:\-\.=]+|[\s:\-\.=]+$/g, '')
    .trim();

  // 4. 문장형 서술어/지시어 제거 및 핵심 도메인 명사구 정제
  cleaned = cleaned
    .replace(/(?:해\s*줘|만들어\s*줘|작성해\s*줘|생성해\s*줘|구축해\s*줘|설계해\s*줘|반영해\s*줘|추가해\s*줘|넣어\s*줘)$/g, '')
    .replace(/(?:을|를)\s*위한\s*/g, ' ')
    .replace(/(?:에|의)\s*관한\s*/g, ' ')
    .replace(/(?:에|의)\s*대한\s*/g, ' ')
    .replace(/(?:템플릿|페이지|워크스페이스)\s*(?:생성|제작|구축)?$/g, '')
    .trim();

  // 5. 30자 이내 제한 및 핵심 도메인 명사형 제목 포맷팅
  if (cleaned.length > 30) {
    cleaned = cleaned.substring(0, 30).trim();
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > 15) {
      cleaned = cleaned.substring(0, lastSpace).trim();
    }
  }

  // 6. 정제 후 비어있거나 무의미한 지시문이었던 경우 fallback 리턴
  if (!cleaned || cleaned.length < 2 || /^(프롬프트|명령어|지침|템플릿|파일|문서|데이터|속성)$/i.test(cleaned)) {
    const validFallback = fallback && fallback !== rawTitle ? sanitizeTemplateTitle(fallback, '[스마트 대시보드] 데이터 통합 관제 OS') : '[스마트 대시보드] 데이터 통합 관제 OS';
    return validFallback;
  }

  return cleaned;
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
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 업무일지/시설점검/소방 감지: 레거시 PARA 속성(Quality_Status, Verified) 차단 및 3대 전용 스키마 강제 매핑
  const isFacilityOrDailyReport = /업무일지|일지|점검|시설|소방|점검내용|특이사항|결함|설비/i.test(title + ' ' + (description || ''));

  if (isFacilityOrDailyReport) {
    return [
      {
        name: `📌 [일일 업무일지] 마스터 관제 트래커`,
        description: description || `일일 업무 진행 상황, 작성자/결재자 및 특이사항 통합 관제 DB`,
        view_type: 'table',
        properties: [
          { name: '업무 내용', type: 'title' },
          { name: '일자', type: 'date' },
          { name: '작성자/결재자', type: 'text' },
          { name: '업무 구분', type: 'select', options: ['시설점검', '소방안전', '보수공사', '정기검사', '일반업무'] },
          { name: '진행상태', type: 'status', options: ['대기', '진행중', '검토중', '완료'] },
          { name: '특이사항', type: 'text' }
        ],
        sample_rows: [
          { '업무 내용': '지하 1층 기계실 급수 펌프 및 전기 제어반 정기 점검', '일자': todayStr, '작성자/결재자': '홍길동 소장', '업무 구분': '시설점검', '진행상태': '완료', '특이사항': '급수 펌프 2호기 미세 진동 확인 및 구리스 주입 완료' },
          { '업무 내용': '소방 수신기 및 유도등 예비전원 결함 점검', '일자': todayStr, '작성자/결재자': '김철수 기사', '업무 구분': '소방안전', '진행상태': '진행중', '특이사항': '3층 복도 비상 유도등 배터리 방전건 교체 긴급 티켓 발행' }
        ]
      },
      {
        name: `📋 시설물 일일점검 리스트`,
        description: `시간대별 시설물/소방/전기/기계 점검 항목 및 점검상태(○/△/×) 관리 DB`,
        view_type: 'table',
        properties: [
          { name: '점검항목', type: 'title' },
          { name: '점검시간', type: 'text' },
          { name: '점검구역', type: 'select', options: ['기계실', '전기실', '방재실', '옥상', '외곽'] },
          { name: '점검상태', type: 'select', options: ['정상(○)', '요주의(△)', '결함(×)'] },
          { name: '점검자', type: 'text' },
          { name: '비고', type: 'text' }
        ],
        sample_rows: [
          { '점검항목': '주 배전반 공기차단기(ACB) 동작 및 전압 레벨', '점검시간': '09:30', '점검구역': '전기실', '점검상태': '정상(○)', '점검자': '김철수', '비고': '상전압 220V/380V 정상 계측' },
          { '점검항목': '3층 소방 감지기 수신 반응 및 비상 유도등', '점검시간': '11:00', '점검구역': '방재실', '점검상태': '결함(×)', '점검자': '홍길동', '비고': '유도등 예비전원 방전 확인 (긴급 조치 필요)' }
        ]
      },
      {
        name: `🚨 긴급 결함 & 소방 조치 티켓`,
        description: `시설물 결함, 소방 안전 위험도 및 조치 현황 관리 DB`,
        view_type: 'table',
        properties: [
          { name: '티켓명/설비명', type: 'title' },
          { name: '관련 점검', type: 'relation', target: `📋 시설물 일일점검 리스트` },
          { name: '위험도', type: 'select', options: ['긴급(P1)', '주의(P2)', '일반(P3)'] },
          { name: '조치 내용', type: 'text' },
          { name: '상태', type: 'status', options: ['접수', '조치중', '완료'] },
          { name: '조치일자', type: 'date' }
        ],
        sample_rows: [
          { '티켓명/설비명': '3층 복도 비상유도등 배터리 방전 및 소방 자재 교체', '위험도': '긴급(P1)', '조치 내용': '예비 배터리 신규 수급 및 교체 설치 완료', '상태': '완료', '조치일자': todayStr }
        ]
      }
    ];
  }

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
          name: '진행률 게이지',
          type: 'formula',
          expression: 'lets(total, if(empty(prop("세부 실행 과제")), 1, prop("세부 실행 과제").length()), done, if(empty(prop("세부 실행 과제")), if(prop("진행상태") == "완료", 1, 0), prop("세부 실행 과제").filter(current.prop("상태") == "완료").length()), rate, if(total > 0, round(done / total * 100), 0), filled, round(rate / 20), slice("■■■■■", 0, filled) + slice("□□□□□", 0, 5 - filled) + " " + rate + "%")'
        },
        {
          name: '품질 검수',
          type: 'formula',
          expression: 'lets(s, prop("진행상태"), hasDate, not(empty(prop("일정"))), if(s == "완료", "🟢 검수 합격", if(s == "진행중" and hasDate, "🟡 정상 진행", if(s == "대기", "⚪ 대기 중", "🔴 점검 필요"))))'
        },
        { name: 'Quality_Status', type: 'select', options: ['미검수', '검수중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '항목명': `${cleanTitle} 기획 수립`, '진행상태': '완료', '일정': todayStr, '우선순위': '높음 (P1)', 'Quality_Status': '승인', 'Verified': true },
        { '항목명': `${cleanTitle} 모니터링 적용`, '진행상태': '진행중', '일정': todayStr, '우선순위': '보통 (P2)', 'Quality_Status': '검수중', 'Verified': false }
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
          expression: 'let(days, dateBetween(prop("마감일"), now(), "days"), if(empty(prop("마감일")), "📅 일정 미정", if(prop("상태") == "완료", "✅ 완료", if(days == 0, "🔥 오늘 마감!", if(days < 0, "🚨 D+" + abs(days) + " (지연)", "D-" + days)))))'
        },
        {
          name: '품질 검수',
          type: 'formula',
          expression: 'lets(s, prop("상태"), hasDate, not(empty(prop("마감일"))), if(s == "완료", "🟢 검수 합격", if(s == "진행중" and hasDate, "🟡 정상 진행", if(s == "시작전", "⚪ 대기 중", "🔴 점검 필요"))))'
        },
        { name: 'Quality_Status', type: 'select', options: ['미검수', '검수중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '작업명': `${cleanTitle} 환경 설정`, '우선순위': '긴급 (P1)', '상태': '진행중', 'Quality_Status': '검수중', 'Verified': false },
        { '작업명': `${cleanTitle} 데이터 검수`, '우선순위': '중요 (P2)', '상태': '완료', 'Quality_Status': '승인', 'Verified': true }
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

  const isFacilityOrDailyReport = /업무일지|일지|점검|시설|소방|점검내용|특이사항|결함|설비/i.test(cleanTitle + ' ' + (payload.initialPrompt || ''));

  // 2. 데이터베이스 구성 (업무일지/시설점검 키워드 감지 시 3대 강제 스키마 매핑)
  const rawDatabases: NotionDatabase[] = isFacilityOrDailyReport
    ? buildDynamicDatabases(cleanTitle, description)
    : (data.databases && data.databases.length > 0)
      ? data.databases
      : (payload.databases && payload.databases.length > 0)
        ? payload.databases
        : buildDynamicDatabases(cleanTitle, description);

  // 데이터베이스 이름, 설명 및 sample_rows 지시문 echo 정제
  const databases: NotionDatabase[] = rawDatabases.map((db) => {
    const rawDbName = db.name.replace(/^[📌📋📂📊]\s*/, '');
    const cleanDbName = sanitizeTemplateTitle(rawDbName, `${cleanTitle} 항목`);
    const prefix = db.name.match(/^[📌📋📂📊]\s*/)?.[0] || '📊 ';
    const dbName = `${prefix}${cleanDbName}`;
    const dbDesc = sanitizeTextContent(db.description) || `${cleanDbName} 데이터베이스`;

    const cleanSampleRows = db.sample_rows?.map((row) => {
      const sanitizedRow: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        const cleanKey = sanitizeTextContent(k) || k;
        let cleanVal = v;
        if (typeof v === 'string') {
          cleanVal = sanitizeTextContent(v);
          if (!cleanVal) cleanVal = `${cleanTitle} 실행 항목`;
        }
        sanitizedRow[cleanKey] = cleanVal;
      });
      return sanitizedRow;
    });

    return {
      ...db,
      name: dbName,
      description: dbDesc,
      sample_rows: cleanSampleRows,
    };
  });

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
