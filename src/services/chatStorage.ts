import type { ChatMessage } from '../types/chat';
import { PRESET_TEMPLATES } from './presetTemplates';

const CHAT_STORAGE_KEY = 'notion_maker_chat_history_v2';
const CHAT_SESSIONS_KEY = 'noa_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'noa_active_session_id';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `안녕하세요! 📑 **노아(NOA)**입니다.\n\n생각하고 계신 템플릿의 목적이나 업무 일상에 대해 편하게 이야기해 주세요. 노아(NOA)와 함께 생각을 정리하고(Co-Thinking), 최적의 노션 구조와 데이터베이스를 함께 기획해 드립니다.`,
    timestamp: Date.now(),
    templateData: PRESET_TEMPLATES.college_student
  }
];

/**
 * 로컬 저장소(localStorage)에서 대화 세션 목록 불러오기
 */
export function getSavedSessions(): ChatSession[] {
  if (typeof window === 'undefined') {
    return [{
      id: 'session-default',
      title: '새 대화 기획',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: INITIAL_CHAT_MESSAGES
    }];
  }

  try {
    const rawSessions = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 세션 저장소가 없으면 기존 단일 대화 히스토리를 첫 세션으로 마이그레이션
    const oldMessagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
    let messagesToMigrate = INITIAL_CHAT_MESSAGES;
    if (oldMessagesRaw) {
      try {
        const parsedOld = JSON.parse(oldMessagesRaw);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          messagesToMigrate = parsedOld;
        }
      } catch {}
    }

    const defaultSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: messagesToMigrate.find(m => m.role === 'user')?.content.slice(0, 20) || '새 대화 기획',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: messagesToMigrate
    };

    saveSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
    return [defaultSession];
  } catch (err) {
    console.warn('[ChatStorage] Failed to load chat sessions:', err);
    return [{
      id: 'session-default',
      title: '새 대화 기획',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: INITIAL_CHAT_MESSAGES
    }];
  }
}

/**
 * 세션 목록 영속화
 */
export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('[ChatStorage] Failed to save chat sessions:', err);
  }
}

/**
 * 현재 활성화된 세션 ID 가져오기
 */
export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

/**
 * 활성 세션 ID 설정
 */
export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

/**
 * 새로운 대화 세션 생성
 */
export function createNewSession(title?: string): ChatSession {
  const newSession: ChatSession = {
    id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: title || '새 대화 기획',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: INITIAL_CHAT_MESSAGES
  };

  const sessions = getSavedSessions();
  const updated = [newSession, ...sessions];
  saveSessions(updated);
  setActiveSessionId(newSession.id);

  return newSession;
}

/**
 * 특정 세션 업데이트 (메시지 추가 등)
 */
export function updateSessionMessages(sessionId: string, messages: ChatMessage[]): void {
  const sessions = getSavedSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  const userMsg = messages.find(m => m.role === 'user');
  const title = userMsg ? userMsg.content.slice(0, 24).trim() : '새 대화 기획';

  if (index !== -1) {
    sessions[index] = {
      ...sessions[index],
      title: sessions[index].title === '새 대화 기획' && userMsg ? title : sessions[index].title,
      updatedAt: Date.now(),
      messages
    };
    saveSessions(sessions);
  } else {
    // 세션을 못 찾았으면 신규 생성
    const newSession: ChatSession = {
      id: sessionId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages
    };
    saveSessions([newSession, ...sessions]);
  }
}

/**
 * 세션 삭제
 */
export function deleteSession(sessionId: string): ChatSession[] {
  const sessions = getSavedSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveSessions(filtered);

  if (getActiveSessionId() === sessionId) {
    if (filtered.length > 0) {
      setActiveSessionId(filtered[0].id);
    } else {
      const fresh = createNewSession();
      return [fresh];
    }
  }

  return filtered;
}

/**
 * 세션을 날짜별(오늘, 지난 7일, 지난 30일, 이전)로 그룹화
 */
export function groupSessionsByDate(sessions: ChatSession[]): {
  today: ChatSession[];
  past7Days: ChatSession[];
  past30Days: ChatSession[];
  older: ChatSession[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  const today: ChatSession[] = [];
  const past7Days: ChatSession[] = [];
  const past30Days: ChatSession[] = [];
  const older: ChatSession[] = [];

  sessions.forEach(session => {
    const time = session.updatedAt || session.createdAt;
    if (time >= startOfToday) {
      today.push(session);
    } else if (time >= sevenDaysAgo) {
      past7Days.push(session);
    } else if (time >= thirtyDaysAgo) {
      past30Days.push(session);
    } else {
      older.push(session);
    }
  });

  return { today, past7Days, past30Days, older };
}

/**
 * 기존 단일 메시지 불러오기 연동 (하위 호환성)
 */
export function getSavedChatMessages(): ChatMessage[] {
  const sessions = getSavedSessions();
  const activeId = getActiveSessionId();
  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  return activeSession ? activeSession.messages : INITIAL_CHAT_MESSAGES;
}

/**
 * 기존 단일 메시지 저장 연동 (하위 호환성)
 */
export function saveChatMessages(messages: ChatMessage[]): void {
  const activeId = getActiveSessionId();
  if (activeId) {
    updateSessionMessages(activeId, messages);
  } else {
    const sessions = getSavedSessions();
    if (sessions.length > 0) {
      updateSessionMessages(sessions[0].id, messages);
    }
  }
}

/**
 * 대화 히스토리 초기화
 */
export function clearSavedChatMessages(): ChatMessage[] {
  const activeId = getActiveSessionId();
  if (activeId) {
    updateSessionMessages(activeId, INITIAL_CHAT_MESSAGES);
  }
  return INITIAL_CHAT_MESSAGES;
}
