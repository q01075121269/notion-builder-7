/**
 * src/lib/system_spec.ts
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  NOTION ARCHITECT — 시스템 지식 베이스 (AI Knowledge Base Module)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  목적: Gemini AI가 상시 참조하는 '살아있는 설계 헌법'.
 *        프롬프트 시스템 지침 주입, 자체 진단, 수정 프롬프트 생성에 활용.
 *
 *  이 파일은 순수 상수(const) 데이터 모듈입니다.
 *  런타임 사이드 이펙트(DOM 조작, API 호출, 전역 상태 변이) 없음.
 *  어떤 컴포넌트나 라우트에서도 안전하게 import 가능.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. 프로젝트 메타 개요
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECT_OVERVIEW = {
  name: 'Notion Architect',
  codename: 'notion-builder-v2',
  tagline: '한국어 음성/텍스트/사진 입력 → 노션 DB 자동 설계 및 라이프 관리 AI 비서',
  version: '2.0.0',
  stack: {
    frontend: 'React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons (SPA)',
    backend: 'Vercel Serverless Functions (/api/gemini, /api/notion, /api/orchestrator)',
    ai: 'Google Gemini 3.6 Flash (멀티모달: 텍스트 + 이미지 비전)',
    notionApi: 'Notion REST API v2022-06-28 (350ms 쓰로틀, 지수 백오프 3회)',
    voice: 'Web Speech API (SpeechRecognition STT / SpeechSynthesis TTS, 한국어)',
    storage: 'localStorage + sessionStorage (서버 DB 없음, 군사 등급 파기)',
    deploy: 'Vercel (자동 CI/CD, main 브랜치 푸시 트리거)',
  },
  routing: {
    home: '/',
    builder: '/builder',
    lifeHub: '/life',
    devLab: '/devlab',
    description: 'URL History(popstate) 연동 독립 작업실 4분할 탭 구조',
  },
  dataFlow: [
    '① 사용자 입력 (텍스트 / 한국어 음성 STT / 영수증 사진)',
    '② Canvas 이미지 압축 (최대 1024px, JPEG quality 0.8)',
    '③ POST /api/orchestrator → Gemini 멀티인텐트 분석',
    '④ RoutedNotionTask[] 생성 → 로컬 UI 즉각 반영',
    '⑤ POST /api/notion → Notion DB 페이지 생성 (Rate-Limit 방어)',
    '⑥ 완료 토스트 + 진동 Haptic + TTS 음성 브리핑',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. 3대 핵심 캔버스 명세
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_TEMPLATE_MASTER = {
  id: 'builder',
  label: '① 노션 빌더 (Template Master)',
  icon: '🏗️',
  route: '/builder',
  corePurpose: '단순 발화 하나로 상용 유료급 노션 멀티 DB 스키마를 자동 설계/생성',
  engineCapabilities: [
    '자연어 의도 분석 → 최적 DB 스키마 자동 매핑',
    'Formulas 2.0 수식 (progress(), dateBetween(), if/and/or) 자동 삽입',
    '다중 관계형(Relation) + 롤업(Rollup) 자동 연결',
    'PARA / GTD / OKR 계층 구조 자동 적용',
    '베스트셀러 템플릿 4종(독서노트, 프로젝트 대시보드, CRM, 목표관리) 내장',
  ],
  notionSchemaSpecs: {
    propertyTypes: [
      'title', 'rich_text', 'number', 'select', 'multi_select',
      'date', 'checkbox', 'url', 'email', 'phone_number',
      'formula', 'relation', 'rollup', 'created_time', 'last_edited_time',
      'people', 'files', 'status',
    ],
    formulaExamples: [
      'progress() — 진행률 게이지 바 (0~100)',
      'dateBetween(prop("마감일"), now(), "days") — D-Day 카운터',
      'if(prop("상태") == "완료", "완료", if(prop("마감일") < now(), "지연", "진행중")) — 상태 자동화',
      'prop("완료 항목") / prop("전체 항목") * 100 — 완료율 롤업',
    ],
    multiDbRelationPattern: {
      description: '발화 키워드 감지 시 최소 2~4개 DB를 관계형으로 자동 확장',
      example: {
        trigger: '"독서노트 만들어줘"',
        expansion: [
          '도서 DB (제목, 저자, 카테고리, 상태, 평점)',
          '인용구 DB (문장, 페이지, 도서→Relation, 테마 태그)',
          '저자 DB (이름, 국적, 대표작→Relation)',
          '독서목표 DB (월별 목표권수, 달성→Rollup progress())',
        ],
      },
    },
  },
} as const;

export const CANVAS_LIFE_HUB = {
  id: 'life',
  label: '② 라이프 허브 (Life Assistant)',
  icon: '🌿',
  route: '/life',
  corePurpose: '일정/할일/가계부/이메일 4모듈 통합 라이프 OS',
  modules: {
    schedule: {
      label: '1. 스마트 일정',
      features: [
        '구글 캘린더 / 노션 캘린더 양방향 연동',
        '주간 5열 타임라인 뷰 (7일 슬라이딩)',
        '드래그&드롭 일정 이동 (ID 참조 기반)',
        '색상 카테고리 자동 분류 (업무/개인/건강/학습)',
        'AI 음성 자연어 → 즉각 일정 생성',
      ],
    },
    todo: {
      label: '2. 스마트 할일',
      features: [
        'D-Day 실시간 카운터 (dateBetween 수식)',
        '우선순위 3단 분류 (높음/보통/낮음)',
        '진행률 게이지 바 (하위 체크박스 완료율)',
        '이메일에서 1클릭 스마트할일 등록',
        '알림 일정 연동 (브라우저 Notification API)',
      ],
    },
    finance: {
      label: '3. 가계부 (Expense Analytics)',
      features: [
        '월간 예산 페이싱 게이지 (Copilot Money급)',
        '카테고리별 다차원 지출 분석 바 차트',
        'AI 누수/이상 지출 탐지 (Gemini 심층 진단)',
        '영수증 OCR 자동 파싱 (이미지 → 지출 항목)',
        '잔여 예산 컴팩트 축약 표시 (2,450,000원 → 245만)',
        '노션 DB 지출 페이지 원클릭 생성',
      ],
      compactAmountFormat: '10,000원 이상은 "만" 단위 축약 표시 (formatCompactAmount 헬퍼)',
    },
    email: {
      label: '4. 이메일 요약',
      features: [
        'AI 1줄 긴급도 자동 분류 (긴급/중요/참조)',
        '수퍼휴먼급 원문 서랍 뷰어 (슬라이드오버)',
        '첨부파일 즉시 다운로드 (PDF/DOCX/XLSX/ZIP)',
        '3단 상황 맞춤형 AI 답장 생성 (수락/재조율/거절)',
        '스마트할일 1클릭 전송',
        '4분할 컴팩트: 이모지만 표시, 풀뷰: 텍스트 포함',
      ],
    },
  },
} as const;

export const CANVAS_OFFICE_STUDIO = {
  id: 'devlab',
  label: '③ AI 오피스 스튜디오 (Office Studio)',
  icon: '📄',
  route: '/devlab',
  corePurpose: '3대 비즈니스 문서(Docs·Sheets·Slides) 및 NotebookLM 지식 연동 라이브 캔버스',
  features: [
    '📄 스마트 독스 (Napkin AI 규격 개조식 보고서 & A4 뷰어)',
    '📊 스마트 시트 (Rows 연산 =SUM/=AVERAGE 수식 실시간 그리드)',
    '📑 스마트 슬라이드 (Gamma 스타일 16:9 프레젠테이션 프리뷰)',
    '📚 NotebookLM 참고 소스 RAG 팩트 인용 뱃지 연동',
    '⚡ 노션 워크스페이스 원클릭 라이브 내보내기',
    '📋 자유 기획 / 표준 회사 양식 듀얼 모드 토글',
  ],
  techStackCoverage: [
    'React 18 / Next.js App Router',
    'TypeScript / JavaScript ES2024',
    'Tailwind CSS / Vanilla CSS',
    'Notion API / Gemini API',
    'Rows / Napkin AI / Gamma Benchmark Specs',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. 글로벌 상용 템플릿 능가 4대 설계 메커니즘
// ─────────────────────────────────────────────────────────────────────────────

export const COMMERCIAL_TEMPLATE_MECHANISMS = {
  contextAutoExpansion: {
    name: '맥락 자동 확장 엔진',
    principle: '단일 키워드 발화 수신 시 관련 DB를 2~4개로 자동 연결/확장하여 고도화 시스템 구성',
    triggerExamples: [
      {
        trigger: '독서노트',
        expanded: ['도서 DB', '인용구 DB', '저자 DB', '독서목표 DB'],
        relations: ['인용구.도서 → 도서 DB', '도서.저자 → 저자 DB', '목표.완료권수 → Rollup(도서 DB)'],
      },
      {
        trigger: '프로젝트 관리',
        expanded: ['프로젝트 DB', '태스크 DB', '팀원 DB', 'OKR 목표 DB'],
        relations: ['태스크.프로젝트 → 프로젝트 DB', '태스크.담당자 → 팀원 DB', '프로젝트.목표 → OKR DB'],
      },
      {
        trigger: '습관 트래커',
        expanded: ['습관 DB', '일일 체크 DB', '통계 DB', '보상 DB'],
        relations: ['체크.습관 → 습관 DB', '통계.완료율 → Rollup(체크 DB)'],
      },
      {
        trigger: 'CRM 고객 관리',
        expanded: ['고객사 DB', '연락 이력 DB', '거래 DB', '제안서 DB'],
        relations: ['연락.고객사 → 고객사 DB', '거래.제안서 → 제안서 DB'],
      },
    ],
    rule: '최소 Relation 2개, Rollup 1개 이상 반드시 포함. 단일 DB 생성은 거부.',
  },
  bestsellerMethodology: {
    name: '베스트셀러 방법론 자동 내장',
    frameworks: {
      PARA: {
        name: 'PARA (Tiago Forte)',
        description: '프로젝트-영역-자원-보관 4계층 지식 관리 시스템',
        layers: [
          'P: Projects — 진행 중 목표 (마감일 있음)',
          'A: Areas — 책임 영역 (반복/루틴)',
          'R: Resources — 참고 자료 (읽기 전용)',
          'A: Archive — 완료/보관 (자동 이동)',
        ],
      },
      GTD: {
        name: 'GTD — Getting Things Done (David Allen)',
        description: '수집-정리-검토-실행-계획의 5단계 생산성 시스템',
        layers: [
          'Capture — 수집함 (Inbox DB)',
          'Clarify — 분류 (2분 규칙)',
          'Organize — 프로젝트/영역/다음행동 분류',
          'Reflect — 주간 검토 대시보드',
          'Engage — 오늘 집중 뷰 (Today 필터)',
        ],
      },
      OKR: {
        name: 'OKR — Objectives & Key Results (Google/Intel)',
        description: '목표-핵심결과 계층 구조 전사 성과 관리',
        layers: [
          'O: Objective — 정성적 분기 목표',
          'KR: Key Results — 정량 측정 지표 (progress() 게이지)',
          'Initiative — 실행 과제 (할일 DB Relation)',
        ],
      },
    },
    rule: '요청 맥락에 가장 적합한 방법론 1~2개 자동 선택하여 DB 구조에 녹임.',
  },
  formulaV2Enforcement: {
    name: 'Formulas 2.0 자동 주입 (강제)',
    rule: '모든 생성 템플릿에 아래 수식 중 최소 2개 이상 반드시 포함',
    mandatoryFormulas: [
      {
        name: '진행률 게이지 바',
        formula: 'toNumber(prop("완료 항목")) / toNumber(prop("전체 항목")) * 100',
        display: 'progress() — 시각적 게이지 바 자동 렌더링',
        useCase: '프로젝트, 습관, OKR, 독서목표 등 모든 달성률 추적',
      },
      {
        name: 'D-Day 카운터',
        formula: 'dateBetween(prop("마감일"), now(), "days")',
        display: '양수: 남은 일수, 음수: 지연 일수',
        useCase: '프로젝트 마감, 시험, 이벤트, 목표 기한',
      },
      {
        name: '상태 자동화 뱃지',
        formula: 'if(prop("완료"), "완료", if(prop("마감일") < now(), "지연", if(prop("진행중"), "진행중", "시작전")))',
        display: '이모지 상태 자동 변환',
        useCase: '모든 작업/프로젝트/습관 상태 표시',
      },
      {
        name: '경과 시간 계산',
        formula: 'dateBetween(now(), prop("시작일"), "days") + "일 경과"',
        display: '프로젝트/습관 지속 기간 추적',
        useCase: '습관 연속 일수, 프로젝트 진행 기간',
      },
      {
        name: '가중 우선순위 점수',
        formula: 'if(prop("긴급도") == "높음", 3, if(prop("긴급도") == "중간", 2, 1)) * if(prop("중요도") == "높음", 3, 2)',
        display: '아이젠하워 매트릭스 자동 점수화',
        useCase: '할일/프로젝트 우선순위 자동 정렬',
      },
    ],
  },
  valueAddCounterProposal: {
    name: 'Value-Add 역제안 및 고도화 제안',
    principle: '사용자가 단순 요청을 해도 더 강력한 시스템을 역제안',
    comparisonMatrix: [
      {
        userRequest: '"할일 목록 만들어줘"',
        basicTemplate: '제목 + 체크박스 단순 리스트',
        architectVersion: 'GTD Inbox + 프로젝트 Relation + D-Day + 우선순위 + 진행률 게이지 + 주간 검토 대시보드 뷰',
        addedValue: ['GTD 5단계 워크플로우', 'D-Day 수식', '우선순위 자동 정렬', '주간 검토 필터 뷰'],
      },
      {
        userRequest: '"독서 기록 노트"',
        basicTemplate: '책 제목 + 메모 텍스트',
        architectVersion: '도서/인용구/저자/목표 4DB 관계형 + 월간 독서 페이싱 게이지 + 독서 지도 갤러리 뷰',
        addedValue: ['4DB 멀티 관계형', '인용구 분류 태깅', '독서 목표 달성률 게이지', '저자별 갤러리'],
      },
      {
        userRequest: '"프로젝트 관리"',
        basicTemplate: '제목 + 상태 + 담당자',
        architectVersion: 'OKR 계층 + 태스크/이정표 서브DB + 팀원 Relation + Gantt 타임라인 뷰 + 리스크 레지스터',
        addedValue: ['OKR 목표 연계', 'Gantt 타임라인', '이정표 자동 D-Day', '리스크 자동 분류'],
      },
    ],
    responsePattern: '역제안 문구: "기본 요청보다 훨씬 강력한 [XXX급] 시스템을 제안드립니다. 기존 단순 템플릿 대비 [YYY] 기능이 추가됩니다."',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. 알려진 런타임 버그 패턴 카탈로그
// ─────────────────────────────────────────────────────────────────────────────

export const KNOWN_BUG_PATTERNS = [
  {
    id: 'BUG-001',
    name: '4분할 오버플로우 — 금액 박스 이탈',
    severity: 'medium',
    affectedComponents: ['ExpenseAnalyticsView.tsx', '가계부 4대 지표 카드'],
    symptom: '2,450,000원 같은 큰 숫자가 isCompact 모드에서 박스 경계를 넘어 렌더링됨',
    rootCause: [
      'whitespace-nowrap + 긴 숫자 문자열 조합으로 min-content 폭 초과',
      'overflow-hidden / min-w-0 미적용으로 flex 자식 요소 축소 불가',
    ],
    fixPattern: [
      '숫자 축약: formatCompactAmount() 함수 — 10,000 이상은 "만" 단위 표시',
      'min-w-0 overflow-hidden을 컨테이너와 텍스트 래퍼 양측에 적용',
      'isCompact 시 whitespace-nowrap → truncate 전환',
    ],
    status: 'fixed',
    fixedInCommit: '914f66d',
  },
  {
    id: 'BUG-002',
    name: 'STT 중복 증식 — 음성 인식 텍스트 누적',
    severity: 'high',
    affectedComponents: ['HomePage.tsx', 'SpeechRecognition 훅'],
    symptom: '마이크 버튼 토글 반복 시 이전 음성 인식 결과가 입력창에 중복 누적되어 쌓임',
    rootCause: [
      'onresult 이벤트 핸들러가 매 utterance마다 transcript를 append하지 않고 전체를 재set',
      'recognition.abort() 미호출로 이전 세션 결과가 새 세션에 혼입',
      'isFinal 분기 없이 interim 결과를 즉시 상태에 반영',
    ],
    fixPattern: [
      'useRef로 음성 세션 누적 버퍼 분리: sessionTranscript.current = ""',
      'isFinal 분기: final 결과만 상태에 set, interim은 preview로만 표시',
      'recognition.stop() → abort() 순서 보장 후 새 세션 시작',
      'startRecognition 호출 시 입력창 값 초기화 여부 명시 (clearOnStart 옵션)',
    ],
    status: 'known',
  },
  {
    id: 'BUG-003',
    name: '일정 이동 시 ID 미참조 중복 생성',
    severity: 'high',
    affectedComponents: ['ScheduleView.tsx', 'ScheduleDrawer.tsx', 'notionLifeHubSync.ts'],
    symptom: '드래그&드롭으로 일정을 이동하면 기존 항목 업데이트 대신 중복 항목이 새로 생성됨',
    rootCause: [
      'onDrop 핸들러에서 item.notionPageId 확인 없이 항상 create 호출',
      'localId와 notionPageId 혼용 — 노션 동기화 시 ID 추적 실패',
      'setScheduleItems 배열 교체 시 참조 ID 소실',
    ],
    fixPattern: [
      'item.notionPageId 존재 여부로 create/update 분기: if (item.notionPageId) → PATCH /pages/{id}',
      'localId를 uuid v4로 고정 생성, notionPageId는 생성 응답 후 별도 저장',
      'updateScheduleItem 함수: 기존 배열에서 id 매칭 후 in-place 업데이트',
    ],
    status: 'known',
  },
  {
    id: 'BUG-004',
    name: '이메일 필터 툴바 카드 이탈',
    severity: 'low',
    affectedComponents: ['EmailManagerView.tsx', '긴급도 필터 탭'],
    symptom: '4분할 컴팩트 모드에서 긴급도 필터 탭 텍스트가 카드 테두리 밖으로 밀림',
    rootCause: [
      '필터 탭 컨테이너에 shrink-0 미적용으로 헤더 영역과 함께 압축됨',
      '각 버튼 내 이모지+한국어 텍스트가 좁은 폭에서 강제 줄바꿈',
    ],
    fixPattern: [
      '필터 탭 컨테이너: shrink-0 추가',
      'isCompact 모드: 이모지만 표시 ("🚨"), 풀뷰: "🚨 긴급" 표시',
      '헤더 타이틀 컨테이너: min-w-0 flex-1 추가',
    ],
    status: 'fixed',
    fixedInCommit: '914f66d',
  },
  {
    id: 'BUG-005',
    name: '퀵 캡처 STT 세션 후 화면 깜빡임',
    severity: 'low',
    affectedComponents: ['quickCaptureService.ts', 'QuickCaptureModal'],
    symptom: '음성 입력 완료 후 모달이 순간 깜빡이거나 빈 상태로 초기화됨',
    rootCause: [
      'STT onend 이벤트와 React 상태 업데이트 타이밍 충돌',
      'useEffect 클린업 함수에서 음성 세션 abort() 호출 후 UI 상태 미정리',
    ],
    fixPattern: [
      'onend 핸들러에서 setTimeout(..., 100) 버퍼 후 UI 상태 업데이트',
      'isMounted ref로 언마운트 후 상태 업데이트 방어',
    ],
    status: 'known',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. 정밀 수정 프롬프트 템플릿 생성 포맷
// ─────────────────────────────────────────────────────────────────────────────

export const FIX_PROMPT_TEMPLATE_FORMAT = {
  schema: {
    step: '[Step N: 단계 제목]',
    problemStatement: '[현상] 어떤 컴포넌트의 어떤 요소가 어떤 상황에서 어떻게 잘못 보임/동작함',
    rootCauseHypothesis: '[추정 원인] CSS 클래스명/함수명/상태 변수명 단위까지 특정',
    fixInstruction: '[수정 지시] 파일/함수/클래스 명시하여 어떻게 수정할지 서술',
    verificationStep: '[검증 기준] 수정 후 어떤 화면/조건에서 어떻게 확인할 것인지',
    buildCheck: 'npm run build 실행 후 TypeScript 에러 0개 확인',
    commitAndPush: 'git commit -m "fix(컴포넌트): 수정 내용 요약" 후 main 브랜치 푸시',
  },
  readyMadePrompts: {
    'BUG-001': [
      '[Step X: 가계부 컴팩트 금액 오버플로우 수정]',
      'ExpenseAnalyticsView.tsx의 isCompact 모드 4대 지표 카드에서',
      '큰 금액(예: 2,450,000원)이 박스를 뚫고 나가는 현상을 수정해줘.',
      '- formatCompactAmount() 헬퍼 추가 (만 단위 축약)',
      '- 카드 컨테이너에 min-w-0 overflow-hidden 추가',
      '- isCompact 시 text-sm + truncate 적용',
      '수정 후 npm run build 통과 확인 및 main 브랜치 푸시.',
    ],
    'BUG-002': [
      '[Step X: STT 음성 인식 중복 증식 수정]',
      'HomePage.tsx의 SpeechRecognition onresult 핸들러에서',
      '마이크 토글 반복 시 이전 인식 결과가 중복 누적되는 현상 수정.',
      '- useRef로 sessionTranscript 버퍼 분리',
      '- isFinal 분기: final 결과만 상태 반영',
      '- recognition.abort() 호출 후 새 세션 시작',
      '수정 후 npm run build 통과 확인 및 main 브랜치 푸시.',
    ],
    'BUG-003': [
      '[Step X: 일정 드래그 시 중복 생성 수정]',
      'ScheduleView.tsx의 onDrop 핸들러에서',
      '일정 이동 시 기존 항목 업데이트가 아닌 새 항목 생성이 되는 현상 수정.',
      '- item.notionPageId 존재 여부로 create/PATCH 분기',
      '- localId와 notionPageId 추적 분리',
      '- updateScheduleItem 함수: 배열 in-place 업데이트',
      '수정 후 npm run build 통과 확인 및 main 브랜치 푸시.',
    ],
    'BUG-004': [
      '[Step X: 이메일 필터 탭 카드 이탈 수정]',
      'EmailManagerView.tsx의 isCompact 모드에서',
      '긴급도 필터 탭이 카드 테두리 밖으로 밀리는 현상 수정.',
      '- 필터 탭 컨테이너: shrink-0 추가',
      '- isCompact: 이모지만("🚨"), 풀뷰: "🚨 긴급" 텍스트 포함',
      '- 헤더 타이틀 컨테이너: min-w-0 flex-1 추가',
      '수정 후 npm run build 통과 확인 및 main 브랜치 푸시.',
    ],
  },
  customPromptGuide: [
    '1. 영향받는 파일명과 함수/컴포넌트명을 명시하라',
    '2. 재현 조건을 구체적으로 서술하라 (예: isCompact=true, 금액 100만 이상일 때)',
    '3. 기대 동작과 실제 동작을 비교 서술하라',
    '4. CSS 클래스나 TypeScript 타입 단위로 원인을 좁혀라',
    '5. 수정 범위를 최소화하라 — 관련 없는 파일 건드리지 말 것',
    '6. 반드시 npm run build 검증을 마지막 단계로 포함하라',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Gemini 시스템 프롬프트 주입 디렉티브
// ─────────────────────────────────────────────────────────────────────────────

export const GEMINI_SYSTEM_DIRECTIVES = {
  templateMasterDirective: [
    '당신은 Notion Architect의 템플릿 마스터 AI입니다.',
    '사용자의 단순 발화를 받으면 반드시 다음 규칙을 따르세요:',
    '1. [맥락 자동 확장] 단일 요청이라도 최소 2~4개 관련 DB를 관계형(Relation)으로 확장 설계하세요.',
    '2. [Formulas 2.0 강제] 진행률 게이지, D-Day 카운터, 상태 자동화 수식을 반드시 포함하세요.',
    '3. [방법론 적용] PARA/GTD/OKR 중 맥락에 적합한 방법론을 자동 선택하여 DB 구조에 녹이세요.',
    '4. [역제안] 시중 단순 템플릿 대비 어떤 기능이 추가되었는지 명시하여 가치를 어필하세요.',
    '5. 응답은 반드시 구조화된 JSON으로 반환하세요 (notionSchema 필드 포함).',
  ].join('\n'),
  lifeHubDirective: [
    '당신은 Notion Architect의 라이프 비서 AI입니다.',
    '사용자의 일상 발화(일정, 할일, 지출, 이메일)를 즉각 분류하여:',
    '1. 일정: date, time, category, location 추출 → 스마트일정 등록',
    '2. 할일: title, deadline, priority, dDay 추출 → 스마트할일 등록',
    '3. 지출: amount, category, merchant, paymentMethod 추출 → 가계부 등록',
    '4. 이메일: urgency(urgent/important/info), summary 1줄 생성',
    '5. 복합 의도: 하나의 발화에서 여러 항목을 동시에 추출하여 다중 작업(RoutedNotionTask[]) 반환.',
  ].join('\n'),
  errorDiagnosisDirective: [
    '당신은 Notion Architect의 자체 진단 AI입니다.',
    '사용자가 버그/오류를 언급하면:',
    '1. KNOWN_BUG_PATTERNS 지식 베이스에서 일치하는 패턴을 찾으세요.',
    '2. 일치 패턴 발견 시: fixPattern을 한국어로 설명하고 정밀 수정 프롬프트를 생성하세요.',
    '3. 신규 버그 발견 시: FIX_PROMPT_TEMPLATE_FORMAT.schema 양식으로 프롬프트를 생성하세요.',
    '4. 반드시 영향받는 파일명, 함수명, CSS 클래스명 단위로 원인을 특정하세요.',
  ].join('\n'),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7. 버전 및 변경 이력
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_SPEC_META = {
  version: '1.0.0',
  createdAt: '2026-09-18',
  author: 'Notion Architect AI Team',
  description: 'Gemini 상시 참조 시스템 지식 베이스 — 순수 상수 모듈',
  changelog: [
    {
      version: '1.0.0',
      date: '2026-09-18',
      changes: [
        '최초 생성: 프로젝트 개요, 3대 캔버스 명세 정의',
        '상용 템플릿 능가 4대 메커니즘 주입 (맥락확장, 방법론, Formulas2.0, 역제안)',
        '알려진 버그 패턴 5종 카탈로그 (BUG-001 ~ BUG-005)',
        '정밀 수정 프롬프트 템플릿 포맷 및 즉시 사용 예시 4종',
        'Gemini 시스템 프롬프트 주입 디렉티브 3종',
      ],
    },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. 편의 재내보내기 — 단일 객체로 전체 스펙 접근
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_SPEC = {
  project: PROJECT_OVERVIEW,
  canvases: {
    templateMaster: CANVAS_TEMPLATE_MASTER,
    lifeHub: CANVAS_LIFE_HUB,
    officeStudio: CANVAS_OFFICE_STUDIO,
    devLab: CANVAS_OFFICE_STUDIO,
  },
  commercialMechanisms: COMMERCIAL_TEMPLATE_MECHANISMS,
  knownBugs: KNOWN_BUG_PATTERNS,
  fixPromptFormat: FIX_PROMPT_TEMPLATE_FORMAT,
  geminiDirectives: GEMINI_SYSTEM_DIRECTIVES,
  meta: SYSTEM_SPEC_META,
} as const;

export default SYSTEM_SPEC;
