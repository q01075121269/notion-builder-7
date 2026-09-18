import type { AuthUser } from '../types/auth';

const SESSION_STORAGE_KEY = 'notion_auth_session';

// 환경 변수에서 화이트리스트 관리자 이메일 목록 가져오기 (콤마 구분 지원)
export const getAdminEmails = (): string[] => {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '';
  const parsed = envEmails
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  // 환경변수가 없거나 비어있는 경우 기본 관리자 허용 목록
  if (parsed.length === 0) {
    return [
      'admin@gmail.com',
      'developer@notion.com',
      'notion.architect.admin@gmail.com'
    ];
  }
  return parsed;
};

// 특정 이메일이 관리자 화이트리스트에 등록되어 있는지 판별
export const isUserAdmin = (email: string): boolean => {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
};

// 세션에 저장된 사용자 정보 조회
export const getStoredAuthUser = (): AuthUser | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get stored auth user:', e);
    return null;
  }
};

export const getAuthSession = getStoredAuthUser;

// 인증 세션 저장
export const saveAuthSession = (user: AuthUser, remember = true): void => {
  const serialized = JSON.stringify(user);
  sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  if (remember) {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  }
};

// [보안 파기]: 로그아웃 시 세션 및 모든 토큰/키, 대화 기록, 퀵 캡처 민감 데이터 완전 삭제
export const clearAllAuthAndCredentials = (): void => {
  // 1. 인증 세션 제거
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);

  // 2. 브라우저 로컬 저장소의 Notion 토큰 및 Gemini 키 등 민감 자격증명 파기
  localStorage.removeItem('notion_api_key');
  localStorage.removeItem('notion_parent_page_id');
  localStorage.removeItem('gemini_api_key');

  // 3. 사용자 프라이버시 보호: 공용 PC 잔여 대화 기록 및 퀵 캡처 메모 완전 파기
  localStorage.removeItem('notion_maker_chat_history_v2');
  localStorage.removeItem('notion_maker_chat_history_v1');
  localStorage.removeItem('notion_quick_capture_records_v1');
  sessionStorage.clear();
};
