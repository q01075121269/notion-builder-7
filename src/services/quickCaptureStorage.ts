import type { QuickCaptureRecord } from '../types/quickCapture';

const QUICK_CAPTURE_STORAGE_KEY = 'notion_quick_capture_records_v1';
const DEFAULT_VIEW_QUICK_CAPTURE_KEY = 'default_view_quick_capture';

/**
 * 저장된 퀵 캡처 히스토리 목록 조회
 */
export function getQuickCaptureRecords(): QuickCaptureRecord[] {
  try {
    const raw = localStorage.getItem(QUICK_CAPTURE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load quick capture records:', e);
    return [];
  }
}

/**
 * 신규 퀵 캡처 레코드 저장 (최신순 상단 추가, 최대 50건 유지)
 */
export function saveQuickCaptureRecord(record: QuickCaptureRecord): void {
  try {
    const records = getQuickCaptureRecords();
    const updated = [record, ...records.filter(r => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(QUICK_CAPTURE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quick capture record:', e);
  }
}

/**
 * 특정 퀵 캡처 레코드 삭제
 */
export function deleteQuickCaptureRecord(id: string): void {
  try {
    const records = getQuickCaptureRecords();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(QUICK_CAPTURE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete quick capture record:', e);
  }
}

/**
 * 전체 기록 초기화
 */
export function clearQuickCaptureRecords(): void {
  try {
    localStorage.removeItem(QUICK_CAPTURE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear quick capture records:', e);
  }
}

/**
 * 모바일 첫 화면으로 퀵 캡처 기본 열기 설정 여부
 */
export function isDefaultQuickCaptureEnabled(): boolean {
  try {
    return localStorage.getItem(DEFAULT_VIEW_QUICK_CAPTURE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDefaultQuickCaptureEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DEFAULT_VIEW_QUICK_CAPTURE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set default quick capture view:', e);
  }
}

const DELETED_LIFE_ITEMS_KEY = 'notion_life_hub_deleted_ids_v1';

/**
 * 라이프 허브에서 삭제 처리된 항목 ID 및 제목 목록 조회
 */
export function getDeletedLifeItemIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_LIFE_ITEMS_KEY);
    if (!raw) return new Set();
    const arr: string[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/**
 * 특정 일정/지출/할일을 삭제 목록에 영구 등록 (F5 새로고침 및 동기화 시 재출현 원천 방지)
 */
export function markLifeItemAsDeleted(id: string, title?: string): void {
  try {
    const set = getDeletedLifeItemIds();
    if (id) set.add(id);
    if (title && title.trim()) {
      set.add(title.trim());
      set.add(title.replace(/^⚡\s*/, '').trim());
    }
    localStorage.setItem(DELETED_LIFE_ITEMS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to mark life item as deleted:', e);
  }
}

/**
 * 삭제 기록 초기화
 */
export function clearDeletedLifeItemIds(): void {
  try {
    localStorage.removeItem(DELETED_LIFE_ITEMS_KEY);
  } catch {}
}

/**
 * 퀵 캡처 저장소 내부의 특정 태스크 또는 레코드를 완전히 영구 삭제
 */
export function removeTaskFromQuickCapture(taskIdOrKey: string, title?: string): void {
  try {
    const records = getQuickCaptureRecords();
    let isChanged = false;
    const cleanTargetTitle = title ? title.replace(/^⚡\s*/, '').trim() : '';

    const updated = records.map(rec => {
      // 1. 레코드 ID 자체가 일치하는 경우 전체 레코드 삭제
      if (rec.id === taskIdOrKey) {
        isChanged = true;
        return null;
      }

      // 2. 레코드 내부의 tasks 배열에서 대상 태스크 제거
      const remainingTasks = rec.tasks.filter((task, idx) => {
        const matchKey = `${rec.id}-${idx}`;
        if (taskIdOrKey && (taskIdOrKey.includes(matchKey) || task.id === taskIdOrKey)) {
          isChanged = true;
          return false;
        }
        if (cleanTargetTitle) {
          const taskTitle = (task.title || '').replace(/^⚡\s*/, '').trim();
          const taskPropName = (task.properties?.['이름'] || '').replace(/^⚡\s*/, '').trim();
          if (taskTitle === cleanTargetTitle || taskPropName === cleanTargetTitle) {
            isChanged = true;
            return false;
          }
        }
        return true;
      });

      if (remainingTasks.length !== rec.tasks.length) {
        isChanged = true;
      }

      if (remainingTasks.length === 0) {
        return null;
      }

      return {
        ...rec,
        tasks: remainingTasks
      };
    }).filter((r): r is QuickCaptureRecord => r !== null);

    if (isChanged) {
      localStorage.setItem(QUICK_CAPTURE_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to remove task from quick capture storage:', e);
  }
}

/**
 * 퀵 캡처 저장소 내부의 특정 일정 날짜를 새로운 날짜로 연기/변경(Reschedule)
 * 기존 일정 ID의 날짜를 갱신하며, 중복 일정이 새로 생성되지 않도록 처리
 */
export function rescheduleTaskInQuickCapture(
  sourceDate: string, 
  targetDate: string, 
  keyword?: string
): { success: boolean; updatedTitle?: string; updatedPageId?: string } {
  try {
    const records = getQuickCaptureRecords();
    let isChanged = false;
    let updatedTitle = '';
    let updatedPageId = '';

    const updated = records.map(rec => {
      const updatedTasks = rec.tasks.map(task => {
        const taskDate = String(task.properties?.['일정'] || task.properties?.['날짜'] || '');
        const taskTitle = task.title || '';
        
        // 날짜 매칭 확인 (예: sourceDate가 "2026-09-21"이거나 "21")
        const isDateMatch = taskDate.includes(sourceDate) || (sourceDate.length <= 2 && taskDate.split('-')[2]?.startsWith(sourceDate));
        const isKeywordMatch = !keyword || taskTitle.includes(keyword) || (task.properties?.['분류'] || '').includes(keyword);

        if (isDateMatch && isKeywordMatch && !isChanged) {
          isChanged = true;
          updatedTitle = taskTitle;
          const prevTime = taskDate.includes(' ') ? taskDate.split(' ')[1] : '';
          const newDateWithTime = prevTime ? `${targetDate} ${prevTime}` : targetDate;
          
          const pUrl = rec.notionPageUrls?.[0];
          if (pUrl) {
            updatedPageId = pUrl.split('/').pop()?.split('?')[0]?.replace(/-/g, '') || '';
          }

          return {
            ...task,
            properties: {
              ...task.properties,
              '일정': newDateWithTime,
              '날짜': newDateWithTime
            }
          };
        }
        return task;
      });

      return {
        ...rec,
        tasks: updatedTasks
      };
    });

    if (isChanged) {
      localStorage.setItem(QUICK_CAPTURE_STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: isChanged, updatedTitle, updatedPageId };
  } catch (e) {
    console.error('Failed to reschedule task in quick capture storage:', e);
    return { success: false };
  }
}
