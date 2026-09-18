// src/services/quickCaptureLocalParser.ts
// Gemini API 지연/오류 시 즉각 작동하는 로컬 지능형 텍스트 파서

import type { QuickCaptureAnalysisResult, RoutedNotionTask } from '../types/quickCapture';

/**
 * 음성 인식(STT) 시 모바일 브라우저 버퍼 중복 누적 및 반복 단어/구문 정규화 제거 함수
 */
export function cleanDuplicateSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. 공백 분할 토큰 기준 중복 구문 탐색 ("다음주 월요일 연가 다음주 월요일 연가" 등)
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return cleaned;

  // 전체 문장의 절반 이상 반복되는 동일 구문 패턴 제거
  const half = Math.floor(words.length / 2);
  for (let len = half; len >= 1; len--) {
    for (let start = 0; start <= words.length - len * 2; start++) {
      const part1 = words.slice(start, start + len).join(' ');
      const part2 = words.slice(start + len, start + len * 2).join(' ');
      if (part1 === part2 && part1.length > 0) {
        words.splice(start + len, len);
        return cleanDuplicateSpeech(words.join(' '));
      }
    }
  }

  // 2. 연속된 동일 단어/토큰 중복 제거 ("회의 회의", "연가 연가")
  const dedupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i] !== words[i - 1]) {
      dedupedWords.push(words[i]);
    }
  }

  return dedupedWords.join(' ').trim();
}

/**
 * 한국어 자연어에서 정확한 날짜(상대 날짜/요일/시간)를 계산 추출
 */
