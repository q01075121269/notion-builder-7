import type { NotionDatabase } from '../types/notion';

/**
 * 정규표현식: 문자열 선두에 위치한 이모지 및 불필요한 사각형 기호(■, □, 🗄️ 등) 감지
 */
const LEADING_ICON_REGEX = /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}■□🗄️📑📂📋📊🗓️🖼️📄✨⭐💡🔍])\s*/u;

/**
 * 데이터베이스의 icon과 title을 정규화하여 중복 아이콘(■, 🗄️ 등)을 제거하고
 * 단일 아이콘과 깨끗한 타이틀 문자열을 추출합니다.
 */
export function extractCleanDbTitleAndIcon(db: NotionDatabase | { name: string; icon?: string }): {
  icon: string;
  title: string;
} {
  const rawName = (db.name || '').trim();
  let explicitIcon = (db.icon || '').trim();

  // 1. name 앞단에 붙어 있는 이모지나 특수기호(■, 🗄️ 등) 감지
  const match = rawName.match(LEADING_ICON_REGEX);
  let extractedLeadingIcon = '';
  let cleanTitle = rawName;

  if (match) {
    extractedLeadingIcon = match[1];
    cleanTitle = rawName.slice(match[0].length).trim();
  }

  // 2. 만약 cleanTitle 앞단에 또 다른 기호나 사각형(■)이 남아있다면 추가 제거
  cleanTitle = cleanTitle.replace(/^[■□🗄️📑📂📋📊🗓️🖼️📄✨⭐💡]\s*/u, '').trim();

  // 3. 최종 아이콘 결정:
  // 명시적 icon이 지정되어 있고 불필요한 기호가 아니면 우선 채택,
  // 그렇지 않으면 이름에서 추출한 아이콘 사용, 둘 다 없으면 기본 '🗄️'
  let finalIcon = explicitIcon || extractedLeadingIcon || '🗄️';

  // 만약 finalIcon 자체가 '■' 같은 불필요한 네모라면 기본 정규 아이콘 '🗄️'로 대체
  if (finalIcon === '■' || finalIcon === '□') {
    finalIcon = '🗄️';
  }

  return {
    icon: finalIcon,
    title: cleanTitle || rawName || '데이터베이스'
  };
}
