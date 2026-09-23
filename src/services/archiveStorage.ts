import type { 
  ArchivedTemplate, 
  TemplateFolder,
  PromptSnippet, 
  InspirationItem, 
  GoogleSyncConfig 
} from '../types/dashboard';
import { PRESET_TEMPLATES } from './presetTemplates';
import { sanitizeTemplateTitle } from './notionDynamicBuilder';

const STORAGE_KEYS = {
  TEMPLATES: 'notion_archived_templates',
  FOLDERS: 'notion_template_folders',
  PROMPTS: 'notion_prompt_snippets',
  INSPIRATION: 'notion_inspiration_items',
  GOOGLE_SYNC: 'notion_google_sync_config'
};

// 1. 초기 시드 템플릿 데이터
const SEED_TEMPLATES: ArchivedTemplate[] = [
  {
    id: 'arch-tpl-college',
    title: '대학생 올인원 학기 플래너',
    description: '강의 시간표, 주차별 과제 관리, 시험 D-Day 카운트다운 및 학점 계산기를 아우르는 대학 생활 필수 대시보드',
    icon: '🎓',
    cover_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    tags: ['#스터디', '#대학생', '#캘린더연동', '#학업'],
    templateData: PRESET_TEMPLATES.college_student,
    source: 'curated',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: 'arch-tpl-sprint',
    title: '스타트업 애자일 스프린트 & 제품 백로그',
    description: '스프린트 주기 관리, 우선순위 매트릭스, 제품 기획서 및 기능 개발 백로그 칸반 보드',
    icon: '🚀',
    cover_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1600&q=80',
    tags: ['#업무', '#스타트업', '#프로젝트', '#스프린트'],
    templateData: PRESET_TEMPLATES.startup_sprint,
    source: 'curated',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    id: 'arch-tpl-habit',
    title: '스마트 습관 트래커 & 모닝 루틴',
    description: '주간 달성률 시각화, 모닝/나이트 루틴 체크리스트, 스트릭(Streak) 연속 성공 기록부',
    icon: '🌱',
    cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
    tags: ['#라이프스타일', '#루틴', '#자기계발', '#습관'],
    templateData: PRESET_TEMPLATES.habit_tracker,
    source: 'curated',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    id: 'arch-tpl-finance',
    title: '스마트 가계부 & 자산 포트폴리오 대시보드',
    description: '월별 지출 카테고리 분석, 저축 목표 달성률 게이지, 고정 지출 납부일 캘린더 연동 템플릿',
    icon: '💳',
    cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
    tags: ['#라이프스타일', '#재무', '#가계부', '#캘린더연동'],
    templateData: {
      title: '스마트 가계부 & 자산 포트폴리오',
      description: '월별 수입/지출 내역과 고정지출 캘린더 관리 대시보드',
      icon: '💳',
      cover_query: 'finance ledger wallet money',
      cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
      databases: [
        {
          name: '지출 및 수입 내역부',
          properties: [
            { name: '항목명', type: 'title' },
            { name: '거래일자', type: 'date' },
            { name: '금액', type: 'number' },
            { 
              name: '구분', 
              type: 'select', 
              options: ['수입', '지출', '저축/투자'] 
            },
            {
              name: '카테고리',
              type: 'select',
              options: ['식비', '주거/통신', '교통', '문화/취미']
            },
            { name: '결제수단', type: 'select', options: ['신용카드', '체크카드'] }
          ],
          view_type: 'table'
        }
      ],
      page_layout: [
        {
          type: 'callout',
          content: '💡 이번 달 소비 목표: 지출 합계 150만원 이내 유지 및 비상금 50만원 자동 이체!',
          icon: '🎯'
        },
        {
          type: 'heading_2',
          content: '📊 월간 지출 분석 및 예산 대비 현황'
        },
        {
          type: 'bulleted_list_item',
          content: '매월 25일 공과금 자동이체 계좌 잔고 확인'
        },
        {
          type: 'bulleted_list_item',
          content: '실손보험 청구서류 제출 및 카드 대금 선결제'
        }
      ]
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12
  }
];

// 2. 초기 시드 프롬프트 & 스니펫 데이터
const SEED_PROMPTS: PromptSnippet[] = [
  {
    id: 'snip-1',
    title: '노션 수식 2.0 마감일 D-Day 및 상태 뱃지 계산식',
    category: '수식코드',
    description: 'Date 속성을 기준으로 마감일까지 남은 일수를 계산하고, 당일 마감 또는 마감 초과 시 이모지 경고를 출력하는 Notion Formula 2.0 공식',
    content: `/* Notion Formula 2.0: D-Day & Progress Badge */
let(
  daysLeft, dateBetween(prop("마감일"), now(), "days"),
  ifs(
    empty(prop("마감일")), "⚪ 마감일 미지정",
    prop("상태") == "완료", "✅ 완료됨",
    daysLeft < 0, "🚨 " + abs(daysLeft) + "일 지남 (초과)",
    daysLeft == 0, "🔥 오늘 마감 (D-Day)!",
    daysLeft <= 3, "⚡ D-" + daysLeft + " (임박)",
    "⏳ D-" + daysLeft
  )
)`,
    tags: ['#수식2.0', '#D-Day', '#마감일', '#캘린더연동'],
    createdAt: Date.now() - 1000 * 60 * 60 * 48
  },
  {
    id: 'snip-2',
    title: 'GTD 방식 프로젝트 & 다음 행동(Next Action) 프롬프트',
    category: '프롬프트',
    description: '데이비드 알렌의 GTD(Getting Things Done) 방법론을 완벽히 구현하는 프로젝트-액션 상호 연결 데이터베이스 생성 프롬프트',
    content: `"GTD 3단계(수집함-프로젝트-다음행동)를 관리할 수 있는 노션 템플릿을 만들어줘.
1. '수집함(Inbox)' 데이터베이스: 아이디어 메모, 미분류 할일, 긴급도 속성
2. '프로젝트' 데이터베이스: 목표, 담당자, 진척률(Rollup), 마감일
3. '다음 행동' 데이터베이스: 소요에너지(상/중/하), 상황(@컴퓨터, @외출, @사무실), 마감일
- 상위 콜아웃으로 오늘 꼭 해야 할 하이라이트 액션 3가지를 배치해줘."`,
    tags: ['#업무', '#GTD', '#생산성', '#프롬프트'],
    createdAt: Date.now() - 1000 * 60 * 60 * 36
  },
  {
    id: 'snip-3',
    title: '구글 캘린더 양방향 동기화용 날짜/시간 JSON 스니펫',
    category: 'JSON스니펫',
    description: '구글 캘린더 및 노션 캘린더와 100% 호환되는 시작일시, 종료일시, 알림 설정이 포함된 데이터베이스 속성 스키마',
    content: `{
  "name": "일정",
  "type": "date",
  "date_format": "YYYY-MM-DD HH:mm",
  "time_zone": "Asia/Seoul",
  "notification": "15_min_before"
},
{
  "name": "구글 캘린더 동기화 상태",
  "type": "select",
  "options": [
    { "id": "g-synced", "name": "🟢 동기화 완료", "color": "green" },
    { "id": "g-pending", "name": "🟡 대기 중", "color": "yellow" },
    { "id": "g-error", "name": "🔴 오류", "color": "red" }
  ]
}`,
    tags: ['#캘린더연동', '#구글캘린더', '#JSON스니펫', '#동기화'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24
  },
  {
    id: 'snip-4',
    title: '주간 회고(KPT - Keep, Problem, Try) 프롬프트',
    category: '프롬프트',
    description: '팀 또는 개인이 한 주간의 성과와 배운 점을 정리할 수 있는 3단 컬럼 KPT 템플릿 제작 요청 프롬프트',
    content: `"주간 스프린트 회고를 위한 KPT(Keep, Problem, Try) 템플릿을 만들어줘.
- 좌측: 이번 주 잘해서 유지할 점(Keep)
- 중앙: 마주했던 문제와 장애물(Problem)
- 우측: 다음 주에 새롭게 시도해볼 개선책(Try)
- 하단에는 '다음 주 핵심 액션 아이템' 체크리스트와 주간 점수(5점 만점) 평가 블록을 넣어줘."`,
    tags: ['#회고', '#KPT', '#애자일', '#프롬프트'],
    createdAt: Date.now() - 1000 * 60 * 60 * 18
  },
  {
    id: 'snip-5',
    title: 'Notion API 자동화 Webhook 연동 JSON 페이로드',
    category: '자동화팁',
    description: 'Notion 데이터베이스에 새 행(Row)이 추가되었을 때 Zapier 또는 Make로 발송되는 표준 이벤트 웹훅 데이터 구조',
    content: `{
  "event": "page.created",
  "timestamp": "2026-09-17T10:00:00Z",
  "database_id": "c0965774-c110-4db2-b2c1-9a1dd73564f8",
  "properties": {
    "Title": "신규 고객 문의 접수",
    "DueDate": "2026-09-18T18:00:00+09:00",
    "Priority": "High"
  },
  "integration": "Google_Calendar_AutoSync"
}`,
    tags: ['#웹훅', '#자동화', '#API팁', '#구글연동'],
    createdAt: Date.now() - 1000 * 60 * 60 * 6
  }
];

// 3. 초기 시드 이미지 & 영감 보드 데이터 (Unsplash 큐레이션)
const SEED_INSPIRATIONS: InspirationItem[] = [
  {
    id: 'insp-1',
    title: '미니멀 데스크 셋업 & 매거진',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    category: '커버 이미지',
    tags: ['#미니멀', '#데스크', '#심플', '#노트'],
    author: 'Andrew Neel',
    createdAt: Date.now() - 1000 * 60 * 60 * 50
  },
  {
    id: 'insp-2',
    title: '모던 건축 & 에메랄드 기하학',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    category: '커버 이미지',
    tags: ['#건축', '#모던', '#비즈니스', '#빌딩'],
    author: 'Simone Hutsch',
    createdAt: Date.now() - 1000 * 60 * 60 * 45
  },
  {
    id: 'insp-3',
    title: '차분한 안개 숲 & 감성 풍경',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    category: '커버 이미지',
    tags: ['#자연', '#힐링', '#감성', '#차분함'],
    author: 'Bailey Zindel',
    createdAt: Date.now() - 1000 * 60 * 60 * 40
  },
  {
    id: 'insp-4',
    title: '사이버펑크 네온 그라디언트',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    category: '컬러 팔레트',
    tags: ['#테크', '#네온', '#사이버', '#개발자'],
    author: 'Lorenzo Herrera',
    createdAt: Date.now() - 1000 * 60 * 60 * 35
  },
  {
    id: 'insp-5',
    title: '따뜻한 모닝 커피 & 계획 수립',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    category: '레이아웃 영감',
    tags: ['#커피', '#라이프스타일', '#데일리', '#계획'],
    author: 'Aliis Sinisalu',
    createdAt: Date.now() - 1000 * 60 * 60 * 30
  },
  {
    id: 'insp-6',
    title: '정갈한 서재 도서관 & 지식의 탑',
    imageUrl: 'https://images.unsplash.com/photo-1507842229451-7f01be837a27?auto=format&fit=crop&w=1200&q=80',
    category: '커버 이미지',
    tags: ['#도서관', '#책', '#서재', '#스터디'],
    author: 'Alfons Morales',
    createdAt: Date.now() - 1000 * 60 * 60 * 25
  },
  {
    id: 'insp-7',
    title: '크리에이티브 디자인 워크스테이션',
    imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
    category: '레이아웃 영감',
    tags: ['#디자인', '#크리에이티브', '#워크스페이스'],
    author: 'Theme Photos',
    createdAt: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: 'insp-8',
    title: '파스텔톤 추상 3D 그라디언트',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    category: '아이콘/배경',
    tags: ['#추상화', '#파스텔', '#3D', '#배경'],
    author: 'Milad Fakurian',
    createdAt: Date.now() - 1000 * 60 * 60 * 15
  }
];

// 4. 구글 동기화 기본 설정
const DEFAULT_GOOGLE_SYNC_CONFIG: GoogleSyncConfig = {
  googleClientId: '',
  googleCalendarId: 'primary',
  gmailWebhookUrl: '',
  isCalendarConnected: false,
  isGmailConnected: false,
  autoSyncEnabled: false
};

// =================== 스토리지 API =================== //

// 템플릿 목록 조회 (초기 시드 자동 병합, 제목 정제기 가드레일 및 무결성 보장)
export const getArchivedTemplates = (): ArchivedTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    let templates: any[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
      templates = SEED_TEMPLATES;
    } else {
      const parsed = JSON.parse(raw);
      templates = Array.isArray(parsed) ? parsed : SEED_TEMPLATES;
    }

    // 데이터 손상 방어 및 음성 말버릇/비정형 제목 자동 정제(Sanitization)
    return templates.map((item, idx) => {
      const rawTitle = item?.title || '제목 없는 템플릿';
      const cleanTitle = sanitizeTemplateTitle(rawTitle);
      
      const tplData = item?.templateData || {
        title: cleanTitle,
        description: item?.description || '',
        icon: item?.icon || '📑',
        databases: [],
        page_layout: []
      };
      if (tplData.title) {
        tplData.title = sanitizeTemplateTitle(tplData.title);
      }

      return {
        id: item?.id || `arch-${Date.now()}-${idx}`,
        title: cleanTitle,
        description: item?.description || '',
        icon: item?.icon || '📑',
        cover_url: item?.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
        tags: Array.isArray(item?.tags) ? item.tags : ['#템플릿'],
        templateData: tplData,
        createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now(),
        updatedAt: typeof item?.updatedAt === 'number' ? item.updatedAt : Date.now(),
        source: item?.source || (item?.id?.startsWith('arch-tpl-') ? 'curated' : 'created'),
        notionUrl: item?.notionUrl || undefined,
        folderId: item?.folderId || null
      };
    });
  } catch (e) {
    console.error('Failed to get archived templates:', e);
    return SEED_TEMPLATES;
  }
};

