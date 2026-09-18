/**
 * 노션 Formula 2.0 최신 수식 라이브러리 및 웹 미리보기 가상 계산 엔진
 */

export interface FormulaTemplate {
  key: string;
  name: string;
  description: string;
  expression: string;
  category: 'progress' | 'dday' | 'status' | 'badge';
}

/**
 * Formula 2.0 표준 수식 프리셋 모음
 * - 유료 자동화 플랜 없이도 상태와 진행률이 시각화되는 노션 최신 수식 패턴
 */
export const NOTION_FORMULA_2_LIBRARY: FormulaTemplate[] = [
  {
    key: 'progress_bar_status',
    name: '상태 기반 진행률 게이지 (유니코드 바)',
    description: '작업 상태에 따라 5칸 유니코드 프로그레스 바(■■■□□)와 백분율을 자동 표시',
    category: 'progress',
    expression: `ifs(prop("상태") == "완료" or prop("상태") == "제출 완료", "■■■■■ 100% 🟢", prop("상태") == "진행 중", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")`
  },
  {
    key: 'progress_bar_numeric',
    name: '수치 기반 진행률 게이지',
    description: '0~1 사이의 진행도 수치에 맞춰 유니코드 바와 퍼센트 자동 생성',
    category: 'progress',
    expression: `repeat("■", round(prop("진행도") * 5)) + repeat("□", 5 - round(prop("진행도") * 5)) + " " + round(prop("진행도") * 100) + "%"`
  },
  {
    key: 'dday_calculator',
    name: '스마트 D-Day 계산기',
    description: '오늘 날짜 기준 D-Day, 당일 불꽃, 기한 초과 경고 자동 계산',
    category: 'dday',
    expression: `ifs(empty(prop("마감 일정")) and empty(prop("마감일")), "날짜 미정", dateBetween(dateStart(prop("마감 일정")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("마감 일정")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("마감 일정")), now(), "days") + "일")`
  },
  {
    key: 'priority_badge',
    name: '중요도 시각적 배지',
    description: '우선순위에 맞춰 컬러 이모지 태그 부여',
    category: 'badge',
    expression: `ifs(prop("중요도") == "긴급" or prop("중요도") == "높음", "🚨 긴급 처리", prop("중요도") == "보통", "⚡ 보통", "☕ 여유")`
  }
];

/**
 * 웹 미리보기 테이블/보드에서 Formula 2.0 수식을 가상 계산하여 결과 문자열을 반환합니다.
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

  // 1. 진행률 게이지 수식 시뮬레이션
  if (expr.includes('■') || expr.includes('repeat') || name.includes('진행률') || name.includes('진행도') || name.includes('게이지')) {
    const status = String(row['상태'] || row['진행 상태'] || row['Status'] || '');
    if (status.includes('완료') || status.includes('Done') || status.includes('Finished')) {
      return '■■■■■ 100% 🟢';
    }
    if (status.includes('진행') || status.includes('Doing') || status.includes('In Progress')) {
      return '■■■□□ 60% 🟡';
    }
    if (status.includes('검토') || status.includes('Review')) {
      return '■■■■□ 80% 🔵';
    }
    return '□□□□□ 0% ⚪';
  }

  // 2. D-Day 수식 시뮬레이션
  if (expr.includes('datebetween') || expr.includes('d-day') || name.includes('d-day') || name.includes('남은 일수') || name.includes('디데이')) {
    const rawDate = row['마감일'] || row['마감 일정'] || row['일정'] || row['날짜'] || row['기한'];
    if (!rawDate) return '일정 미정';

    try {
      const targetDate = new Date(String(rawDate).split(' ')[0]);
      if (isNaN(targetDate.getTime())) return '날짜 확인 필요';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `기한 초과 ⚠️ (${Math.abs(diffDays)}일 지남)`;
      if (diffDays === 0) return 'D-Day 🔥 (오늘 마감)';
      return `D-${diffDays}일 남음`;
    } catch {
      return 'D-3일 남음';
    }
  }

  // 3. 상태/우선순위 배지 수식 시뮬레이션
  if (expr.includes('우선순위') || expr.includes('중요도') || name.includes('우선순위') || name.includes('배지')) {
    const priority = String(row['중요도'] || row['우선순위'] || '');
    if (priority.includes('긴급') || priority.includes('높음')) return '🚨 긴급';
    if (priority.includes('보통')) return '⚡ 보통';
    if (priority.includes('여유') || priority.includes('낮음')) return '☕ 여유';
    return '📌 일반';
  }

  // 기본 fallback
  return '계산 완료 ✅';
}
