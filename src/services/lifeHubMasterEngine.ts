// src/services/lifeHubMasterEngine.ts
// 라이프 Hub 4대 마스터 DB(Projects, Tasks & Habits, Resources & Inbox, Life Log)
// 양방향 관계형(Mutual Relation) 및 Formulas 2.0 실시간 계산 엔진

import type {
  ProjectItem,
  TaskHabitItem,
  ResourceInboxItem,
  LifeLogItem,
  LifeHubMasterState,
  ResolvedProjectItem
} from '../types/lifeHub';
import type { MasterDbSchema } from './notionMasterSchemas';

const LOCAL_STORAGE_KEY = 'antigravity_life_hub_master_v1';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Formulas 2.0 연산 엔진 (Visual Progress Gauge, Smart D-Day, Streak Tag)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 하위 Task 완료율 기반 10단계 비주얼 진척률 게이지 바 (Formulas 2.0)
 * 예: 80% -> "■■■■■■■■□□ 80%"
 */
export function computeProgressGauge(totalCount: number, completedCount: number): { gauge: string; rate: number } {
  if (totalCount <= 0) {
    return { gauge: '□□□□□□□□□□ 0%', rate: 0 };
  }
  const rawRate = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));
  const filledBlocks = Math.min(10, Math.max(0, Math.round(rawRate / 10)));
  const emptyBlocks = 10 - filledBlocks;
  const gauge = `${'■'.repeat(filledBlocks)}${'□'.repeat(emptyBlocks)} ${rawRate}%`;
  return { gauge, rate: rawRate };
}

/**
 * 스마트 D-Day 태그 연산 (Formulas 2.0 dateBetween() 기반)
 * 오늘 마감, 지연, 잔여일, 완료 상태 시각 태그 반환
 */
export function computeSmartDDay(targetDateStr?: string, status?: string): string {
  if (status === '완료') {
    return '✅ 완료';
  }
  if (!targetDateStr || !targetDateStr.trim()) {
    return '📅 기한 미정';
  }

  try {
    const cleanDate = targetDateStr.split('T')[0].split(' ')[0].trim();
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return '📅 일정 미정';

    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '🔥 오늘 마감';
    if (diffDays === 1) return '⚡ 내일 마감';
    if (diffDays < 0) return `🚨 D+${Math.abs(diffDays)} (지연)`;
    return `⏳ D-${diffDays}`;
  } catch {
    return '📅 기한 미정';
  }
}

/**
 * 모닝 루틴 연속 달성 일수 연산 스트릭 태그 (Formulas 2.0 Streak)
 * 예: "🔥 14일 연속 달성", "🌱 오늘 첫 달성!", "⏸️ 대기"
 */
export function computeStreakTag(streakCount: number = 0, completed: boolean = false): string {
  if (completed) {
    if (streakCount > 0) {
      return `🔥 ${streakCount}일 연속 달성`;
    }
    return '🌱 오늘 첫 달성!';
  }
  if (streakCount > 0) {
    return `⚡ 스트릭 ${streakCount}일차 유지 중`;
  }
  return '⏸️ 오늘 미완료';
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 리얼리스틱 시드 데이터 (4대 DB 간 실제 상호 유기적 연결)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_LIFE_HUB_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-flagship-q3',
    title: '3분기 플래그십 런칭',
    area: '커리어',
    targetDate: '2026-09-28',
    status: '진행',
    taskIds: ['task-design-confirm', 'task-landing-copy', 'task-api-bench'],
    resourceIds: ['res-vercel-edge'],
    description: '노션 빌더 3.0 정식 배포 및 Vercel 서버리스 엣지 아키텍처 릴리즈'
  },
  {
    id: 'proj-reading-seminar',
    title: '독서 모임 발제 준비',
    area: '라이프',
    targetDate: '2026-10-02',
    status: '진행',
    taskIds: ['task-seminar-slide'],
    resourceIds: ['res-prompt-pattern'],
    description: '차세대 AI 에이전트 아키텍처 및 페르소나 가드레일 발제 세미나'
  },
  {
    id: 'proj-financial-rebalance',
    title: 'ISA & 배당주 포트폴리오 리밸런싱',
    area: '재테크',
    targetDate: '2026-09-30',
    status: '진행',
    taskIds: ['task-dividend-reinvest'],
    resourceIds: [],
    description: '분기 배당금 자동 재투자 및 미국 배당 성장 ETF 비중 조정'
  },
  {
    id: 'proj-half-marathon',
    title: '하프 마라톤 완주 훈련',
    area: '건강',
    targetDate: '2026-10-15',
    status: '진행',
    taskIds: ['habit-jogging-5k', 'task-interval-training'],
    resourceIds: [],
    description: '주 3회 조깅 및 21km 완주를 위한 심폐 지구력 훈련'
  }
];

