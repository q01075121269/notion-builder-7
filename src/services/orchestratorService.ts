// src/services/orchestratorService.ts
// 2단계 & 3단계: 대화형 오케스트레이터 클라이언트 서비스 및 TTS 연동

import type { GeminiModelType } from '../types/chat';
import type { FileContextItem } from '../types/fileAttachment';

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
  userEmail?: string,
  model?: GeminiModelType,
  currentMode?: string,
  fileContextList?: FileContextItem[],
  thinking?: boolean
): Promise<OrchestratorResponse> {
  const geminiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '');
  const notionKey = typeof window !== 'undefined' ? localStorage.getItem('notion_api_key') || '' : '';
  const isThinking = thinking !== undefined 
    ? thinking 
    : (typeof window !== 'undefined' ? localStorage.getItem('gemini_thinking_enabled') === 'true' : false);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-gemini-api-key': geminiKey,
    'x-notion-api-key': notionKey,
  };

  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  if (model) {
    headers['x-gemini-model'] = model;
  }
  if (currentMode) {
    headers['x-current-mode'] = currentMode;
  }

  // 다중 첨부 파일(fileContextList) 페이로드 명확히 조립 (최우선 context 주입)
  let enrichedText = text;
  if (fileContextList && fileContextList.length > 0) {
    const multiFileBlocks = fileContextList.map(fc => {
      let contentStr = fc.textContent || fc.parsedContent || '';
      if (fc.sheets && fc.sheets.length > 0) {
        contentStr += '\n' + fc.sheets.map(s => s.markdownTable).join('\n\n');
      }
      return `사용자가 첨부한 문서 원본 내용:\n[ATTACHED_DOCUMENT_DATA]\n파일명: ${fc.fileName}\n확장자: ${fc.extension}\n카테고리: ${fc.category}\n본문 텍스트:\n${contentStr}\n[/ATTACHED_DOCUMENT_DATA]`;
    }).join('\n\n');
    
    if (!enrichedText.includes('[ATTACHED_DOCUMENT_DATA]')) {
      enrichedText = `${multiFileBlocks}\n\n${text}`;
    }
  }

  const payload = {
    text: enrichedText,
    file_context_list: fileContextList,
    model: model || 'auto',
    thinking: isThinking,
    current_mode: currentMode || 'builder',
    conversation_history: history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/orchestrator', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data as OrchestratorResponse;
    } else {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `오케스트레이터 요청 실패 (상태: ${response.status})`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('[Orchestrator] Direct API call error:', err);
    throw err;
  }
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
