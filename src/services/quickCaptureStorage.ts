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