// 템플릿 저장 (동일 ID 또는 동일 제목 존재 시 덮어쓰기(Upsert) 지능형 매칭)
export const saveArchivedTemplate = (template: ArchivedTemplate): ArchivedTemplate[] => {
  const current = getArchivedTemplates();
  const cleanTitle = sanitizeTemplateTitle(template.title);

  const safeTemplate: ArchivedTemplate = {
    ...template,
    title: cleanTitle,
    templateData: {
      ...template.templateData,
      title: cleanTitle
    }
  };

  // 기존 템플릿 탐색 (ID 일치, templateData.id 일치, 또는 동일 제목의 created/curated 템플릿)
  const existsIndex = current.findIndex(t => 
    t.id === safeTemplate.id ||
    (safeTemplate.templateData?.id && t.templateData?.id === safeTemplate.templateData.id) ||
    (safeTemplate.templateData?.id && t.id === safeTemplate.templateData.id) ||
    (safeTemplate.id && t.templateData?.id === safeTemplate.id) ||
    (t.title === cleanTitle && (t.source === safeTemplate.source || safeTemplate.source === 'created'))
  );

  let updated: ArchivedTemplate[];
  if (existsIndex >= 0) {
    // 기존 데이터 덮어쓰기 (기존 ID 및 최초 생성일 보존)
    const existing = current[existsIndex];
    const merged: ArchivedTemplate = {
      ...existing,
      ...safeTemplate,
      id: existing.id,
      createdAt: existing.createdAt,
      folderId: safeTemplate.folderId !== undefined ? safeTemplate.folderId : existing.folderId,
      updatedAt: Date.now(),
      templateData: {
        ...safeTemplate.templateData,
        id: existing.id,
        title: cleanTitle
      }
    };
    updated = [...current];
    updated[existsIndex] = merged;
  } else {
    // 신규 등록
    updated = [safeTemplate, ...current];
  }

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  return updated;
};