export const INITIAL_LIFE_HUB_TASKS: TaskHabitItem[] = [
  {
    id: 'task-design-confirm',
    title: '제품 시안 확정',
    type: '할일',
    dueDate: '2026-09-25 15:00',
    priority: '🔥 P0',
    completed: true,
    duration: '1h',
    projectId: 'proj-flagship-q3',
    notes: '디자인 시스템 토큰 검수 및 컴포넌트 라이브러리 최종 승인'
  },
  {
    id: 'task-landing-copy',
    title: '랜딩페이지 카피 작성',
    type: '할일',
    dueDate: '2026-09-26 18:00',
    priority: '⚡ P1',
    completed: true,
    duration: '2h',
    projectId: 'proj-flagship-q3',
    notes: 'GTD 및 PARA 생산성 가치 제안 헤드카피 도출'
  },
  {
    id: 'task-api-bench',
    title: 'API 성능 벤치마크 점검',
    type: '할일',
    dueDate: '2026-09-27 14:00',
    priority: '🔥 P0',
    completed: false,
    duration: '45m',
    projectId: 'proj-flagship-q3',
    notes: 'Gemini 3.8 Flash 모델 레이턴시 및 캐싱 히트율 점검'
  },
  {
    id: 'habit-jogging-5k',
    title: '아침 조깅 5km & 스트레칭',
    type: '모닝루틴',
    dueDate: '2026-09-25 07:00',
    priority: '⚡ P1',
    completed: true,
    duration: '35m',
    projectId: 'proj-half-marathon',
    streakCount: 14,
    notes: '모닝 심박수 145bpm 유지 및 쿨다운 스트레칭 완료'
  },
  {
    id: 'task-interval-training',
    title: '인터벌 트레이닝 40분',
    type: '할일',
    dueDate: '2026-09-27 06:30',
    priority: '⚡ P1',
    completed: false,
    duration: '40m',
    projectId: 'proj-half-marathon',
    notes: '400m 질주 + 200m 조깅 8세트 반복'
  },
  {
    id: 'task-seminar-slide',
    title: '독서 모임 발표 슬라이드 제작',
    type: '할일',
    dueDate: '2026-10-01 20:00',
    priority: '⚡ P1',
    completed: false,
    duration: '1h 30m',
    projectId: 'proj-reading-seminar',
    notes: '2026 프롬프트 패턴집 요약 다이어그램 포함'
  },
  {
    id: 'task-dividend-reinvest',
    title: '배당 ETF 분기 배당금 재투자',
    type: '할일',
    dueDate: '2026-09-29 10:00',
    priority: '☕ P2',
    completed: false,
    duration: '20m',
    projectId: 'proj-financial-rebalance',
    notes: '증권 계좌 입금 배당금 확인 후 매수 주문'
  },
  {
    id: 'habit-morning-meditation',
    title: '모닝 명상 및 확언 10분',
    type: '모닝루틴',
    dueDate: '2026-09-25 06:45',
    priority: '☕ P2',
    completed: true,
    duration: '10m',
    streakCount: 21,
    notes: '오늘의 최우선 가치 설정 및 뇌파 이완'
  }
];

