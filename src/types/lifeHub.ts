// src/types/lifeHub.ts
// 라이프 Hub 세계 최고 생산성 툴(PARA & GTD) 기반 4대 마스터 데이터베이스 스키마 및 양방향 관계형 모델

export type ProjectArea = '커리어' | '재테크' | '건강' | '라이프';
export type ProjectStatus = '기획' | '진행' | '완료';

export type TaskType = '할일' | '모닝루틴';
export type TaskPriority = '🔥 P0' | '⚡ P1' | '☕ P2';

export type ResourceType = '빠른메모' | '북마크' | '문서' | '영수증';
export type ResourceStatus = '인박스' | '처리완료';

export type LifeLogCategory = '식비' | '쇼핑' | '고정지출' | '운동' | '수면';

/**
 * ① Projects DB (핵심 목표 & 기한 있는 프로젝트)
 */
export interface ProjectItem {
  id: string;
  title: string;                         // 프로젝트명 (Title)
  area: ProjectArea;                     // 영역 (Select: 커리어/재테크/건강/라이프)
  targetDate: string;                    // 목표일 (Date: YYYY-MM-DD)
  status: ProjectStatus;                 // 상태 (Status: 기획/진행/완료)
  taskIds: string[];                     // 관계형: Tasks DB 양방향 연결 ID 목록
  resourceIds?: string[];                // 관계형: Resources DB 참조 ID 목록
  progressGauge?: string;                // Formulas 2.0: ■■■■■■■■□□ 80%
  progressRate?: number;                 // 완료율 숫자 (0 ~ 100)
  ddayTag?: string;                      // Formulas 2.0: 🔥 오늘 마감, ⏳ D-4
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ② Tasks & Habits DB (일일 실행 과제 & 모닝 루틴 트래커)
 */
export interface TaskHabitItem {
  id: string;
  title: string;                         // 과제/습관명 (Title)
  type: TaskType;                        // 구분 (Select: 할일 / 모닝루틴)
  dueDate: string;                       // 마감일시 (Date: YYYY-MM-DD HH:mm 또는 YYYY-MM-DD)
  priority: TaskPriority;                // 우선순위 (Select: 🔥 P0 / ⚡ P1 / ☕ P2)
  completed: boolean;                    // 완료여부 (Checkbox)
  duration: string;                      // 소요시간 (Text: 30m, 1h)
  projectId?: string;                    // 관계형: Projects DB 연결 (소속 프로젝트)
  streakCount?: number;                  // 모닝 루틴 연속 달성 일수
  streakTag?: string;                    // 루틴 특화 수식: 🔥 14일 연속 달성
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ③ Resources & Inbox DB (1초 퀵 메모, 지식 창고, 스와이프 파일)
 */
export interface ResourceInboxItem {
  id: string;
  title: string;                         // 제목 (Title)
  type: ResourceType;                    // 유형 (Select: 빠른메모/북마크/문서/영수증)
  sourceUrl?: string;                    // 원문URL (Url)
  summary: string;                       // 요약내용 (Text)
  status: ResourceStatus;                // 처리상태 (Status: 인박스 / 처리완료)
  projectId?: string;                    // 관계형: Projects DB 연결 (관련 프로젝트 참조)
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ④ Life Log DB (스마트 지출 및 일상 컨디션 로깅)
 */
export interface LifeLogItem {
  id: string;
  title: string;                         // 항목명 (Title)
  category: LifeLogCategory;             // 카테고리 (Select: 식비/쇼핑/고정지출/운동/수면)
  amount?: number | null;                // 금액 (Number: 원)
  date: string;                          // 일시 (Date: YYYY-MM-DD HH:mm 또는 YYYY-MM-DD)
  note: string;                          // 비고/인사이트 (Text)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 라이프 Hub 4대 마스터 DB 통합 상태
 */
export interface LifeHubMasterState {
  projects: ProjectItem[];
  tasks: TaskHabitItem[];
  resources: ResourceInboxItem[];
  lifeLogs: LifeLogItem[];
  lastSyncedAt?: string;
}

/**
 * 양방향 관계형이 주입된 풀 스키마 프로젝트 뷰 모델
 */
export interface ResolvedProjectItem extends ProjectItem {
  relatedTasks: TaskHabitItem[];
  relatedResources: ResourceInboxItem[];
}
