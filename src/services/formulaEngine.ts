/**
 * 노션 Formula 2.0 최신 수식 라이브러리 및 웹 미리보기 가상 계산 엔진
 * - lets(), let(), map(), filter(), dateBetween() 기반 최신 실무 수식 표준
 */

export interface FormulaTemplate {
  key: string;
  name: string;
  description: string;
  expression: string;
  category: 'progress' | 'dday' | 'status' | 'quality' | 'badge';
}

/**
 * Formula 2.0 표준 수식 프리셋 모음 (2026 최신 lets() 엔진)
 */
export const NOTION_FORMULA_2_LIBRARY: FormulaTemplate[] = [
  {
    key: 'progress_gauge_lets',
    name: '진행률 비주얼 게이지 (Formulas 2.0 lets())',
    description: '하위 과제 완료율 또는 현재 상태 기반으로 ■■■■□ 80% 형태의 시각적 게이지 및 백분율 자동 출력',
    category: 'progress',
    expression: `lets(
  total, if(empty(prop("하위 실행 과제")), 1, prop("하위 실행 과제").length()),
  done, if(empty(prop("하위 실행 과제")), if(prop("상태") == "완료", 1, 0), prop("하위 실행 과제").filter(current.prop("상태") == "완료").length()),
  rate, if(total > 0, round(done / total * 100), 0),
  filled, round(rate / 20),
  slice("■■■■■", 0, filled) + slice("□□□□□", 0, 5 - filled) + " " + rate + "%"
)`
  },
  {
    key: 'smart_dday_let',
    name: '스마트 D-Day 수식 (Formulas 2.0 let())',
    description: 'dateBetween(prop("마감일"), now(), "days") 기반 오늘 마감, 지연, 잔여일 자동 태깅',
    category: 'dday',
    expression: `let(
  days, dateBetween(prop("마감일"), now(), "days"),
  if(empty(prop("마감일")), "📅 일정 미정",
    if(prop("상태") == "완료", "✅ 완료",
      if(days == 0, "🔥 오늘 마감!",
        if(days < 0, "🚨 D+" + abs(days) + " (지연)", "D-" + days)
      )
    )
  )
)`
  },
  {
    key: 'quality_audit_status',
    name: '품질 검수 상태 태그 (Formulas 2.0 lets())',
    description: '진행 상태 및 마감일 기한을 교차 분석하여 합격/정상/점검필요 실시간 태그 출력',
    category: 'quality',
    expression: `lets(
  s, prop("상태"),
  hasDate, not(empty(prop("마감일"))),
  if(s == "완료", "🟢 검수 합격",
    if(s == "진행 중" and hasDate, "🟡 정상 진행",
      if(s == "시작 전", "⚪ 대기 중", "🔴 점검 필요")
    )
  )
)`
  },
  {
    key: 'priority_badge_lets',
    name: '중요도 시각적 배지',
    description: '우선순위에 맞춘 실무 등급 태그',
    category: 'badge',
    expression: `lets(
  p, prop("중요도"),
  if(p == "긴급" or p == "높음", "🚨 긴급 대응", if(p == "보통", "⚡ 보통", "☕ 여유"))
)`
  }
];

/**
 * 웹 미리보기 테이블/보드/타임라인에서 Formula 2.0 수식을 실시간 가상 계산하여 결과 문자열을 반환합니다.
 */
