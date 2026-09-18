// src/services/lifeHubDataParser.ts
// 노션 DB 레코드 및 퀵 캡처 로컬 데이터 변환/병합 파서

import type { LifeScheduleItem, LifeExpenseItem, LifeTodoItem } from './notionLifeHubSync';
import { calculateDDay } from './notionLifeHubSync';
import { getQuickCaptureRecords, getDeletedLifeItemIds } from './quickCaptureStorage';
import { extractDateFromKoreanText } from './quickCaptureLocalParser';

export function parseNotionScheduleRows(rows: any[]): LifeScheduleItem[] {
  const deletedIds = getDeletedLifeItemIds();

  return rows
    .map((r, idx) => {
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
        icon: r.icon?.emoji || (/연가|휴가|반차|휴무/.test(title) ? '🌴' : '📅'),
        status,
        pageUrl,
        notionPageId: pageId
      };
    })
    .filter(item => {
      const cleanTitle = item.title.replace(/^⚡\s*/, '').trim();
      return !deletedIds.has(item.id) && !deletedIds.has(item.title.trim()) && !deletedIds.has(cleanTitle);
    });
}

export function parseNotionExpenseRows(rows: any[]): LifeExpenseItem[] {
  const deletedIds = getDeletedLifeItemIds();

  return rows
    .map((r, idx) => {
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
    })
    .filter(item => {
      const cleanTitle = item.title.replace(/^⚡\s*/, '').trim();
      return !deletedIds.has(item.id) && !deletedIds.has(item.title.trim()) && !deletedIds.has(cleanTitle);
    });
}

export function extractQuickCaptureLifeItems(): {
  schedules: LifeScheduleItem[];
  expenses: LifeExpenseItem[];
  todos: LifeTodoItem[];
} {
  const records = getQuickCaptureRecords();
  const deletedIds = getDeletedLifeItemIds();
  const schedules: LifeScheduleItem[] = [];
  const expenses: LifeExpenseItem[] = [];
  const todos: LifeTodoItem[] = [];

  records.forEach((rec) => {
    rec.tasks.forEach((task, tIdx) => {
      const key = `${rec.id}-${tIdx}`;
      const taskTitle = (task.title || '').trim();
      const cleanTitle = taskTitle.replace(/^⚡\s*/, '').trim();

      // 영구 삭제된 항목은 제외
      if (
        deletedIds.has(`qc-s-${key}`) ||
        deletedIds.has(`qc-ex-${key}`) ||
        deletedIds.has(`qc-t-${key}`) ||
        deletedIds.has(task.id) ||
        deletedIds.has(taskTitle) ||
        deletedIds.has(cleanTitle)
      ) {
        return;
      }

      // 날짜 계산 및 보정 (자연어 날짜가 제목에 포함된 경우 우선 재추출)
      let dateStr = String(task.properties?.['일정'] || task.properties?.['날짜'] || task.properties?.['결제일'] || '');
      const naturalDate = extractDateFromKoreanText(taskTitle, new Date(rec.timestamp));
      if (naturalDate.isExplicitDate) {
        dateStr = naturalDate.dateStr;
      } else if (!dateStr) {
        dateStr = new Date(rec.timestamp).toISOString().split('T')[0];
      }
      
      if (task.intent === 'expense' || task.properties?.['금액']) {
        const amt = Number(String(task.properties?.['금액'] || 0).replace(/[^0-9.-]+/g, '')) || 0;
        expenses.push({
          id: `qc-ex-${key}`,
          title: task.title,
          amount: amt,
          date: dateStr.split(' ')[0],
          category: task.properties?.['분류'] || '지출',
          icon: task.suggestedIcon || '💰'
        });
      } else {
        const pUrl = rec.notionPageUrls?.[tIdx] || rec.notionPageUrls?.[0];
        const pId = pUrl ? pUrl.split('/').pop()?.split('?')[0]?.replace(/-/g, '') : undefined;
        let icon = task.suggestedIcon;
        if (!icon || icon === '⚡') {
          if (/연가|휴가|반차|휴무/.test(taskTitle)) icon = '🌴';
          else if (/치과|병원|진료|검진/.test(taskTitle)) icon = '🏥';
          else if (/회의|미팅|출장/.test(taskTitle)) icon = '💼';
          else icon = task.intent === 'todo' ? '⚡' : '📅';
        }

        schedules.push({
          id: `qc-s-${key}`,
          title: task.title,
          date: dateStr,
          dday: calculateDDay(dateStr),
          category: task.properties?.['분류'] || (task.intent === 'todo' ? '할 일' : '일정'),
          icon,
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
