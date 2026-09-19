/**
 * 24시간 데일리 루틴 관제 & 자정 자동 롤백 엔진 (Midnight Rollback Engine)
 */

export interface MasterRoutineConfig {
  commuteTime: string;      // e.g. '08:00'
  middayTime: string;       // e.g. '12:30'
  nighttimeTime: string;    // e.g. '23:00'
  keywords: string[];       // 관심 키워드
  musicGenre: string;       // 선호 음악 장르
  updatedAt: string;
}

export interface TodayOverrideConfig {
  dateStr: string;          // YYYY-MM-DD
  skipMorning: boolean;
  skipMidday: boolean;
  skipNight: boolean;
  isSkippedAll: boolean;
  overrideMorningTime?: string;
  overrideMiddayTime?: string;
  overrideNightTime?: string;
  updatedAt: string;
}

export interface RoutineItemState {
  dateStr: string;
  morningCompleted: boolean;
  middayCompleted: boolean;
  nightCompleted: boolean;
}

const STORAGE_KEYS = {
  MASTER_CONFIG: 'notion_architect_master_routine_config_v1',
  TODAY_OVERRIDE: 'notion_architect_today_override_config_v1',
  ROUTINE_STATE: 'notion_architect_daily_routine_state_v1'
};

// 기본 마스터 고정 룰
export const DEFAULT_MASTER_CONFIG: MasterRoutineConfig = {
  commuteTime: '08:00',
  middayTime: '12:30',
  nighttimeTime: '23:00',
  keywords: ['AI 기술 동향', '노션 템플릿', '업무 생산성'],
  musicGenre: 'Lo-Fi 비트 & 백색소음',
  updatedAt: new Date().toISOString()
};

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 1. 마스터 고정 룰 로드
 */
export const loadMasterConfig = (): MasterRoutineConfig => {
  if (typeof window === 'undefined') return DEFAULT_MASTER_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_CONFIG);
    if (!raw) return DEFAULT_MASTER_CONFIG;
    return { ...DEFAULT_MASTER_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load master routine config:', e);
    return DEFAULT_MASTER_CONFIG;
  }
};

/**
 * 2. 마스터 고정 룰 저장
 */
export const saveMasterConfig = (config: MasterRoutineConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MASTER_CONFIG, JSON.stringify({
      ...config,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Failed to save master routine config:', e);
  }
};

/**
 * 3. 당일 1일 설정 로드 (자정 자동 롤백 검증 포함)
 */
export const loadTodayOverrideConfig = (): TodayOverrideConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODAY_OVERRIDE);
    if (!raw) return null;

    const parsed: TodayOverrideConfig = JSON.parse(raw);
    const todayStr = getTodayDateString();

    // ⚡ 자정 자동 리셋 엔진 (Midnight Rollback Engine)
    // 저장된 일회성 설정의 날짜가 오늘 날짜와 다르면 자정(00:00)을 지난 것이므로 자동 삭제!
    if (parsed.dateStr !== todayStr) {
      console.log('[Midnight Rollback Engine] 🌙 자정이 지나 오늘 1일 설정이 마스터 룰로 자동 리셋되었습니다.');
      localStorage.removeItem(STORAGE_KEYS.TODAY_OVERRIDE);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load today override config:', e);
    return null;
  }
};

/**
 * 4. 당일 1일 설정 저장
 */
export const saveTodayOverrideConfig = (override: Partial<TodayOverrideConfig>): TodayOverrideConfig => {
  const todayStr = getTodayDateString();
  const existing = loadTodayOverrideConfig() || {
    dateStr: todayStr,
    skipMorning: false,
    skipMidday: false,
    skipNight: false,
    isSkippedAll: false,
    updatedAt: new Date().toISOString()
  };

  const updated: TodayOverrideConfig = {
    ...existing,
    ...override,
    dateStr: todayStr,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TODAY_OVERRIDE, JSON.stringify(updated));
  }

  return updated;
};

/**
 * 5. 당일 1일 설정 초기화 (마스터 룰 즉시 복귀)
 */
export const clearTodayOverrideConfig = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TODAY_OVERRIDE);
};

/**
 * 6. 당일 루틴 완료 상태 로드 (날짜가 바뀌면 자동 초기화)
 */
export const loadRoutineState = (): RoutineItemState => {
  const todayStr = getTodayDateString();
  const defaultState: RoutineItemState = {
    dateStr: todayStr,
    morningCompleted: false,
    middayCompleted: false,
    nightCompleted: false
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINE_STATE);
    if (!raw) return defaultState;
    const parsed: RoutineItemState = JSON.parse(raw);

    if (parsed.dateStr !== todayStr) {
      // 자정 롤백: 새 날짜이므로 완료 상태 리셋
      localStorage.setItem(STORAGE_KEYS.ROUTINE_STATE, JSON.stringify(defaultState));
      return defaultState;
    }

    return parsed;
  } catch (e) {
    return defaultState;
  }
};

/**
 * 7. 당일 루틴 완료 상태 저장
 */
export const saveRoutineState = (state: Partial<RoutineItemState>): RoutineItemState => {
  const current = loadRoutineState();
  const updated: RoutineItemState = {
    ...current,
    ...state,
    dateStr: getTodayDateString()
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ROUTINE_STATE, JSON.stringify(updated));
  }

  return updated;
};