export function simulateFormulaValue(
  expression: string | undefined,
  row: Record<string, any>,
  propertyName: string
): string {
  // 이미 row에 사전에 계산/입력된 수식 값이 있다면 우선 반환
  const existingVal = row[propertyName];
  if (existingVal !== undefined && existingVal !== null && String(existingVal).trim() !== '') {
    return String(existingVal);
  }

  const expr = (expression || '').toLowerCase();
  const name = propertyName.toLowerCase();

  // 1. 진행률 게이지 수식 시뮬레이션 (■■■■□ 80% 형식)
  if (
    expr.includes('■') || 
    expr.includes('gauge') || 
    expr.includes('rate') || 
    expr.includes('progress') || 
    name.includes('진행률') || 
    name.includes('진행도') || 
    name.includes('진척률') || 
    name.includes('진척도') || 
    name.includes('게이지') ||
    name.includes('달성률')
  ) {
    const status = String(row['상태'] || row['진행 상태'] || row['Status'] || '');
    const numVal = row['진행도'] ?? row['진행률'];

    if (numVal !== undefined && numVal !== null && !isNaN(Number(numVal))) {
      const parsedRate = Number(numVal) > 1 ? Number(numVal) : Math.round(Number(numVal) * 100);
      const filled = Math.min(5, Math.max(0, Math.round(parsedRate / 20)));
      return `${'■'.repeat(filled)}${'□'.repeat(5 - filled)} ${parsedRate}%`;
    }

    if (status.includes('완료') || status.includes('Done') || status.includes('합격') || status.includes('종결')) {
      return '■■■■■ 100%';
    }
    if (status.includes('검토') || status.includes('Review') || status.includes('조치')) {
      return '■■■■□ 80%';
    }
    if (status.includes('진행') || status.includes('Doing') || status.includes('In Progress')) {
      return '■■■□□ 60%';
    }
    if (status.includes('대기') || status.includes('접수') || status.includes('시작 전')) {
      return '■□□□□ 20%';
    }
    return '□□□□□ 0%';
  }

  // 2. 스마트 D-Day 수식 시뮬레이션 ("🔥 오늘 마감!", "🚨 D+2 (지연)", "D-3")
  if (
    expr.includes('datebetween') || 
    expr.includes('d-day') || 
    expr.includes('dday') || 
    name.includes('d-day') || 
    name.includes('남은 일수') || 
    name.includes('디데이') ||
    name.includes('기한')
  ) {
    const status = String(row['상태'] || row['진행 상태'] || '');
    if (status.includes('완료') || status.includes('Done') || status.includes('종결')) {
      return '✅ 완료';
    }

    const rawDate = row['마감일'] || row['마감 일정'] || row['일정'] || row['날짜'] || row['기한'];
    if (!rawDate) return '📅 일정 미정';

    try {
      const targetDate = new Date(String(rawDate).split(' ')[0]);
      if (isNaN(targetDate.getTime())) return '📅 일정 미정';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '🔥 오늘 마감!';
      if (diffDays < 0) return `🚨 D+${Math.abs(diffDays)} (지연)`;
      return `D-${diffDays}`;
    } catch {
      return 'D-3';
    }
  }

  // 3. 품질 검수 상태 태그 수식 시뮬레이션 ("🟢 검수 합격", "🟡 정상 진행", "⚪ 대기 중", "🔴 점검 필요")
  if (
    expr.includes('검수') || 
    expr.includes('품질') || 
    expr.includes('점검') || 
    name.includes('검수') || 
    name.includes('품질') || 
    name.includes('진척 상태') ||
    name.includes('모니터링')
  ) {
    const status = String(row['상태'] || row['진행 상태'] || '');
    const rawDate = row['마감일'] || row['마감 일정'] || row['일정'];

    if (status.includes('완료') || status.includes('Done') || status.includes('합격')) {
      return '🟢 검수 합격';
    }
    if (status.includes('진행') || status.includes('조치')) {
      return rawDate ? '🟡 정상 진행' : '🔴 점검 필요';
    }
    if (status.includes('시작 전') || status.includes('대기')) {
      return '⚪ 대기 중';
    }
    return '🔴 점검 필요';
  }

  // 4. 중요도 배지 수식
  if (expr.includes('우선순위') || expr.includes('중요도') || name.includes('우선순위') || name.includes('배지')) {
    const priority = String(row['중요도'] || row['우선순위'] || '');
    if (priority.includes('긴급') || priority.includes('높음')) return '🚨 긴급 대응';
    if (priority.includes('보통')) return '⚡ 보통';
    if (priority.includes('여유') || priority.includes('낮음')) return '☕ 여유';
    return '📌 일반';
  }

  return '정상 반영 ✅';
}