// 템플릿 삭제
export const deleteArchivedTemplate = (id: string): ArchivedTemplate[] => {
  const current = getArchivedTemplates();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  return updated;
};

// [Step 5 신규] 과거 말버릇 및 중복 생성된 템플릿 일괄 정제 클리너
export const clearChatSlopTemplates = (): ArchivedTemplate[] => {
  const current = getArchivedTemplates();
  const seenTitles = new Set<string>();
  const cleaned: ArchivedTemplate[] = [];

  for (const item of current) {
    const cleanTitle = sanitizeTemplateTitle(item.title);
    
    // 공식 시드(curated)는 무조건 보존
    if (item.source === 'curated' || item.id.startsWith('arch-tpl-')) {
      cleaned.push({
        ...item,
        title: cleanTitle,
        templateData: { ...item.templateData, title: cleanTitle }
      });
      seenTitles.add(cleanTitle);
      continue;
    }

    // 중복된 제목의 사용자 생성 템플릿은 최신 1건만 유지
    if (seenTitles.has(cleanTitle)) {
      continue;
    }
    seenTitles.add(cleanTitle);

    // 무의미한 빈 더미 데이터 제거
    if (!cleanTitle || cleanTitle === '제목 없는 템플릿' || cleanTitle === '기본 템플릿') {
      continue;
    }

    cleaned.push({
      ...item,
      title: cleanTitle,
      templateData: { ...item.templateData, title: cleanTitle }
    });
  }

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(cleaned));
  return cleaned;
};

