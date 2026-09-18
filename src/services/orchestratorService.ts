// src/services/orchestratorService.ts
// 2단계 & 3단계: 대화형 오케스트레이터 클라이언트 서비스 및 TTS 연동

export interface OrchestratorResponse {
  intent: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER';
  reply_message: string;
  needs_clarification: boolean;
  redirect_url: string | null;
  payload: Record<string, any> | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER';
  redirect_url?: string | null;
  needs_clarification?: boolean;
  payload?: Record<string, any> | null;
  notionUrl?: string | null;
}

// 1. 오케스트레이터 API 호출 함수
export async function sendToOrchestrator(
  text: string,
  history: ChatMessage[] = [],
  apiKey?: string,
  userEmail?: string
): Promise<OrchestratorResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-gemini-api-key'] = apiKey;
  }
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }

  const payload = {
    text,
    conversation_history: history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
  };

  try {
    const response = await fetch('/api/orchestrator', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data as OrchestratorResponse;
    }
  } catch (err) {
    console.warn('[Orchestrator] Direct API call error, trying fallback:', err);
  }

  // 로컬 Vite dev server에서 API 라우트 프록시가 없는 경우 /api/gemini 프록시 활용 폴백
  return fallbackClientOrchestration(text, apiKey, userEmail);
}

// 클라이언트 사이드 보조 오케스트레이션 (네트워크/Vite 로컬 개발 안전망)
async function fallbackClientOrchestration(
  userText: string,
  _apiKey?: string,
  _userEmail?: string
): Promise<OrchestratorResponse> {
  const lower = userText.toLowerCase();

  // 기본 휴리스틱 검사
  if (lower.includes('템플릿') || lower.includes('빌더') || lower.includes('대시보드') || lower.includes('노션 페이지')) {
    return {
      intent: 'BUILDER',
      reply_message: `"${userText}" 템플릿 제작을 시작할게요! 템플릿 빌더 작업실로 안내해 드립니다.`,
      needs_clarification: false,
      redirect_url: '/builder',
      payload: {
        template_topic: userText,
        suggested_title: `${userText} 템플릿`,
        complexity: 'intermediate',
        initial_prompt: userText,
      },
    };
  }

  if (lower.includes('에러') || lower.includes('오류') || lower.includes('버그') || lower.includes('프롬프트') || lower.includes('개발')) {
    const isTrouble = lower.includes('에러') || lower.includes('오류') || lower.includes('버그');
    return {
      intent: 'DEVLAB',
      reply_message: isTrouble
        ? '발생한 오류를 트러블슈팅 일지에 정리해 드릴게요. 개발 랩으로 이동합니다.'
        : '새로운 개발 아이디어로 개발 랩에 안전하게 저장해 드릴게요.',
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        sub_type: isTrouble ? 'troubleshooting' : 'idea',
        title: userText.slice(0, 30),
        tags: ['개발', isTrouble ? '디버깅' : '아이디어'],
        content: userText,
      },
    };
  }

  if (lower.includes('일정') || lower.includes('예약') || lower.includes('치과') || lower.includes('회의') || lower.includes('원') || lower.includes('식비') || lower.includes('할 일') || lower.includes('투두') || lower.includes('연가') || lower.includes('휴가') || lower.includes('반차') || lower.includes('월차') || lower.includes('휴무') || lower.includes('출장') || lower.includes('외근')) {
    const isExpense = lower.includes('원') || lower.includes('식비') || lower.includes('결제');
    const isTodo = lower.includes('할 일') || lower.includes('투두');
    const isVacation = lower.includes('연가') || lower.includes('휴가') || lower.includes('반차');
    return {
      intent: 'LIFE',
      reply_message: isExpense
        ? '가계부 지출 내역으로 라이프 허브에 깔끔하게 등록해 드릴게요!'
        : isTodo
        ? '오늘의 중요한 할 일로 라이프 허브에 저장해 드릴게요!'
        : isVacation
        ? `"${userText}" 신청 일정을 라이프 허브 캘린더에 안전하게 기록해 드릴게요! 🌴`
        : '일정으로 라이프 허브 캘린더에 안전하게 기록해 드릴게요!',
      needs_clarification: false,
      redirect_url: '/life',
      payload: {
        sub_type: isExpense ? 'expense' : isTodo ? 'todo' : 'schedule',
        title: userText,
        category: isExpense ? '지출' : isTodo ? '할일' : '일정',
        priority: 'medium',
      },
    };
  }

  return {
    intent: 'CHAT',
    reply_message: `안녕하세요! 무엇이든 편하게 말씀해 주세요. 일정/가계부 등록, 개발 트러블슈팅, 노션 템플릿 제작까지 한 번에 도와드릴게요.`,
    needs_clarification: false,
    redirect_url: null,
    payload: null,
  };
}

// 2. 브라우저 내장 음성 합성(Web Speech Synthesis / TTS)
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakKoreanText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('이 브라우저는 음성 합성(SpeechSynthesis)을 지원하지 않습니다.');
    if (onEnd) onEnd();
    return;
  }

  try {
    // 이전 음성 즉시 정지
    window.speechSynthesis.cancel();

    // 이모지 및 특수문자 발음 최적화
    const cleanSpeechText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_~`]/g, '')
      .trim();

    if (!cleanSpeechText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.05; // 자연스러운 속도
    utterance.pitch = 1.0;

    // 한국어 음성 보이스 탐색
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find((v) => v.lang.includes('ko') || v.name.includes('Korean') || v.name.includes('Yuna') || v.name.includes('Google 한국의'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS 재생 경고/중단:', e);
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('TTS 실행 중 오류:', err);
    if (onEnd) onEnd();
  }
}

export function isCurrentlySpeaking(): boolean {
  return Boolean(activeUtterance) || (typeof window !== 'undefined' && Boolean(window.speechSynthesis?.speaking));
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    if (activeUtterance) {
      activeUtterance = null;
    }
  }
}
