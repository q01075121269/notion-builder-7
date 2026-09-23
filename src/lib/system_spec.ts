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
  version: '2.1.0',
  stack: {
    frontend: 'React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons (SPA)',
    backend: 'Vercel Serverless Functions (/api/gemini, /api/notion, /api/orchestrator)',
    ai: 'Google Gemini 3.6 Flash / Gemini 3.8 Flash (멀티모달: 텍스트 + 이미지 비전)',
    notionApi: 'Notion REST API v2022-06-28 (350ms 쓰로틀, 지수 백오프 3회)',
    voice: 'Web Speech API (SpeechRecognition STT / SpeechSynthesis TTS, 한국어)',
    storage: 'localStorage + sessionStorage + IndexedDB (서버 DB 없음, 군사 등급 파기)',
    deploy: 'Vercel (자동 CI/CD, main 브랜치 푸시 트리거)',
  },
  routing: {
    home: '/',
    builder: '/builder',
    lifeHub: '/life',
    devLab: '/devlab',
    mediaLab: '/media',
    description: 'URL History(popstate) 연동 독립 작업실 4대 챕터 탭 구조',
  },
  dataFlow: [
    '① 사용자 입력 (텍스트 / 한국어 음성 STT / 영수증 및 문서 사진 / 웹 스크랩 URL)',
    '② Canvas 이미지 압축 (최대 1024px, JPEG quality 0.8) 또는 IndexedDB 1계층 캐싱',
    '③ POST /api/orchestrator → Gemini 멀티인텐트 및 워크슬롭 방어 분석',
    '④ RoutedNotionTask[] 생성 및 스키마 마이그레이션(In-Place Migration) 판단',
    '⑤ POST /api/notion → Notion DB 생성 또는 무손실 속성 패치(Append/Wrapper)',
    '⑥ 완료 토스트 + 진동 Haptic + TTS 음성 브리핑 + 감사 로그(Heartbeat) 기록',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. 4대 핵심 캔버스 명세 (Canvas Specs)
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_TEMPLATE_MASTER = {
  id: 'builder',
  label: '① 노션 빌더 (Template Master)',
  icon: '🏗️',
  route: '/builder',
  corePurpose: '단순 발화 하나로 상용 유료급 노션 멀티 DB 스키마를 신규 설계(Create)하거나 기존 템플릿을 무손실 업그레이드(Upgrade)',
  engineCapabilities: [
    '자연어 의도 분석 → 최적 DB 스키마 자동 매핑',
    '신규 생성(Create) & 기존 템플릿 무손실 업그레이드(In-Place Migration) 듀얼 모드',
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

export const CANVAS_MEDIA_LAB = {
  id: 'media_lab',
  label: '④ AI 미디어 랩 (AI Media Lab)',
  icon: '🎬',
  route: '/media',
  corePurpose: '이미지·비디오·오디오 멀티모달 생성 스튜디오 & IndexedDB 1계층 에셋 캐시 보관소',
  features: [
    '🎨 이미지 스튜디오 (프롬프트/스타일/비율 제어, 고해상도 생성 및 다운로드)',
    '🎥 비디오 스튜디오 (시나리오 기반 장면 렌더링, 16:9 / 9:16 쇼츠 변환)',
    '🎙️ 오디오 스튜디오 (한국어 고품질 음성 합성, 나레이션 마스터링)',
    '💾 1계층 IndexedDB 캐시 에셋 보관함 (오프라인 보존 & 원클릭 복원)',
    '🔗 노션 미디어 스크랩 DB(master_media_scrap_db_id) 실시간 동기화',
    '📑 오피스 스튜디오 및 라이프 허브로 원클릭 에셋 삽입 브릿지',
  ],
  techStackCoverage: [
    'IndexedDB (MediaLabDB / media_items)',
    'Canvas 2D / Web Audio API',
    'Gemini Vision / Imagen / Media AI Engines',
    'Notion Files & Media Property Integration',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2.5. 4대 챕터 마스터 아키텍처 및 크로스 라우팅 명세 (Master Chapter Spec)
// ─────────────────────────────────────────────────────────────────────────────

export const MASTER_CHAPTER_SPEC = {
  version: '2.1.0',
  title: 'Notion Architect 4-Chapter Core Ecosystem',
  chapters: {
    chapter1: {
      ...CANVAS_TEMPLATE_MASTER,
      chapterIndex: 1,
      role: '템플릿 마스터: 신규 멀티 DB 설계 및 기존 노션 템플릿 무손실 업그레이드',
    },
    chapter2: {
      ...CANVAS_LIFE_HUB,
      chapterIndex: 2,
      role: '라이프 비서: 개인 라이프 OS(일정/할일/가계부/이메일) 통합 관리',
    },
    chapter3: {
      ...CANVAS_OFFICE_STUDIO,
      chapterIndex: 3,
      role: '오피스 스튜디오: 3대 실무 문서(Docs·Sheets·Slides) 및 NotebookLM 지식 연동',
    },
    chapter4: {
      ...CANVAS_MEDIA_LAB,
      chapterIndex: 4,
      role: 'AI 미디어 랩: 이미지·비디오·오디오 에셋 제작 및 IndexedDB/노션 미디어 아카이빙',
    },
  },
  crossChapterRouting: {
    mediaToOffice: '미디어 랩에서 생성된 이미지/차트/오디오는 오피스 스튜디오 Docs/Slides 본문에 1클릭 삽입',
    mediaToLife: '영수증 이미지 및 미디어 첨부물은 라이프 허브 가계부/할일 항목의 Notion Files 속성으로 직결',
    officeToTemplateMaster: '오피스 스튜디오에서 구조화된 표/문서는 템플릿 마스터의 신규 DB 행 또는 마스터 DB로 원클릭 동기화',
    lifeToTemplateMaster: '라이프 허브의 핵심 업무 일정 및 프로젝트 할일은 템플릿 마스터의 OKR/프로젝트 DB와 양방향 Relation 매핑',
  },
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
// 3.5. [핵심] 기존 템플릿 무손실 업그레이드 & 스키마 마이그레이션 (In-Place Migration)
// ─────────────────────────────────────────────────────────────────────────────

export const SCHEMA_MIGRATION_SPEC = {
  name: 'Zero-Data-Loss In-Place Migration Engine',
  version: '2.1.0',
  description: '기존 노션 템플릿과 데이터베이스의 데이터를 100% 무손실 보존하며 최신 수식과 지능형 에이전트 레이아웃으로 차분 패치하는 규격',
  operatingModes: {
    create: {
      mode: 'CREATE_NEW',
      description: '사용자가 빈 페이지 또는 신규 워크스페이스에 완전히 새로운 멀티 DB 시스템을 구축하는 모드',
      strategy: '풀 스키마 생성 및 초기 시드 뷰 배치',
    },
    upgrade: {
      mode: 'IN_PLACE_MIGRATION',
      description: '이미 실무에서 사용 중인 기존 노션 DB의 데이터를 파괴하지 않고 최신 Formulas 2.0 및 2단 대시보드로 리모델링하는 모드',
      strategy: '차분(Diff) 속성 패치(Append) + 래퍼(Wrapper) 레이아웃 결합',
    },
  },
  zeroDataLossPrinciples: [
    {
      ruleId: 'ZDL-001',
      title: '고유 식별자(ID) 및 원본 행(Row) 100% 보존',
      detail: '기존 데이터베이스의 database_id, 기존 페이지들의 page_id, 생성일시, 작성자, 코멘트 이력을 일체 삭제하거나 재생성하지 않음.',
      validation: '마이그레이션 전후 DB 행 수(Row count) 및 고유 ID 집합 일치율 100% 검증 필수',
    },
    {
      ruleId: 'ZDL-002',
      title: '차분(Diff) 기반 안전 속성 덧붙이기 (Append-Only Patch)',
      detail: '기존 DB의 컬럼(Properties)은 수정/삭제하지 않으며, 신규 Formulas 2.0 수식, 품질 게이트(Quality_Status), 상호 관계형(Relation) 등 결손 속성만 안전하게 PATCH로 추가.',
      conflictHandling: '기존 속성명과 동일한 명칭 충돌 시 기존 속성을 유지하고 신규 수식은 `AI_` 또는 `F2_` 접두사를 부여하여 충돌 방지',
    },
    {
      ruleId: 'ZDL-003',
      title: '비대칭 2단 대시보드 래퍼(Wrapper) 레이아웃 결합',
      detail: '기존 페이지 본문(Blocks)의 내용을 삭제하지 않고, 페이지 상단에 비대칭 2단 대시보드(KPI 지표 바 + 에이전트 콜아웃 + 빠른 필터)를 Wrapper 형태로 프리펜드(Prepend) 주입.',
      layoutStructure: {
        topSection: '비대칭 2단 래퍼: [좌측 65% 실시간 KPI 바 & 진행률 게이지] + [우측 35% 에이전트 지능형 콜아웃 & 긴급 알림]',
        middleSection: '실시간 Formulas 2.0 스마트 뷰 탭 (오늘 마감, 우선순위 보드, 지연 항목 경고)',
        bottomSection: '원본 사용자 데이터베이스 및 아카이브 본문 블록 (100% 원형 보존)',
      },
    },
    {
      ruleId: 'ZDL-004',
      title: '경량 감사 DB(Agent_Heartbeat_Log) 자동 연동',
      detail: '업그레이드된 모든 템플릿 하단에 변경 내역, 자동화 트리거 실행 로그, 데이터 무결성 검수 결과를 기록하는 감사 DB 연결',
    },
  ],
  diffPatchSteps: [
    '1. [스키마 스캔]: 기존 DB 속성 목록(names, types) 및 레코드 수 분석',
    '2. [차분 산출]: 필수 Formulas 2.0 및 에이전트 속성 중 미보유 항목(Diff) 추출',
    '3. [안전 주입]: PATCH /v1/databases/{id} 호출로 신규 속성만 추가(Append)',
    '4. [래퍼 렌더]: 기존 페이지 상단에 KPI 대시보드 및 에이전트 콜아웃 블록 배치',
    '5. [무결성 검수]: 원본 데이터 손실 0건 및 수식 연산 정상 작동 확인',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3.6. 노션 커스텀 에이전트(Notion Agent 3.0) 5대 벤치마크 지능 규격
// ─────────────────────────────────────────────────────────────────────────────

export const NOTION_AGENT_BLUEPRINT_SPEC = {
  version: '3.0.0',
  name: 'Notion Custom Agent 3.0 Benchmark Architecture',
  tagline: '단순 챗봇을 넘어선 자율형 노션 상주 에이전트 지능 시스템',
  fiveBenchmarks: {
    benchmark1_modularSkills: {
      id: 'BENCH-01',
      name: '모듈형 에이전트 스킬 (Agent Skills Architecture)',
      description: '에이전트의 업무를 단일 거대 프롬프트가 아닌 독립 실행 가능한 모듈 단위 스킬로 분리하여 실행',
      coreSkills: [
        'imminent_deadline_notifier — 마감 24시간/3일 전 자동 감지 및 긴급 경고 발송',
        'dday_auto_refresher — 자정 기준 dateBetween 수식 및 D-Day 카운터 정밀 동기화',
        'weekly_summary_briefer — 주간 완료 태스크 통계 집계 및 매주 월요일 아침 브리핑',
        'budget_overflow_guard — 월간 지출 예산 한도 80%/100% 초과 시 즉각 경고 및 절감 가이드',
        'risk_detector — 지연 일수 3일 이상 누적 프로젝트 자동 탐지 및 리스크 레지스터 등록',
      ],
      executionRule: '각 스킬은 입력 조건, 처리 로직, 노션 DB 변경 사항, 출력 알림 형식을 엄격히 분리하여 캡슐화',
    },
    benchmark2_multiTriggers: {
      id: 'BENCH-02',
      name: '다중 복합 트리거 및 이벤트 체이닝 (Multi-Triggers & Event Chaining)',
      description: '단순 대화 입력뿐만 아니라 시간 기반 스케줄, 노션 내부 변경, 외부 도구 이벤트를 유기적으로 결합',
      triggerTypes: [
        {
          type: 'Schedule-Trigger',
          examples: ['매일 아침 09:00 데일리 브리핑', '매주 일요일 21:00 주간 회고 리포트', '매월 말일 18:00 가계부 결산'],
        },
        {
          type: 'Notion-Event-Trigger',
          examples: ['태스크 상태가 "진행중" → "검수요청"으로 변경 시 QA 에이전트 자동 호출', '신규 고객사 DB 행 추가 시 웰컴 메일 템플릿 생성'],
        },
        {
          type: 'External-Event-Trigger',
          examples: ['Notion Mail/수퍼휴먼 수신 이메일 긴급도 감지 시 즉각 할일 생성', 'Slack 멘션 시 노션 회의록 자동 요약 첨부'],
        },
      ],
      chainingRule: '트리거 감지 → 조건 필터(Filter) 평가 → 서브 에이전트 라우팅 → 노션 DB PATCH → Heartbeat 로그 기록',
    },
    benchmark3_subAgentHierarchy: {
      id: 'BENCH-03',
      name: '서브 에이전트 분업 조직도 (Master PM & Sub-Agent Squad)',
      description: '복잡한 프로젝트 템플릿을 한 명의 AI가 아닌 총괄 PM과 전문 실무 서브 에이전트의 협동 조직망으로 운영',
      organization: {
        masterPmAgent: {
          role: '총괄 PM 에이전트 (Master Project Director)',
          duties: ['전체 프로젝트 로드맵 수립', 'OKR/KPI 진척도 상시 감독', '서브 에이전트 간 우선순위 조율 및 통합 데일리 브리핑 작성'],
        },
        taskAgent: {
          role: '실무 태스크 에이전트 (Task & Sprint Orchestrator)',
          duties: ['일일 할일 자동 배분', 'Formulas 2.0 D-Day 카운터 모니터링', '병목 태스크 담당자 넛지 알림'],
        },
        qaAgent: {
          role: '품질 & 검수 에이전트 (Quality Gatekeeper)',
          duties: ['산출물 체크리스트 100% 충족 여부 검증', 'Verified 공식 뱃지 부여', 'Work-slop 및 불량 포맷 차단'],
        },
        commsAgent: {
          role: '커뮤니케이션 에이전트 (Comms & Reporting Specialist)',
          duties: ['회의록 3줄 요약', '외부 고객사/팀원 보고용 공유 링크 패키징', '이메일 3단 답장 자동화'],
        },
      },
    },
    benchmark4_memoryVault: {
      id: 'BENCH-04',
      name: '지속 기억 및 개인화 (Persistent Memory Vault)',
      description: '단발성 세션으로 끝나지 않고 사용자의 선호 스타일, 주력 업무 패턴, 단골 DB 명칭을 지속 기억하여 개인화된 경험 제공',
      memoryItems: [
        '사용자 선호 브리핑 스타일: 개조식(Bullet) vs 서술형(Paragraph), 이모지 빈도 선호도',
        '주력 업무 도메인: IT 개발, 마케팅, 디자인, 1인 창업, 학업 등 맞춤형 속성 추천',
        '단골 DB 속성 명칭 패턴: "마감일" vs "Due Date", "상태" vs "Status", "담당자" vs "Assignee" 자동 적응',
        '선호 뷰(View) 타입: Kanban 보드 우선 vs 타임라인 간트차트 우선 vs 캘린더 우선',
      ],
    },
    benchmark5_auditAndQualityGate: {
      id: 'BENCH-05',
      name: '신뢰성 감사 로그 및 품질 게이트 (Audit Trail & Quality Gates)',
      description: '에이전트의 모든 활동을 투명하게 추적하고 사내 공식 지식만 검증 인용하도록 보장',
      specifications: {
        verifiedProperty: {
          propertyName: 'Verified',
          type: 'checkbox | select',
          rule: '사내 지식 DB나 표준 가이드 문서 중 공식 승인된 페이지만 에이전트의 지식 베이스(Grounding Context)로 채택',
        },
        heartbeatLogDbSchema: {
          dbName: 'Agent_Heartbeat_Log',
          description: '에이전트 자율 동작의 정밀 감사 로그를 보관하는 경량 데이터베이스',
          properties: [
            { name: 'Log_ID', type: 'title', description: '로그 고유 식별자 (예: LOG-20260918-090001)' },
            { name: 'Timestamp', type: 'date', description: '트리거 실행 일시' },
            { name: 'Agent_Name', type: 'select', options: ['Master PM', 'Task Agent', 'QA Gatekeeper', 'Comms Agent'], description: '실행 주체' },
            { name: 'Trigger_Event', type: 'select', options: ['Schedule_0900', 'Status_Changed', 'Mail_Received', 'User_Prompt', 'DDay_Sync'], description: '발동 트리거' },
            { name: 'Action_Taken', type: 'rich_text', description: '수행된 작업 상세' },
            { name: 'Status', type: 'select', options: ['Success', 'Warning', 'Failed', 'Needs_Review'], description: '작업 결과' },
            { name: 'Affected_Items', type: 'rich_text', description: '영향을 받은 노션 페이지 ID 또는 DB 행' },
            { name: 'Verification_Notes', type: 'rich_text', description: '품질 검수 표 및 무손실 검증 메모' },
          ],
        },
      },
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3.7. 모듈형 에이전트 스킬 라이브러리 (Agent Skills Library)
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SKILLS_LIBRARY = {
  version: '2.1.0',
  description: '독립 모듈화된 노션 커스텀 에이전트 표준 실행 스킬 라이브러리',
  skills: [
    {
      id: 'skill_deadline_alert',
      name: '마감 임박 긴급 알림 (Imminent Deadline Notifier)',
      trigger: 'Schedule (매일 09:00, 18:00) 또는 사용자 요청',
      targetDb: '할일/프로젝트 DB (D-Day 속성 또는 마감일 기준)',
      logic: 'dateBetween(prop("마감일"), now(), "days") <= 1 AND prop("상태") != "완료" 항목 필터링',
      action: '상단 에이전트 콜아웃 박스에 🚨 긴급 마감 임박 항목 목록 및 1클릭 완료 버튼 렌더링',
    },
    {
      id: 'skill_dday_refresher',
      name: 'D-Day 자정 자동 동기화 (D-Day Auto Refresher)',
      trigger: 'Schedule (매일 00:01 자정) 또는 페이지 로드 이벤트',
      targetDb: '모든 날짜 및 D-Day 수식을 보유한 Notion DB',
      logic: 'now() 기준 dateBetween 재연산 및 양수(D-N), 음수(D+N 지연) 상태 뱃지 재정렬',
      action: '지연된 항목은 자동으로 "🚨 지연" 태그 갱신 및 PM 알림 큐 적재',
    },
    {
      id: 'skill_weekly_briefing',
      name: '주간 성과 결산 브리핑 (Weekly Summary Briefer)',
      trigger: 'Schedule (매주 월요일 08:30)',
      targetDb: '할일 DB, 프로젝트 DB, 가계부 DB',
      logic: '지난 7일간 완료된 태스크 수, 목표 달성률 롤업 게이지, 총 지출액 합산',
      action: '대시보드 상단에 3줄 하이라이트 요약 렌더링 및 이번 주 집중 과제 TOP 3 자동 추천',
    },
    {
      id: 'skill_budget_guard',
      name: '예산 초과 방어 가드 (Budget Overflow Guard)',
      trigger: 'Notion-Event (가계부 DB 신규 행 추가 또는 수정 시)',
      targetDb: '가계부 DB & 예산 설정 DB',
      logic: '월 누적 지출 합계 > 설정 예산의 80% 또는 100% 초과 여부 비교',
      action: '한도 초과 시 즉각 경고 토스트 팝업, 이상 지출 원인 카테고리 진단 및 절감 플랜 제시',
    },
    {
      id: 'skill_subagent_dispatcher',
      name: '서브 에이전트 작업 분배기 (Sub-Agent Task Dispatcher)',
      trigger: 'User-Prompt (대형 프로젝트 발화 감지 시)',
      targetDb: '프로젝트 DB & 하위 태스크 DB',
      logic: '복합 프로젝트를 기획/디자인/개발/QA 4개 하위 트랙으로 자동 분할',
      action: '각 하위 트랙에 실무 서브 에이전트를 자동 배정하고 상호 Relation 링크 수립',
    },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3.8. AI 워크슬롭(Work-slop) 원천 차단 3대 불문율 (Anti-Workslop Guardrails)
// ─────────────────────────────────────────────────────────────────────────────

export const WORKSLOP_GUARDRAILS = {
  version: '2.1.0',
  name: 'Anti-Workslop 3 Invariable Commandments',
  definition: 'AI 워크슬롭(Work-slop)이란 영혼 없는 미사여구, 실행 불가능한 장황한 텍스트, 출처 없는 환각 데이터 등 실무 가치를 훼손하는 저품질 AI 생성물을 의미함.',
  threeCommandments: [
    {
      commandmentIndex: 1,
      name: '목적 잠그기 (Lock Purpose & Pre-defined Done Condition)',
      rule: '어떤 작업도 사전에 명확한 "완료 조건(Done Definition)"을 정의하지 않고는 생성을 시작할 수 없다.',
      enforcement: [
        '사용자의 모호한 요청("알아서 해줘") 수신 시, 생성 전 필수 포함 DB 수, 속성 종류, 레이아웃 규격을 3줄 이내로 고정 선언',
        '완료 조건 체크리스트(예: DB 3개 연결 완료, 수식 2개 유효성 확인, 뷰 2개 생성)가 100% 충족되었을 때만 응답을 종결',
        '의미 없는 장황한 인사말, 자기소개, 불필요한 서론/결론 문장 일체 삭제 (단도직입적 결과 제시)',
      ],
    },
    {
      commandmentIndex: 2,
      name: '출처 강제 (Strict Source Grounding & Narrow Context Query)',
      rule: '검증된 공식 출처(Verified Pages) 및 명시적으로 연결된 노션 DB 데이터에만 기반하여 사실(Fact)을 기술한다.',
      enforcement: [
        '워크스페이스 내 `Verified = true` 속성을 가진 공식 문서 및 사용자가 직접 입력/연동한 DB 행만 지식 소스로 인용',
        '노션 외부의 불확실한 지식이나 모델의 임의 상상 데이터 주입 엄격 금지',
        '출처가 불분명한 정보는 생성을 생략하거나 "[미확인 데이터: 사용자 확인 필요]" 뱃지로 격리',
      ],
    },
    {
      commandmentIndex: 3,
      name: '통과 기준 정량화 및 자체 검수 표(Verification Table) 출력 강제',
      rule: '모든 생성 결과물 하단에 품질 게이트 통과 여부를 정량적으로 증명하는 검수 표를 의무적으로 출력한다.',
      enforcement: [
        '결과물 생성 후 자체 검수 표(Verification Table)를 마크다운 또는 노션 표 블록으로 필수 동봉',
        '검수 표 필수 포함 지표: 수식 문법 적합성, 관계형 연결 무결성, 기존 데이터 무손실율, 슬롭 제거율',
        '검수 결과 부적합(Fail) 항목 발견 시 응답을 반환하기 전 자동으로 자체 교정(Self-Correction) 수행',
      ],
      standardVerificationTableTemplate: [
        '| 검수 항목 | 통과 기준 | 검수 결과 | 상태 |',
        '| :--- | :--- | :--- | :---: |',
        '| Formulas 2.0 문법 | 오류 없는 정규 Notion 수식 | progress(), dateBetween() 유효 | ✅ PASS |',
        '| 관계형 스키마 무결성 | 최소 2개 이상 DB 상호 Relation 연결 | 3개 DB 양방향 연결 완료 | ✅ PASS |',
        '| 데이터 무손실(Zero Loss)| 기존 행(Row) 및 고유 ID 100% 보존 | 변경 0건 / 순수 추가 100% | ✅ PASS |',
        '| Work-slop 차단율 | 미사여구 배제 및 실행 액션 비율 | 실행 가능 항목 100% | ✅ PASS |',
      ].join('\n'),
    },
  ],
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
// 5.5. 도구(Function Calling) 스키마 정의 (웹크롤러 & AI 오피스 스튜디오)
// ─────────────────────────────────────────────────────────────────────────────

export const FUNCTION_CALLING_SCHEMAS = {
  route_web_crawler: {
    name: 'route_web_crawler',
    description: '웹페이지, 쇼핑몰 리뷰, 뉴스, 공고 등의 데이터를 실시간 수급하여 오피스 스튜디오 라이브 캔버스에 주입',
    parameters: {
      type: 'object',
      properties: {
        target_url: { type: 'string', description: '크롤링/수집 대상 타겟 URL' },
        search_keywords: { type: 'string', description: '수집할 키워드 또는 서치 쿼리' },
        max_depth: { type: 'number', description: '크롤링 탐색 깊이 (기본: 1, 최대: 5)' },
        output_format: { type: 'string', enum: ['sheets', 'docs', 'pdf'], description: '출력 매핑 형식' },
      },
      required: ['target_url', 'output_format'],
    },
  },
  route_office_studio: {
    name: 'route_office_studio',
    description: 'Docs·Sheets·Slides 라이브 캔버스로 구조화된 데이터를 주입하고 노션 DB로 즉시 연동',
    parameters: {
      type: 'object',
      properties: {
        target_mode: { type: 'string', enum: ['docs', 'sheets', 'slides'], description: '대상 오피스 스튜디오 캔버스 모드' },
        payload_data: { type: 'object', description: '주입할 구조화 데이터 (표 행 데이터 또는 A4 리포트 본문)' },
        sync_to_notion: { type: 'boolean', description: '노션 워크스페이스 DB 전송 여부' },
      },
      required: ['target_mode', 'payload_data'],
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Gemini 시스템 프롬프트 주입 디렉티브
// ─────────────────────────────────────────────────────────────────────────────

export const GEMINI_SYSTEM_DIRECTIVES = {
  templateMasterDirective: [
    '당신은 Notion Architect의 템플릿 마스터 AI이자 노션 에이전트 3.0 설계자입니다.',
    '사용자의 요청을 받으면 반드시 다음 규칙을 따르세요:',
    '1. [신규/업그레이드 분기]: 빈 워크스페이스면 Create, 기존 템플릿/DB 연동 시 In-Place Migration(무손실 업그레이드)을 적용하세요.',
    '2. [무손실 원칙 강제]: 기존 데이터의 고유 ID와 행을 100% 보존하고, 신규 Formulas 2.0 및 에이전트 속성만 차분(Append) 패치하세요.',
    '3. [2단 대시보드 래퍼]: 원본 본문을 보존하며 상단에 비대칭 2단 대시보드(KPI 바 + 에이전트 콜아웃)를 결합하세요.',
    '4. [맥락 자동 확장]: 단일 요청이라도 최소 2~4개 관련 DB를 관계형(Relation)으로 확장 설계하세요.',
    '5. [Formulas 2.0 강제]: 진행률 게이지(progress), D-Day 카운터, 상태 자동화 수식을 반드시 포함하세요.',
    '6. [Work-slop 원천 차단]: 완료 조건을 사전 정의하고, 공식 Verified 페이지만 인용하며, 결과물 끝에 자체 검수 표(Verification Table)를 출력하세요.',
    '7. [역제안]: 시중 단순 템플릿 대비 어떤 기능이 추가되었는지 명시하여 가치를 어필하세요.',
    '8. 응답은 반드시 구조화된 JSON으로 반환하세요 (notionSchema 및 verificationTable 필드 포함).',
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
  officeStudioDirective: [
    '당신은 Notion Architect의 AI 오피스 스튜디오 및 리포트 작성 AI입니다.',
    '3대 비즈니스 문서(Docs·Sheets·Slides)를 생성할 때:',
    '1. 스마트 독스: Napkin AI 규격의 명확한 개조식 헤드라인 및 다이어그램 배치.',
    '2. 스마트 시트: Rows 스타일의 =SUM, =AVERAGE 실시간 연산 그리드 구성.',
    '3. 스마트 슬라이드: Gamma 스타일의 16:9 모던 프레젠테이션 카드 렌더링.',
    '4. NotebookLM RAG 팩트 인용 뱃지를 활용해 근거가 확실한 문서만 생성.',
  ].join('\n'),
  agentBlueprintDirective: [
    '당신은 Notion Custom Agent 3.0 설계 오케스트레이터입니다.',
    '에이전트를 설계할 때 5대 벤치마크를 강제 적용하세요:',
    '1. [모듈형 스킬]: 알림, D-Day 동기화, 주간 결산 등 단일 책임 스킬로 분리.',
    '2. [다중 트리거]: 스케줄(매일 09:00), 노션 이벤트(상태 변경), 외부 이벤트(메일 수신)를 체이닝.',
    '3. [서브 에이전트]: 총괄 PM 에이전트와 실무 태스크/QA/커뮤니케이션 에이전트로 역할을 명확히 분업.',
    '4. [지속 기억]: 사용자의 선호 스타일, 주력 업무, 단골 DB 속성 명칭을 기억하고 재반영.',
    '5. [감사 로그]: 하단에 Agent_Heartbeat_Log 경량 DB를 배치하여 모든 자동화 행위를 투명하게 기록.',
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
  version: '2.1.0',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-23',
  author: 'Notion Architect AI Team',
  description: 'Gemini 상시 참조 시스템 지식 베이스 — 노션 에이전트 3.0 & 무손실 마이그레이션 규격 탑재 순수 상수 모듈',
  changelog: [
    {
      version: '2.1.0',
      date: '2026-09-23',
      changes: [
        '기존 템플릿 무손실 업그레이드 & 스키마 마이그레이션(SCHEMA_MIGRATION_SPEC) 규격 신규 탑재',
        '노션 커스텀 에이전트 3.0 5대 벤치마크 지능 규격(NOTION_AGENT_BLUEPRINT_SPEC) 주입',
        '모듈형 에이전트 스킬 라이브러리(AGENT_SKILLS_LIBRARY) 5종 명세화',
        'AI 워크슬롭(Work-slop) 원천 차단 3대 불문율(WORKSLOP_GUARDRAILS) 및 자체 검수 표 강제',
        '4대 챕터 전체 아키텍처 맥락 및 크로스 라우팅 명세(MASTER_CHAPTER_SPEC, CANVAS_MEDIA_LAB) 추가',
        'Gemini 시스템 지침(agentBlueprintDirective, officeStudioDirective) 강화',
      ],
    },
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
  masterChapters: MASTER_CHAPTER_SPEC,
  canvases: {
    templateMaster: CANVAS_TEMPLATE_MASTER,
    lifeHub: CANVAS_LIFE_HUB,
    officeStudio: CANVAS_OFFICE_STUDIO,
    devLab: CANVAS_OFFICE_STUDIO,
    mediaLab: CANVAS_MEDIA_LAB,
  },
  commercialMechanisms: COMMERCIAL_TEMPLATE_MECHANISMS,
  schemaMigration: SCHEMA_MIGRATION_SPEC,
  notionAgent: NOTION_AGENT_BLUEPRINT_SPEC,
  agentSkills: AGENT_SKILLS_LIBRARY,
  workslopGuardrails: WORKSLOP_GUARDRAILS,
  knownBugs: KNOWN_BUG_PATTERNS,
  fixPromptFormat: FIX_PROMPT_TEMPLATE_FORMAT,
  geminiDirectives: GEMINI_SYSTEM_DIRECTIVES,
  tools: FUNCTION_CALLING_SCHEMAS,
  meta: SYSTEM_SPEC_META,
} as const;

export default SYSTEM_SPEC;