export const INITIAL_LIFE_HUB_RESOURCES: ResourceInboxItem[] = [
  {
    id: 'res-prompt-pattern',
    title: '2026 AI 에이전트 프롬프트 패턴집',
    type: '문서',
    sourceUrl: 'https://github.com/google/gemini-cookbook',
    summary: '복합 태스크 오케스트레이션 및 Fail-Fast 가드레일 설계 공식 템플릿',
    status: '처리완료',
    projectId: 'proj-reading-seminar',
    tags: ['AI', 'Prompt', 'Architecture']
  },
  {
    id: 'res-vercel-edge',
    title: 'Vercel Edge Functions 캐싱 아키텍처',
    type: '북마크',
    sourceUrl: 'https://vercel.com/docs/functions/edge-functions',
    summary: 'Notion API 프록시 응답 속도 최적화를 위한 엣지 캐시 및 stale-while-revalidate 전략',
    status: '인박스',
    projectId: 'proj-flagship-q3',
    tags: ['Vercel', 'Notion', 'Cache']
  },
  {
    id: 'res-receipt-macbook',
    title: '맥북 프로 정기 점검 영수증',
    type: '영수증',
    sourceUrl: 'https://support.apple.com/ko-kr',
    summary: '배터리 사이클 점검 및 써멀 그리스 재도포 공식 서비스 내역서',
    status: '처리완료',
    tags: ['하드웨어', '비용']
  },
  {
    id: 'res-memo-formula2',
    title: 'Formulas 2.0 lets() 실무 테크닉 메모',
    type: '빠른메모',
    summary: 'map/filter 함수와 slice 기반 비주얼 게이지 바 조립 테크닉 정리 완료',
    status: '인박스',
    tags: ['Notion', 'Formulas']
  }
];