// [Step 5 신규] 보관함을 기본 추천 시드 템플릿으로 완전 초기화
export const resetArchiveToDefault = (): ArchivedTemplate[] => {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
  return SEED_TEMPLATES;
};

// 프롬프트 스니펫 목록 조회
export const getPromptSnippets = (): PromptSnippet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(SEED_PROMPTS));
      return SEED_PROMPTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(SEED_PROMPTS));
      return SEED_PROMPTS;
    }
    return parsed.map((item, idx) => ({
      id: item?.id || `snip-${Date.now()}-${idx}`,
      title: item?.title || '제목 없음',
      category: item?.category || '프롬프트',
      description: item?.description || '',
      content: item?.content || '',
      tags: Array.isArray(item?.tags) ? item.tags : ['#프롬프트'],
      createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now()
    }));
  } catch (e) {
    console.error('Failed to get prompt snippets:', e);
    return SEED_PROMPTS;
  }
};

// 프롬프트 스니펫 저장
export const savePromptSnippet = (snippet: PromptSnippet): PromptSnippet[] => {
  const current = getPromptSnippets();
  const existsIndex = current.findIndex(s => s.id === snippet.id);
  let updated: PromptSnippet[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = snippet;
  } else {
    updated = [snippet, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));
  return updated;
};

