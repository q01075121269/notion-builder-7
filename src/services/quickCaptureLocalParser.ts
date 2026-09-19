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
 * 한국어 자연어 문장에서 날짜, 시간, 명령어 접미사, 조사를 모두 제거하고 핵심 일정 제목만 지능적 정제 추출
 */
export function cleanTaskTitle(rawText: string): string {
  if (!rawText) return '일정';

  let title = rawText.trim();

  // 1. 날짜 및 상대 날짜 표현 제거 (예: "9월 28일 날", "2026년 9월 28일", "오늘", "내일", "15시")
  title = title
    .replace(/(?:(\d{4})[-./년\s]+)?(\d{1,2})[-./월\s]+(\d{1,2})(?:\s*일|\s*날|\s*일자|\s*일에|\s*일날|\s*날에|\s*일자로|\s*일로|\s*일)?/g, ' ')
    .replace(/(\d+)\s*일\s*(?:뒤|후)/g, ' ')
    .replace(/(오늘|내일|모레|글피)(?:\s*(?:에|날|자|로))?/g, ' ')
    .replace(/(다다음\s*주|다음\s*주|이번\s*주)?\s*([월화수목금토일])(?:요일)(?:\s*(?:에|날|자|로))?/g, ' ')
    .replace(/(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/g, ' ');

  // 2. 명령어, 동작 동사, 불필요한 서술어 및 '일정', '넣어줘', '등록' 등 접미사 제거
  title = title
    .replace(/(?:일정|할일|투두|내역)\s*(?:넣어\s*줘|등록해\s*줘|추가해\s*줘|기록해\s*줘|저장해\s*줘|생성해\s*줘|올려\s*줘|작성해\s*줘|넣어주|등록해주|추가해주|기록해주|저장해주|생성해주|올려주|작성해주|넣어|등록|추가|기록|저장|생성|올려|작성)?/g, ' ')
    .replace(/(?:넣어\s*줘|등록해\s*줘|추가해\s*줘|기록해\s*줘|저장해\s*줘|생성해\s*줘|올려\s*줘|작성해\s*줘|넣어주|등록해주|추가해주|기록해주|저장해주|생성해주|올려주|작성해주|넣어|등록|추가|기록|저장|생성|올려|작성)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. 앞뒤에 남은 조사(에, 날, 자, 로, 을, 를, 이, 가, 의) 단독 토큰 제거
  title = title.replace(/^(?:에|날|자|로|을|를|이|가|의)\s+/, '').trim();
  title = title.replace(/\s+(?:에|날|자|로|을|를|이|가|의)$/, '').trim();

  // 4. '휴가 일정' 처럼 뒤에 '일정'이 붙어있는 경우 핵심 단어 보존 정제
  if (title.endsWith(' 일정') && title.length > 3) {
    title = title.replace(/\s*일정$/, '').trim();
  }

  return title.length > 0 ? title : '일정';
}

/**
 * 한국어 자연어에서 정확한 날짜(상대 날짜/요일/시간)를 계산 추출
 */
export function extractDateFromKoreanText(text: string, baseDate = new Date()): { dateStr: string; timeStr?: string; isExplicitDate: boolean } {
  const clean = text.trim();
  const now = new Date(baseDate);
  let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let isExplicitDate = false;

  // 1. "M월 D일" / "M월 D일 날" / "YYYY년 M월 D일" 매칭 (최우선 순위 평가)
  const monthDayMatch = clean.match(/(?:(\d{4})[-./년\s]+)?(\d{1,2})[-./월\s]+(\d{1,2})(?:일|\s*일|\s*날)?/);
  if (monthDayMatch) {
    const year = monthDayMatch[1] ? parseInt(monthDayMatch[1], 10) : now.getFullYear();
    const month = parseInt(monthDayMatch[2], 10) - 1;
    const day = parseInt(monthDayMatch[3], 10);
    targetDate = new Date(year, month, day, 0, 0, 0, 0);
    isExplicitDate = true;
  }
  // 2. "N일 뒤", "N일 후"
  else if (clean.match(/(\d+)\s*일\s*(?:뒤|후)/)) {
    const dayOffsetMatch = clean.match(/(\d+)\s*일\s*(?:뒤|후)/)!;
    const days = parseInt(dayOffsetMatch[1], 10);
    targetDate.setDate(targetDate.getDate() + days);
    isExplicitDate = true;
  }
  // 3. 상대 날짜: 오늘, 내일, 모레, 글피
  else if (clean.includes('오늘')) {
    isExplicitDate = true;
  } else if (clean.includes('내일')) {
    targetDate.setDate(targetDate.getDate() + 1);
    isExplicitDate = true;
  } else if (clean.includes('모레')) {
    targetDate.setDate(targetDate.getDate() + 2);
    isExplicitDate = true;
  } else if (clean.includes('글피')) {
    targetDate.setDate(targetDate.getDate() + 3);
    isExplicitDate = true;
  }
  // 4. 독립 요일 매칭 (숫자가 앞에 안 붙은 "월요일", "화요일", "다음주 금요일" 등)
  else {
    const weekMatch = clean.match(/(다다음\s*주|다음\s*주|이번\s*주)?\s*(?:(?<!\d))([월화수목금토일])(?:요일)/);
    if (weekMatch) {
      const dayMap: Record<string, number> = {
        '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7
      };
      const weekPrefix = weekMatch[1]?.replace(/\s+/g, '') || '';
      const dayChar = weekMatch[2];
      const targetIsoDay = dayMap[dayChar];
      const currentIsoDay = now.getDay() === 0 ? 7 : now.getDay();

      let diffDays = 0;
      if (weekPrefix === '다음주') {
        diffDays = (7 - currentIsoDay) + targetIsoDay;
      } else if (weekPrefix === '다다음주') {
        diffDays = (7 - currentIsoDay) + 7 + targetIsoDay;
      } else if (weekPrefix === '이번주') {
        diffDays = targetIsoDay - currentIsoDay;
      } else {
        const diff = targetIsoDay - currentIsoDay;
        diffDays = diff > 0 ? diff : diff + 7;
      }

      targetDate.setDate(targetDate.getDate() + diffDays);
      isExplicitDate = true;
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

export interface DateRangeResult {
  isRange: boolean;
  startDateStr: string;
  endDateStr: string;
  dateList: string[]; // 포함되는 날짜 목록 YYYY-MM-DD
  cleanTitle: string;
}

/**
 * 한국어 자연어 문장에서 기간 일정 ("M월 D일부터 M월 D일까지", "N일간")을 정밀 탐색 추출
 */
export function extractDateRangeFromKoreanText(text: string, baseDate = new Date()): DateRangeResult {
  const clean = text.trim();
  const y = baseDate.getFullYear();

  // 1. "M월 D일부터 M월 D일까지" / "M/D ~ M/D" / "M월 D일 ~ D일"
  const rangeMatch = clean.match(/(?:(\d{4})[-./년\s]+)?(\d{1,2})[-./월\s]+(\d{1,2})일?\s*(?:부터|~|-)\s*(?:(\d{1,2})[-./월\s]+)?(\d{1,2})일?\s*(?:까지)?/);
  
  if (rangeMatch) {
    const startYear = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : y;
    const startMonth = parseInt(rangeMatch[2], 10) - 1;
    const startDay = parseInt(rangeMatch[3], 10);

    const endMonth = rangeMatch[4] ? parseInt(rangeMatch[4], 10) - 1 : startMonth;
    const endDay = parseInt(rangeMatch[5], 10);

    const startDate = new Date(startYear, startMonth, startDay);
    const endDate = new Date(startYear, endMonth, endDay);

    if (endDate >= startDate) {
      const dateList: string[] = [];
      const cur = new Date(startDate);
      while (cur <= endDate && dateList.length < 31) {
        const cy = cur.getFullYear();
        const cm = String(cur.getMonth() + 1).padStart(2, '0');
        const cd = String(cur.getDate()).padStart(2, '0');
        dateList.push(`${cy}-${cm}-${cd}`);
        cur.setDate(cur.getDate() + 1);
      }

      const titleWithoutRange = clean.replace(rangeMatch[0], ' ');
      const cleanTitle = cleanTaskTitle(titleWithoutRange);

      return {
        isRange: true,
        startDateStr: dateList[0],
        endDateStr: dateList[dateList.length - 1],
        dateList,
        cleanTitle
      };
    }
  }

  // 2. "오늘부터 3일간", "내일부터 N일간"
  const durationMatch = clean.match(/(오늘|내일|모레)?\s*(?:부터)?\s*(\d+)\s*일\s*(?:간|동안)/);
  if (durationMatch) {
    const prefix = durationMatch[1] || '오늘';
    const numDays = parseInt(durationMatch[2], 10);

    const startDate = new Date(baseDate);
    if (prefix === '내일') startDate.setDate(startDate.getDate() + 1);
    else if (prefix === '모레') startDate.setDate(startDate.getDate() + 2);

    const dateList: string[] = [];
    const cur = new Date(startDate);
    for (let i = 0; i < Math.min(numDays, 31); i++) {
      const cy = cur.getFullYear();
      const cm = String(cur.getMonth() + 1).padStart(2, '0');
      const cd = String(cur.getDate()).padStart(2, '0');
      dateList.push(`${cy}-${cm}-${cd}`);
      cur.setDate(cur.getDate() + 1);
    }

    const titleWithoutDuration = clean.replace(durationMatch[0], ' ');
    const cleanTitle = cleanTaskTitle(titleWithoutDuration);

    return {
      isRange: true,
      startDateStr: dateList[0],
      endDateStr: dateList[dateList.length - 1],
      dateList,
      cleanTitle
    };
  }

  return {
    isRange: false,
    startDateStr: '',
    endDateStr: '',
    dateList: [],
    cleanTitle: cleanTaskTitle(clean)
  };
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
 * 예: "21일 일정을 28일로 연기해줘", "21일에 그 9월 28일 어쩌구 연가를 28일로 옮겨줘"
 */
export function detectReschedulePattern(text: string, baseDate = new Date()): RescheduleMatch | null {
  const clean = text.trim();
  const rescheduleVerbs = /(연기|미뤄|변경|이동|옮겨|미루|바꿔)/;
  if (!rescheduleVerbs.test(clean)) return null;

  const y = baseDate.getFullYear();

  // 1. "N일로", "N일에" 로 지칭된 '목표 날짜(tgtDay)' 탐색
  const tgtMatch = clean.match(/(?:(\d{1,2})월\s*)?(\d{1,2})일(?:\s*[가-힣a-zA-Z0-9]+)*\s*(?:로|에)\s*(?:연기|미뤄|변경|이동|옮겨|미루|바꿔)/);
  let tgtDateStr = '';

  if (tgtMatch) {
    const tgtMonth = tgtMatch[1] ? parseInt(tgtMatch[1], 10) - 1 : baseDate.getMonth();
    const tgtDay = parseInt(tgtMatch[2], 10);
    tgtDateStr = `${y}-${String(tgtMonth + 1).padStart(2, '0')}-${String(tgtDay).padStart(2, '0')}`;
  } else {
    // 백업: 문장 마지막 근처에 나타난 N일로 패턴
    const altTgt = clean.match(/(\d{1,2})일(?:로|에)?/g);
    if (altTgt && altTgt.length >= 1) {
      const lastDayStr = altTgt[altTgt.length - 1].replace(/[^0-9]/g, '');
      if (lastDayStr) {
        tgtDateStr = `${y}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayStr).padStart(2, '0')}`;
      }
    }
  }

  if (!tgtDateStr) return null;
  const tgtDayNum = parseInt(tgtDateStr.split('-')[2], 10);

  // 2. 출발 날짜(sourceDate) 탐색
  let srcDateStr = '';

  if (clean.includes('내일')) {
    const tmr = new Date(baseDate);
    tmr.setDate(tmr.getDate() + 1);
    srcDateStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;
  } else if (clean.includes('오늘')) {
    srcDateStr = `${y}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
  } else {
    // 문장에서 언급된 모든 "N일" 탐색
    const allDaysMatches = [...clean.matchAll(/(?:(\d{1,2})월\s*)?(\d{1,2})일/g)];
    for (const m of allDaysMatches) {
      const dayNum = parseInt(m[2], 10);
      if (dayNum !== tgtDayNum) {
        const mMonth = m[1] ? parseInt(m[1], 10) - 1 : baseDate.getMonth();
        srcDateStr = `${y}-${String(mMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        break;
      }
    }
  }

  if (!srcDateStr) {
    // 출발날짜가 명시되지 않은 경우 21일 기본 지정
    srcDateStr = `${y}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-21`;
  }

  // 3. 키워드 추출 ("연가", "휴가", "회의", "치과", "일정" 등)
  const kwMatch = clean.match(/(연가|휴가|반차|월차|휴무|외근|출장|미팅|회의|약속|일정|진료|검진|치과|병원)/);
  const keyword = kwMatch ? kwMatch[1] : '';

  return {
    isReschedule: true,
    sourceDateQuery: srcDateStr,
    targetDateStr: tgtDateStr,
    keyword,
    originalText: clean
  };
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
