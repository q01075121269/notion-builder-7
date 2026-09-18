import type { ChatMessage } from '../types/chat';
import { PRESET_TEMPLATES } from './presetTemplates';

const CHAT_STORAGE_KEY = 'notion_maker_chat_history_v2';

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `안녕하세요! 📑 **Notion AI Master Builder 총괄 비서**입니다.\n\n원하시는 템플릿의 목적이나 일상의 워크플로우를 자유롭게 말씀해 주시면 최적의 노션 데이터베이스(수식·일정·상태)와 비주얼 레이아웃을 즉시 설계해 드립니다.\n\n💬 **궁금한 점이 있으신가요?**\n- 서비스 사용법이나 추천 노션 구조에 대해 언제든 편하게 물어보세요.\n- 엑셀, 워드, PDF, 캡처 이미지를 **📎 파일 첨부**하거나 채팅창에 끌어다 놓으시면 자동으로 템플릿으로 역설계됩니다!`,
    timestamp: Date.now(),
    templateData: PRESET_TEMPLATES.college_student
  }
];

/**
 * 로컬 저장소(localStorage)에서 대화 히스토리 복원
 */
export function getSavedChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_CHAT_MESSAGES;

  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return INITIAL_CHAT_MESSAGES;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[ChatStorage] Failed to load chat history, falling back to default:', err);
  }

  return INITIAL_CHAT_MESSAGES;
}

/**
 * 대화 히스토리 로컬 저장소 실시간 자동 동기화
 */
export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;

  try {
    // 너무 큰 용량 방지를 위해 최근 최대 60개 메시지만 영속화
    const messagesToSave = messages.slice(-60);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (err) {
    console.warn('[ChatStorage] Failed to save chat history:', err);
  }
}

/**
 * 대화 히스토리 초기화 (기본 환영 메시지로 리셋)
 */
export function clearSavedChatMessages(): ChatMessage[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      console.warn('[ChatStorage] Failed to clear chat history:', err);
    }
  }
  return INITIAL_CHAT_MESSAGES;
}
