// src/services/aiTaskBreakdown.ts
// AI 서브태스크 분해기 및 브라우저 푸시 알림 엔진

export async function breakdownTaskWithAI(
  taskTitle: string,
  apiKey?: string
): Promise<string[]> {
  const prompt = `당신은 세계적인 생산성 컨설턴트이자 GTD(Getting Things Done) 업무 분해 전문가입니다.
사용자가 입력한 할 일(Task): "${taskTitle}"

이 할 일을 오늘 즉시 실행에 옮길 수 있는 구체적인 3단계 하위 실행 단위(Sub-tasks)로 자동 분해하세요.
각 단계는 군더더기 없이 행동 중심(Actionable)의 명확한 문장이어야 합니다.

[출력 규격]
마크다운 백틱이나 서론/결론 없이, 오직 아래와 같이 1, 2, 3으로 시작하는 순수 텍스트 3줄만 정확히 반환하세요:
1. ...
2. ...
3. ...`;

  try {
    if (apiKey) {
      // 1. Vercel 서버리스 프록시 우선 호출
      const proxyRes = await fetch('/api/gemini?model=gemini-3.6-flash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const lines = text
          .split('\n')
          .map((l: string) => l.replace(/^[0-9]+[.)]\s*/, '').trim())
          .filter(Boolean);

        if (lines.length >= 2) {
          return lines.slice(0, 3);
        }
      }
    }
  } catch (e) {
    console.warn('AI 서브태스크 분해 API 호출 중 경고 (로컬 Fallback으로 자동 전환):', e);
  }

  // 2. 스마트 로컬 규칙 기반 Fallback 분해기
  return fallbackRuleBasedBreakdown(taskTitle);
}

function fallbackRuleBasedBreakdown(taskTitle: string): string[] {
  const t = taskTitle.toLowerCase();

  if (t.includes('배포') || t.includes('릴리즈') || t.includes('v2.0') || t.includes('라우트')) {
    return [
      '1단계: 변경 모듈 단위 테스트 및 번들 빌드 검증 (`npm run build`)',
      '2단계: Vercel 서버리스 프록시 환경변수 및 CORS 연동 확인',
      '3단계: GitHub main 브랜치 커밋/푸시 및 프로덕션 배포 완료 점검'
    ];
  }

  if (t.includes('리포트') || t.includes('결산') || t.includes('보고서') || t.includes('작성')) {
    return [
      '1단계: 이번 주 주요 추진 성과 및 지표 데이터 취합',
      '2단계: 노션 주간 업무 보고 템플릿에 핵심 요약 초안 작성',
      '3단계: 팀 슬랙 공유 및 차주 우선순위 안건 등록'
    ];
  }

  if (t.includes('운동') || t.includes('헬스') || t.includes('하체')) {
    return [
      '1단계: 동적 스트레칭 및 웜업 10분 진행',
      '2단계: 스쿼트 및 메인 다관절 하체 루틴 4세트 집중 수행',
      '3단계: 쿨다운 정적 스트레칭 및 영양 섭취 기록'
    ];
  }

  if (t.includes('공과금') || t.includes('전기세') || t.includes('이체') || t.includes('세금')) {
    return [
      '1단계: 이번 달 고지서 내역 및 계좌 잔고 확인',
      '2단계: 모바일 뱅킹을 통한 즉시 이체 및 영수증 캡처',
      '3단계: 라이프 허브 가계부 지출 내역에 금액 기록'
    ];
  }

  return [
    `1단계: [${taskTitle}] 사전 요구사항 점검 및 필수 자료 수집`,
    `2단계: 핵심 실행 작업 25분간 집중 수행 (뽀모도로 기법)`,
    `3단계: 결과물 검토 완료 후 노션 완료 상태로 업데이트`
  ];
}

/**
 * 브라우저 Web Notification API 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * 브라우저 네이티브 푸시 알림 발송
 */
export function sendBrowserPushNotification(title: string, options?: NotificationOptions): boolean {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
        ...options
      });
      return true;
    } catch (e) {
      console.warn('푸시 알림 생성 실패:', e);
      return false;
    }
  }
  return false;
}