// 프롬프트 스니펫 삭제
export const deletePromptSnippet = (id: string): PromptSnippet[] => {
  const current = getPromptSnippets();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));
  return updated;
};

// 이미지 & 영감 보드 조회
export const getInspirations = (): InspirationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSPIRATION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INSPIRATION, JSON.stringify(SEED_INSPIRATIONS));
      return SEED_INSPIRATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEYS.INSPIRATION, JSON.stringify(SEED_INSPIRATIONS));
      return SEED_INSPIRATIONS;
    }
    return parsed.map((item, idx) => ({
      id: item?.id || `insp-${Date.now()}-${idx}`,
      title: item?.title || '영감 이미지',
      imageUrl: item?.imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      category: item?.category || '커버 이미지',
      tags: Array.isArray(item?.tags) ? item.tags : ['#영감'],
      author: item?.author || 'Unsplash',
      createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now()
    }));
  } catch (e) {
    console.error('Failed to get inspiration items:', e);
    return SEED_INSPIRATIONS;
  }
};

// 이미지 & 영감 보드 저장
export const saveInspiration = (item: InspirationItem): InspirationItem[] => {
  const current = getInspirations();
  const existsIndex = current.findIndex(i => i.id === item.id);
  let updated: InspirationItem[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = item;
  } else {
    updated = [item, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.INSPIRATION, JSON.stringify(updated));
  return updated;
};

// 이미지 & 영감 보드 삭제
export const deleteInspiration = (id: string): InspirationItem[] => {
  const current = getInspirations();
  const updated = current.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.INSPIRATION, JSON.stringify(updated));
  return updated;
};

