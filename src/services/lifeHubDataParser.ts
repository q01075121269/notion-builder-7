// src/services/lifeHubDataParser.ts
// 노션 DB 레코드 및 퀵 캡처 로컬 데이터 변환/병합 파서 (65줄 최적화)

import type { LifeScheduleItem, LifeExpenseItem, LifeTodoItem } from './notionLifeHubSync';
import { calculateDDay } from './notionLifeHubSync';
import { getQuickCaptureRecords } from './quickCaptureStorage';

export function parseNotionScheduleRows(rows: any[]): LifeScheduleItem[] {
  return rows.map((r, idx) => {
    const props = r.properties || {};
    const titleObj = props['이름'] || props['Title'] || props['title'] || props['항목'];
    const title = titleObj?.title?.[0]?.plain_text || `일정 #${idx + 1}`;
    const dateStr = props['일정']?.date?.start || props['날짜']?.date?.start || new Date().toISOString().split('T')[0];
    const category = props['분류']?.select?.name || '일정';
    const status = props['상태']?.status?.name || '미완료';
    const pageId = r.id ? String(r.id).replace(/-/g, '') : '';
    const pageUrl = r.url || (pageId ? `https://notion.so/${pageId}` : undefined);
    return {
      id: r.id || `notion-s-${idx}`,
      title,
      date: dateStr,
      dday: calculateDDay(dateStr),
      category,
      icon: r.icon?.emoji || '📅',
      status,
      pageUrl,
      notionPageId: pageId
    };
  });
}

export function parseNotionExpenseRows(rows: any[]): LifeExpenseItem[] {
  return rows.map((r, idx) => {
    const props = r.properties || {};
    const titleObj = props['상호명'] || props['이름'] || props['항목'] || props['title'];
    const title = titleObj?.title?.[0]?.plain_text || `지출 #${idx + 1}`;
    const amount = props['금액']?.number || 0;
    const dateStr = props['결제일']?.date?.start || props['날짜']?.date?.start || new Date().toISOString().split('T')[0];
    const category = props['분류']?.select?.name || '기타';
    return {
      id: r.id || `notion-ex-${idx}`,
      title,
      amount,
      date: dateStr,
      category,
      icon: r.icon?.emoji || '🧾'
    };
  });
}

export function extractQuickCaptureLifeItems(): {
  schedules: LifeScheduleItem[];
  expenses: LifeExpenseItem[];
  todos: LifeTodoItem[];
} {
  const records = getQuickCaptureRecords();
  const schedules: LifeScheduleItem[] = [];
  const expenses: LifeExpenseItem[] = [];
  const todos: LifeTodoItem[] = [];

  records.forEach((rec) => {
    rec.tasks.forEach((task, tIdx) => {
      const key = `${rec.id}-${tIdx}`;
      const dateStr = String(task.properties?.['일정'] || task.properties?.['날짜'] || task.properties?.['결제일'] || new Date(rec.timestamp).toISOString().split('T')[0]);
      
      if (task.intent === 'expense' || task.properties?.['금액']) {
        const amt = Number(String(task.properties?.['금액'] || 0).replace(/[^0-9.-]+/g, '')) || 0;
        expenses.push({
          id: `qc-ex-${key}`,
          title: task.title,
          amount: amt,
          date: dateStr,
          category: task.properties?.['분류'] || '지출',
          icon: task.suggestedIcon || '💰'
        });
      } else {
        const pUrl = rec.notionPageUrls?.[tIdx] || rec.notionPageUrls?.[0];
        const pId = pUrl ? pUrl.split('/').pop()?.split('?')[0]?.replace(/-/g, '') : undefined;
        schedules.push({
          id: `qc-s-${key}`,
          title: task.title,
          date: dateStr,
          dday: calculateDDay(dateStr),
          category: task.properties?.['분류'] || (task.intent === 'todo' ? '할 일' : '일정'),
          icon: task.suggestedIcon || (task.intent === 'todo' ? '⚡' : '📅'),
          status: task.properties?.['상태'] || '미완료',
          pageUrl: pUrl,
          notionPageId: pId
        });
        todos.push({
          id: `qc-t-${key}`,
          title: task.title,
          done: task.properties?.['상태'] === '완료',
          priority: task.intent === 'todo' ? '🔥 우선' : '⭐ 보통'
        });
      }
    });
  });

  return { schedules, expenses, todos };
}