export const INITIAL_LIFE_HUB_LOGS: LifeLogItem[] = [
  {
    id: 'log-team-dinner',
    title: '3분기 스프린트 마일스톤 회식',
    category: '식비',
    amount: 120000,
    date: '2026-09-24 19:30',
    note: '제품 시안 확정 기념 팀 저녁 회식 (삼겹살 & 음료)'
  },
  {
    id: 'log-arch-book',
    title: '소프트웨어 아키텍처 101 서적 구입',
    category: '쇼핑',
    amount: 38000,
    date: '2026-09-23 14:10',
    note: '발제 준비 및 클린 아키텍처 패턴 참조용'
  },
  {
    id: 'log-maintenance-fee',
    title: '오피스텔 9월 관리비',
    category: '고정지출',
    amount: 185000,
    date: '2026-09-20 09:00',
    note: '정기 자동이체 정상 출금 확인'
  },
  {
    id: 'log-interval-run',
    title: '야간 인터벌 러닝 5km',
    category: '운동',
    amount: null,
    date: '2026-09-23 21:00',
    note: '평균 페이스 5분 20초, 케이던스 175 유지. 컨디션 쾌조'
  },
  {
    id: 'log-deep-sleep',
    title: '깊은 수면 7.5시간',
    category: '수면',
    amount: null,
    date: '2026-09-24 06:30',
    note: '수면 점수 88점 (렘수면 1.8h / 깊은수면 2.1h), 기상 컨디션 최상'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. 양방향 관계형(Mutual Relation) 해석 및 통합 계산
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Task 목록에 Formulas 2.0 스트릭/D-Day 수식 결과를 계산하여 주입
 */
export function enrichTasksWithFormulas(tasks: TaskHabitItem[]): TaskHabitItem[] {
  return tasks.map(t => {
    const streakTag = t.type === '모닝루틴'
      ? computeStreakTag(t.streakCount || 0, t.completed)
      : undefined;
    return {
      ...t,
      streakTag
    };
  });
}

/**
 * Projects 목록에 하위 Tasks 완료율 게이지 및 양방향 관계형 객체 주입
 */
export function enrichProjectsWithFormulasAndRelations(
  projects: ProjectItem[],
  tasks: TaskHabitItem[],
  resources: ResourceInboxItem[]
): ResolvedProjectItem[] {
  return projects.map(proj => {
    // 1. 소속 Tasks 매핑
    const relatedTasks = tasks.filter(t => t.projectId === proj.id || proj.taskIds.includes(t.id));
    const totalCount = relatedTasks.length;
    const completedCount = relatedTasks.filter(t => t.completed).length;

    // 2. Formulas 2.0 진척률 게이지 바 계산
    const { gauge, rate } = computeProgressGauge(totalCount, completedCount);

    // 3. Formulas 2.0 스마트 D-Day 계산
    const ddayTag = computeSmartDDay(proj.targetDate, proj.status);

    // 4. 소속 Resources 매핑
    const relatedResources = resources.filter(
      r => r.projectId === proj.id || (proj.resourceIds && proj.resourceIds.includes(r.id))
    );

    return {
      ...proj,
      taskIds: relatedTasks.map(t => t.id),
      progressGauge: gauge,
      progressRate: rate,
      ddayTag,
      relatedTasks,
      relatedResources
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 로컬 스토리지 영속화 및 초기 상태 로더
// ─────────────────────────────────────────────────────────────────────────────

export function loadLifeHubMasterState(): LifeHubMasterState {
  if (typeof window === 'undefined') {
    return {
      projects: INITIAL_LIFE_HUB_PROJECTS,
      tasks: INITIAL_LIFE_HUB_TASKS,
      resources: INITIAL_LIFE_HUB_RESOURCES,
      lifeLogs: INITIAL_LIFE_HUB_LOGS,
      lastSyncedAt: new Date().toISOString()
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial: LifeHubMasterState = {
        projects: INITIAL_LIFE_HUB_PROJECTS,
        tasks: INITIAL_LIFE_HUB_TASKS,
        resources: INITIAL_LIFE_HUB_RESOURCES,
        lifeLogs: INITIAL_LIFE_HUB_LOGS,
        lastSyncedAt: new Date().toISOString()
      };
      saveLifeHubMasterState(initial);
      return initial;
    }

    const parsed: LifeHubMasterState = JSON.parse(raw);
    return {
      projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : INITIAL_LIFE_HUB_PROJECTS,
      tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : INITIAL_LIFE_HUB_TASKS,
      resources: Array.isArray(parsed.resources) && parsed.resources.length > 0 ? parsed.resources : INITIAL_LIFE_HUB_RESOURCES,
      lifeLogs: Array.isArray(parsed.lifeLogs) && parsed.lifeLogs.length > 0 ? parsed.lifeLogs : INITIAL_LIFE_HUB_LOGS,
      lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString()
    };
  } catch (err) {
    console.warn('[LifeHubMasterEngine] Failed to load from storage, using initial seed data:', err);
    return {
      projects: INITIAL_LIFE_HUB_PROJECTS,
      tasks: INITIAL_LIFE_HUB_TASKS,
      resources: INITIAL_LIFE_HUB_RESOURCES,
      lifeLogs: INITIAL_LIFE_HUB_LOGS,
      lastSyncedAt: new Date().toISOString()
    };
  }
}

export function saveLifeHubMasterState(state: LifeHubMasterState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[LifeHubMasterEngine] Failed to save state to localStorage:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 노션 공식 4대 마스터 DB 스키마 정의 (노션 API 동기화용)
// ─────────────────────────────────────────────────────────────────────────────

export const NOTION_PROJECTS_DB_SCHEMA: MasterDbSchema = {
  name: '🚀 Projects (핵심 목표 & 프로젝트)',
  icon: '🚀',
  description: '핵심 목표, 기한 및 하위 과제 완료율 연동 프로젝트 마스터 DB',
  properties: {
    '프로젝트명': { title: {} },
    '영역': {
      select: {
        options: [
          { name: '커리어', color: 'blue' },
          { name: '재테크', color: 'green' },
          { name: '건강', color: 'orange' },
          { name: '라이프', color: 'purple' }
        ]
      }
    },
    '목표일': { date: {} },
    '상태': {
      status: {
        options: [
          { name: '기획', color: 'gray' },
          { name: '진행', color: 'yellow' },
          { name: '완료', color: 'green' }
        ]
      }
    },
    '하위 실행 과제': { relation: {} },
    '관련 리소스': { relation: {} },
    '진척률 게이지': {
      formula: {
        expression: `lets(
  total, if(empty(prop("하위 실행 과제")), 1, prop("하위 실행 과제").length()),
  done, if(empty(prop("하위 실행 과제")), if(prop("상태") == "완료", 1, 0), prop("하위 실행 과제").filter(current.prop("완료여부") == true).length()),
  rate, if(total > 0, round(done / total * 100), 0),
  filled, round(rate / 10),
  slice("■■■■■■■■■■", 0, filled) + slice("□□□□□□□□□□", 0, 10 - filled) + " " + rate + "%"
)`
      }
    },
    'D-Day 태그': {
      formula: {
        expression: `let(
  days, dateBetween(prop("목표일"), now(), "days"),
  if(empty(prop("목표일")), "📅 일정 미정",
    if(prop("상태") == "완료", "✅ 완료",
      if(days == 0, "🔥 오늘 마감",
        if(days < 0, "🚨 D+" + abs(days) + " (지연)", "⏳ D-" + days)
      )
    )
  )
)`
      }
    }
  }
};

export const NOTION_TASKS_HABITS_DB_SCHEMA: MasterDbSchema = {
  name: '🎯 Tasks & Habits (실행 과제 & 루틴 트래커)',
  icon: '🎯',
  description: '일일 실행 과제 및 모닝 루틴 스트릭 트래킹 마스터 DB',
  properties: {
    '과제/습관명': { title: {} },
    '구분': {
      select: {
        options: [
          { name: '할일', color: 'blue' },
          { name: '모닝루틴', color: 'pink' }
        ]
      }
    },
    '마감일시': { date: {} },
    '우선순위': {
      select: {
        options: [
          { name: '🔥 P0', color: 'red' },
          { name: '⚡ P1', color: 'orange' },
          { name: '☕ P2', color: 'blue' }
        ]
      }
    },
    '완료여부': { checkbox: {} },
    '소요시간': { rich_text: {} },
    '소속 프로젝트': { relation: {} },
    '연속 달성 스트릭': {
      formula: {
        expression: 'if(prop("구분") == "모닝루틴" and prop("완료여부") == true, "🔥 달성 완료", "⏸️ 대기")'
      }
    }
  }
};

export const NOTION_RESOURCES_INBOX_DB_SCHEMA: MasterDbSchema = {
  name: '📚 Resources & Inbox (1초 퀵 메모 & 지식 창고)',
  icon: '📚',
  description: '1초 퀵 메모, 지식 스와이프 파일 및 북마크 아카이브 마스터 DB',
  properties: {
    '제목': { title: {} },
    '유형': {
      select: {
        options: [
          { name: '빠른메모', color: 'gray' },
          { name: '북마크', color: 'blue' },
          { name: '문서', color: 'green' },
          { name: '영수증', color: 'orange' }
        ]
      }
    },
    '원문URL': { url: {} },
    '요약내용': { rich_text: {} },
    '처리상태': {
      status: {
        options: [
          { name: '인박스', color: 'yellow' },
          { name: '처리완료', color: 'green' }
        ]
      }
    },
    '관련 프로젝트': { relation: {} }
  }
};

export const NOTION_LIFE_LOG_DB_SCHEMA: MasterDbSchema = {
  name: '📊 Life Log (스마트 지출 & 컨디션 로깅)',
  icon: '📊',
  description: '스마트 지출 및 일상 컨디션 로깅 마스터 DB',
  properties: {
    '항목명': { title: {} },
    '카테고리': {
      select: {
        options: [
          { name: '식비', color: 'orange' },
          { name: '쇼핑', color: 'purple' },
          { name: '고정지출', color: 'blue' },
          { name: '운동', color: 'green' },
          { name: '수면', color: 'indigo' }
        ]
      }
    },
    '금액': { number: { format: 'won' } },
    '일시': { date: {} },
    '비고/인사이트': { rich_text: {} }
  }
};

export const LIFE_HUB_4_MASTER_SCHEMAS: MasterDbSchema[] = [
  NOTION_PROJECTS_DB_SCHEMA,
  NOTION_TASKS_HABITS_DB_SCHEMA,
  NOTION_RESOURCES_INBOX_DB_SCHEMA,
  NOTION_LIFE_LOG_DB_SCHEMA
];