export function extractDateFromKoreanText(text: string, baseDate = new Date()): { dateStr: string; timeStr?: string; isExplicitDate: boolean } {
  const clean = text.trim();
  const now = new Date(baseDate);
  let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let isExplicitDate = false;

  // 1. "N일 뒤", "N일 후"
  const dayOffsetMatch = clean.match(/(\d+)\s*일\s*(?:뒤|후)/);
  if (dayOffsetMatch) {
    const days = parseInt(dayOffsetMatch[1], 10);
    targetDate.setDate(targetDate.getDate() + days);
    isExplicitDate = true;
  }
  // 2. "오늘"
  else if (clean.includes('오늘')) {
    isExplicitDate = true;
  }
  // 3. "내일"
  else if (clean.includes('내일')) {
    targetDate.setDate(targetDate.getDate() + 1);
    isExplicitDate = true;
  }
  // 4. "모레"
  else if (clean.includes('모레')) {
    targetDate.setDate(targetDate.getDate() + 2);
    isExplicitDate = true;
  }
  // 5. "글피"
  else if (clean.includes('글피')) {
    targetDate.setDate(targetDate.getDate() + 3);
    isExplicitDate = true;
  }
  // 6. 요일 매칭 (월, 화, 수, 목, 금, 토, 일) - "다음주 월요일", "이번주 금요일" 등
  else {
    const dayMap: Record<string, number> = {
      '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7
    };
    
    const weekMatch = clean.match(/(다다음\s*주|다음\s*주|이번\s*주)?\s*([월화수목금토일])(?:요일)?/);
    if (weekMatch) {
      const weekPrefix = weekMatch[1]?.replace(/\s+/g, '') || '';
      const dayChar = weekMatch[2];
      const targetIsoDay = dayMap[dayChar]; // 1 ~ 7
      const currentIsoDay = now.getDay() === 0 ? 7 : now.getDay(); // 1 ~ 7 (월:1, 일:7)

      let diffDays = 0;
      if (weekPrefix === '다음주') {
        // 다음주 해당 요일: 이번주 일요일까지 남은 일수 + 다음주 요일
        diffDays = (7 - currentIsoDay) + targetIsoDay;
      } else if (weekPrefix === '다다음주') {
        diffDays = (7 - currentIsoDay) + 7 + targetIsoDay;
      } else if (weekPrefix === '이번주') {
        diffDays = targetIsoDay - currentIsoDay;
      } else {
        // 접두사 없이 "월요일"만 있는 경우
        const diff = targetIsoDay - currentIsoDay;
        diffDays = diff > 0 ? diff : diff + 7;
      }

      targetDate.setDate(targetDate.getDate() + diffDays);
      isExplicitDate = true;
    } else {
      // 7. "M월 D일" 매칭
      const monthDayMatch = clean.match(/(?:(\d{4})[-./년\s]+)?(\d{1,2})[-./월\s]+(\d{1,2})일?/);
      if (monthDayMatch) {
        const year = monthDayMatch[1] ? parseInt(monthDayMatch[1], 10) : now.getFullYear();
        const month = parseInt(monthDayMatch[2], 10) - 1;
        const day = parseInt(monthDayMatch[3], 10);
        targetDate = new Date(year, month, day, 0, 0, 0, 0);
        isExplicitDate = true;
      }
    }
  }

  // 시간 추출 (예: 오후 3시, 15시, 10시 30분)
  let timeStr: string | undefined;
  const timeMatch = clean.match(/(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (timeMatch) {
    const isPm = timeMatch[1] === '오후';
    let hour = parseInt(timeMatch[2], 10);
    if (isPm && hour < 12) hour += 12;
    if (!isPm && timeMatch[1] === '오전' && hour === 12) hour = 0;
    const min = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = timeStr ? `${y}-${m}-${d} ${timeStr}` : `${y}-${m}-${d}`;

  return { dateStr, timeStr, isExplicitDate };
}

export interface RescheduleMatch {
  isReschedule: boolean;
  sourceDateQuery: string; // 예: "2026-09-21"
  targetDateStr: string;   // 예: "2026-09-28"
  keyword?: string;        // 예: "회의", "치과", "일정"
  originalText: string;
}

/**
 * 한국어 자연어 일정 변경/연기(Reschedule) 패턴 감지
 * 예: "21일 일정을 28일로 연기해줘", "21일 회의 28일로 변경해줘", "내일 일정을 28일로 미뤄줘"
 */
export function detectReschedulePattern(text: string, baseDate = new Date()): RescheduleMatch | null {
  const clean = text.trim();
  const rescheduleVerbs = /(연기|미뤄|변경|이동|옮겨|미루|바꿔)/;
  if (!rescheduleVerbs.test(clean)) return null;

  const y = baseDate.getFullYear();

  // 패턴 1: "21일 ... 28일로 (연기|변경|...)"
  const m1 = clean.match(/(?:(\d{1,2})월\s*)?(\d{1,2})일(?:\s*([가-힣a-zA-Z0-9]+))?(?:을|를|에서)?\s*(?:(?:(\d{1,2})월\s*)?(\d{1,2})일)(?:로|에)?\s*(?:연기|미뤄|변경|이동|옮겨|미루|바꿔)/);
  if (m1) {
    const srcMonth = m1[1] ? parseInt(m1[1], 10) - 1 : baseDate.getMonth();
    const srcDay = parseInt(m1[2], 10);
    const keyword = (m1[3] || '').replace(/(일정|약속)/g, '').trim();
    const tgtMonth = m1[4] ? parseInt(m1[4], 10) - 1 : (m1[1] ? srcMonth : baseDate.getMonth());
    const tgtDay = parseInt(m1[5], 10);

    const srcDateStr = `${y}-${String(srcMonth + 1).padStart(2, '0')}-${String(srcDay).padStart(2, '0')}`;
    const tgtDateStr = `${y}-${String(tgtMonth + 1).padStart(2, '0')}-${String(tgtDay).padStart(2, '0')}`;

    return {
      isReschedule: true,
      sourceDateQuery: srcDateStr,
      targetDateStr: tgtDateStr,
      keyword,
      originalText: clean
    };
  }

  // 패턴 2: "내일 일정을 28일로 연기"
  if (clean.includes('내일')) {
    const dayMatch = clean.match(/(\d{1,2})일(?:로|에)?\s*(?:연기|미뤄|변경|이동|옮겨|미루|바꿔)/);
    if (dayMatch) {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const srcDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const tgtDay = parseInt(dayMatch[1], 10);
      const tgtDateStr = `${y}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(tgtDay).padStart(2, '0')}`;

      return {
        isReschedule: true,
        sourceDateQuery: srcDateStr,
        targetDateStr: tgtDateStr,
        keyword: '',
        originalText: clean
      };
    }
  }

  return null;
}

export function parseQuickTextLocally(rawText: string): QuickCaptureAnalysisResult {
  const text = rawText.trim();
  const tasks: RoutedNotionTask[] = [];

  // 0. 일정 연기/변경(Reschedule) 패턴 우선 탐지
  const reschedule = detectReschedulePattern(text);
  if (reschedule) {
    tasks.push({
      id: `task-resched-${Date.now()}`,
      intent: 'schedule',
      targetDbHint: '일정/캘린더 DB (일정 변경)',
      title: `일정 변경: ${reschedule.sourceDateQuery} ➔ ${reschedule.targetDateStr}`,
      suggestedIcon: '🔄',
      summary: `${reschedule.sourceDateQuery} 일정을 ${reschedule.targetDateStr}로 정상 연기/변경합니다.`,
      properties: {
        '이름': `일정 변경: ${reschedule.targetDateStr}`,
        '일정': reschedule.targetDateStr,
        '날짜': reschedule.targetDateStr,
        '액션': 'reschedule',
        '기존날짜': reschedule.sourceDateQuery,
        '변경날짜': reschedule.targetDateStr,
        '키워드': reschedule.keyword || '',
        '상태': '미완료',
        '분류': '일정'
      }
    });

    return {
      rawInput: text,
      correctedText: text,
      detectedType: 'general_text',
      tasks
    };
  }

  // 1. 날짜 및 시간 지능형 추출
  const { dateStr, timeStr, isExplicitDate } = extractDateFromKoreanText(text);

  // 2. 금액 추출 (예: 18,500원, 12000원 등)
  const amountMatch = text.match(/([0-9,]+)\s*원/);

  // 3. 일정 관련 키워드 정밀 감지
  const scheduleKeywords = /(연가|휴가|반차|월차|휴무|외근|출장|미팅|회의|약속|일정|진료|검진|치과|병원|예약|세미나|워크샵|생일|제사|결혼식|식사|시험|면접)/;
  const hasScheduleKeyword = scheduleKeywords.test(text);
  const isSchedule = hasScheduleKeyword || (isExplicitDate && !amountMatch) || Boolean(timeStr);

  if (isSchedule) {
    let icon = '📅';
    if (/연가|휴가|반차|월차|휴무/.test(text)) icon = '🌴';
    else if (/치과|병원|진료|검진/.test(text)) icon = '🏥';
    else if (/회의|미팅|출장|외근/.test(text)) icon = '💼';

    // 제목 정제
    let cleanTitle = text.replace(/([0-9,]+)\s*원.*$/, '').trim();
    if (!cleanTitle) cleanTitle = '일정 및 약속';

    tasks.push({
      id: `task-sched-${Date.now()}`,
      intent: 'schedule',
      targetDbHint: '일정/캘린더 DB',
      title: cleanTitle,
      suggestedIcon: icon,
      summary: `${dateStr} 일정 기록 (${cleanTitle})`,
      properties: { 
        '이름': cleanTitle,
        '일정': dateStr, 
        '날짜': dateStr,
        '상태': '미완료',
        '분류': '일정'
      }
    });
  }

  // 4. 지출/가계부 관련 작업 분할
  if (amountMatch) {
    const amountNum = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    const dateOnly = dateStr.split(' ')[0];
    tasks.push({
      id: `task-exp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      intent: 'expense',
      targetDbHint: '가계부/지출 DB',
      title: `지출: ${amountMatch[0]} 결제 내역`,
      suggestedIcon: '💰',
      summary: `금액: ${amountMatch[0]}`,
      properties: { 
        '상호명': `지출: ${amountMatch[0]}`,
        '이름': `지출: ${amountMatch[0]}`,
        '금액': amountNum, 
        '결제일': dateOnly, 
        '날짜': dateOnly,
        '분류': '식비',
        '상태': '결제 완료' 
      }
    });
  }

  // 5. 감지된 작업이 없을 경우 기본 할 일/메모로 등록
  if (tasks.length === 0) {
    const dateOnly = dateStr.split(' ')[0];
    tasks.push({
      id: `task-todo-${Date.now()}`,
      intent: 'todo',
      targetDbHint: '할 일 DB',
      title: text.slice(0, 40),
      suggestedIcon: '⚡',
      summary: text,
      properties: { 
        '이름': text.slice(0, 40),
        '상태': '미완료', 
        '날짜': dateOnly,
        '일정': dateOnly,
        '분류': '할 일'
      }
    });
  }

  return {
    rawInput: text,
    correctedText: text,
    detectedType: 'general_text',
    tasks
  };
}
