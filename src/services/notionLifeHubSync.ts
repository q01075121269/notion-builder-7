// src/services/notionLifeHubSync.ts
// 노션 DB 실시간 쿼리 및 로컬 퀵 캡처 데이터 융합 동기화 엔진 (65줄 최적화)

import { fetchNotionWithBackoff } from './notionApi';

export interface LifeScheduleItem {
  id: string;
  title: string;
  date: string;
  dday: string;
  category: string;
  icon?: string;
  status?: string;
  pageUrl?: string;
  notionPageId?: string;
}

export interface LifeExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  icon?: string;
}

export interface LifeTodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: string;
}

export function calculateDDay(dateStr?: string): string {
  if (!dateStr) return 'D-Day';
  const rawPart = dateStr.split(' ')[0].trim();
  const parts = rawPart.split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return 'D-Day';

  const [year, month, day] = parts;
  const target = new Date(year, month - 1, day, 0, 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

export async function fetchNotionDatabaseRows(
  apiKey: string,
  databaseId: string,
  pageSize = 20
): Promise<any[]> {
  const cleanDbId = databaseId.replace(/-/g, '');
  const url = `/api/notion/v1/databases/${cleanDbId}/query`;
  const res = await fetchNotionWithBackoff(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: pageSize })
  });

  if (!res.ok) {
    const fallbackRes = await fetch(`/api/notion?path=v1/databases/${cleanDbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: pageSize })
    }).catch(() => null);
    if (fallbackRes && fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.results || [];
    }
    return [];
  }

  const data = await res.json();
  return data.results || [];
}

/**
 * 노션 페이지 삭제 (휴지통 보관)
 */
export async function deleteNotionPage(apiKey: string, pageId: string): Promise<boolean> {
  const cleanId = pageId.replace(/-/g, '');
  const res = await fetchNotionWithBackoff(`/api/notion/v1/pages/${cleanId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ archived: true })
  });
  return res.ok;
}

/**
 * 노션 페이지 속성(제목, 일정, 분류, 상태) 실시간 수정
 */
export async function updateNotionPage(
  apiKey: string,
  pageId: string,
  updates: { title?: string; date?: string; category?: string; status?: string }
): Promise<boolean> {
  const cleanId = pageId.replace(/-/g, '');
  const properties: Record<string, any> = {};

  if (updates.title) {
    properties['이름'] = { title: [{ type: 'text', text: { content: updates.title } }] };
    properties['title'] = { title: [{ type: 'text', text: { content: updates.title } }] };
  }
  if (updates.date) {
    properties['일정'] = { date: { start: updates.date.split(' ')[0] } };
    properties['날짜'] = { date: { start: updates.date.split(' ')[0] } };
  }
  if (updates.category) {
    properties['분류'] = { select: { name: updates.category } };
  }
  if (updates.status) {
    properties['상태'] = { status: { name: updates.status } };
  }

  const res = await fetchNotionWithBackoff(`/api/notion/v1/pages/${cleanId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  });
  return res.ok;
}