// 구글 동기화 설정 조회
export const getGoogleSyncConfig = (): GoogleSyncConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_SYNC);
    if (!raw) return DEFAULT_GOOGLE_SYNC_CONFIG;
    return { ...DEFAULT_GOOGLE_SYNC_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GOOGLE_SYNC_CONFIG;
  }
};

// 구글 동기화 설정 저장
export const saveGoogleSyncConfig = (config: GoogleSyncConfig): GoogleSyncConfig => {
  localStorage.setItem(STORAGE_KEYS.GOOGLE_SYNC, JSON.stringify(config));
  return config;
};

// 전체 아카이브 백업 데이터 JSON 다운로드
export const exportAllArchiveData = () => {
  const backup = {
    version: '4.0',
    exportedAt: new Date().toISOString(),
    templates: getArchivedTemplates(),
    prompts: getPromptSnippets(),
    inspiration: getInspirations(),
    googleSync: getGoogleSyncConfig()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notion-architect-archive-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 백업 데이터 복원
export const importArchiveData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.templates && Array.isArray(data.templates)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
    }
    if (data.prompts && Array.isArray(data.prompts)) {
      localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(data.prompts));
    }
    if (data.inspiration && Array.isArray(data.inspiration)) {
      localStorage.setItem(STORAGE_KEYS.INSPIRATION, JSON.stringify(data.inspiration));
    }
    if (data.googleSync) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SYNC, JSON.stringify(data.googleSync));
    }
    return true;
  } catch (e) {
    console.error('Failed to import archive data:', e);
    return false;
  }
};

// ==========================================
// 5. 템플릿 스마트 폴더링 (DnD Grouping) 스토리지
// ==========================================

export const getTemplateFolders = (): TemplateFolder[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.FOLDERS);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse folders:', e);
    return [];
  }
};

export const saveTemplateFolder = (folder: TemplateFolder): void => {
  const folders = getTemplateFolders();
  const existingIdx = folders.findIndex(f => f.id === folder.id);
  if (existingIdx >= 0) {
    folders[existingIdx] = { ...folders[existingIdx], ...folder, updatedAt: Date.now() };
  } else {
    folders.push(folder);
  }
  localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
};

export const deleteTemplateFolder = (folderId: string): void => {
  const folders = getTemplateFolders().filter(f => f.id !== folderId);
  localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

  // 해당 폴더 안의 템플릿들은 루트(folderId: null)로 복귀
  const templates = getArchivedTemplates();
  let modified = false;
  const updatedTemplates = templates.map(t => {
    if (t.folderId === folderId) {
      modified = true;
      return { ...t, folderId: null };
    }
    return t;
  });
  if (modified) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updatedTemplates));
  }
};

export const moveTemplateToFolder = (templateId: string, folderId: string | null): void => {
  const templates = getArchivedTemplates();
  const updated = templates.map(t => {
    if (t.id === templateId) {
      return { ...t, folderId: folderId, updatedAt: Date.now() };
    }
    return t;
  });
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
};

export const createFolderWithTemplates = (folderName: string, templateIds: string[]): TemplateFolder => {
  const newFolder: TemplateFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: folderName.trim() || '새 컬렉션 폴더',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveTemplateFolder(newFolder);

  // 선택된 템플릿들의 folderId를 새 폴더로 업데이트
  const templates = getArchivedTemplates();
  const updated = templates.map(t => {
    if (templateIds.includes(t.id)) {
      return { ...t, folderId: newFolder.id, updatedAt: Date.now() };
    }
    return t;
  });
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));

  return newFolder;
};

