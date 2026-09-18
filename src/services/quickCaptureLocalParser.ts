// src/services/quickCaptureLocalParser.ts
// Gemini API 지연/오류 시 즉각 작동하는 로컬 지능형 텍스트 파서 (65줄 최적화)

import type { QuickCaptureAnalysisResult, RoutedNotionTask } from '../types/quickCapture';

export function parseQuickTextLocally(rawText: string): QuickCaptureAnalysisResult {
  const text = rawText.trim();
  const now = new Date();
  const tasks: RoutedNotionTask[] = [];

  // 1. 날짜 추출 (오늘, 내일, 모레 등)
  let dateStr = now.toISOString().split('T')[0];
  if (text.includes('내일')) {
    dateStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  } else if (text.includes('모레')) {
    dateStr = new Date(now.getTime() + 86400000 * 2).toISOString().split('T')[0];
  }

  // 2. 시간 추출 (예: 15시, 3시 등)
  const timeMatch = text.match(/(\d{1,2})시(\s*\d{1,2}분)?/);
  const fullDateTime = timeMatch ? `${dateStr} ${timeMatch[0]}` : dateStr;

  // 3. 금액 추출 (예: 18,500원, 12000원 등)
  const amountMatch = text.match(/([0-9,]+)\s*원/);

  // 4. 일정/미팅 관련 작업 분할
  const isSchedule = text.includes('미팅') || text.includes('회의') || text.includes('약속') || text.includes('일정') || timeMatch;
  if (isSchedule) {
    tasks.push({
      id: `task-sched-${Date.now()}`,
      intent: 'schedule',
      targetDbHint: '일정/캘린더 DB',
      title: text.replace(/([0-9,]+)\s*원.*$/, '').trim() || '일정 및 약속',
      suggestedIcon: '📅',
      summary: `${fullDateTime} 일정 기록`,
      properties: { '일정': fullDateTime, '상태': '미완료' }
    });
  }

  // 5. 지출/가계부 관련 작업 분할
  if (amountMatch) {
    const amountNum = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    tasks.push({
      id: `task-exp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      intent: 'expense',
      targetDbHint: '가계부/지출 DB',
      title: `지출: ${amountMatch[0]} 결제 내역`,
      suggestedIcon: '💰',
      summary: `금액: ${amountMatch[0]}`,
      properties: { '금액': amountNum, '날짜': dateStr, '상태': '완료' }
    });
  }

  // 6. 감지된 작업이 없을 경우 기본 할 일/메모로 등록
  if (tasks.length === 0) {
    tasks.push({
      id: `task-todo-${Date.now()}`,
      intent: 'todo',
      targetDbHint: '할 일 DB',
      title: text.slice(0, 40),
      suggestedIcon: '⚡',
      summary: text,
      properties: { '상태': '미완료', '날짜': dateStr }
    });
  }

  return {
    rawInput: text,
    correctedText: text,
    detectedType: 'general_text',
    tasks
  };
}
