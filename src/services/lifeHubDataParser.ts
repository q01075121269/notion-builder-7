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
      const titleObj = props['이름'] || props['상호명'] || props['항목'] || props['title'];
      const title = titleObj?.title?.[0]?.plain_text || `지출 #${idx + 1}`;
      const amount = props['금액']?.number || 0;
      const dateStr = props['결제일']?.date?.start || props['날짜']?.date?.start || new Date().toISOString().split('T')[0];
      const category = props['분류']?.select?.name || '기타';
      const paymentMethod = (props['결제수단']?.select?.name || '신용카드') as any;
      const type = (props['구분']?.select?.name || '지출') as any;
      const merchant = props['상호명']?.rich_text?.[0]?.plain_text || title;
      const memo = props['메모']?.rich_text?.[0]?.plain_text || '';
      const pageId = r.id ? String(r.id).replace(/-/g, '') : undefined;
      const isLeak = category === '기타' || category === '미분류' || /편의점|스타벅스|카페|배달팁|인앱/.test(title);

      return {
        id: r.id || `notion-ex-${idx}`,
        title,
        amount,
        date: dateStr,
        category,
        icon: r.icon?.emoji || (category === '식비' ? '🍱' : category === '교통' ? '🚇' : '🧾'),
        paymentMethod,
        type,
        merchant,
        memo,
        isLeak,
        notionPageId: pageId
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

      // 일정 연기/변경(Reschedule) 액션 처리: 중복 생성 차단 및 기존 일정 날짜 갱신
      if (task.properties?.['액션'] === 'reschedule') {
        const srcDate = String(task.properties?.['기존날짜'] || '');
        const tgtDate = String(task.properties?.['변경날짜'] || dateStr);
        const kw = String(task.properties?.['키워드'] || '');

        // 1. 이미 추출된 일정 목록에서 소스 날짜 일정을 찾아 날짜 갱신
        const existingIdx = schedules.findIndex(s => 
          (s.date.startsWith(srcDate) || (srcDate.length <= 2 && s.date.split('-')[2]?.startsWith(srcDate))) &&
          (!kw || s.title.includes(kw) || s.category.includes(kw))
        );

        if (existingIdx !== -1) {
          const prevTime = schedules[existingIdx].date.split(' ')[1] || '10:00';
          const updatedDate = `${tgtDate} ${prevTime}`;
          schedules[existingIdx] = {
            ...schedules[existingIdx],
            date: updatedDate,
            start: `${tgtDate}T${prevTime}:00`,
            end: `${tgtDate}T${parseInt(prevTime.split(':')[0], 10) + 1}:00:00`,
            dday: calculateDDay(updatedDate)
          };
        }
        // 신규 중복 일정으로 등록되지 않도록 반환
        return;
      }

      if (task.intent === 'expense' || task.properties?.['금액']) {
        const amt = Number(String(task.properties?.['금액'] || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const cat = task.properties?.['분류'] || (/식사|식비|점심|저녁|카페|커피|간식/.test(taskTitle) ? '식비' : /택시|지하철|버스|주유/.test(taskTitle) ? '교통' : '기타');
        const isLeak = cat === '기타' || /편의점|스타벅스|카페|배달팁|인앱/.test(taskTitle);
        expenses.push({
          id: `qc-ex-${key}`,
          title: task.title,
          amount: amt,
          date: dateStr.split(' ')[0],
          category: cat,
          icon: task.suggestedIcon || (cat === '식비' ? '🍱' : cat === '교통' ? '🚇' : '💰'),
          paymentMethod: (task.properties?.['결제수단'] as any) || '신용카드',
          type: '지출',
          merchant: task.title,
          memo: task.properties?.['메모'] || '',
          isLeak
        });
      } else if (task.intent === 'todo' || task.properties?.['분류'] === '할 일') {
        // [격리] 스마트할일 전용 아이템으로만 등록 (캘린더 일정으로 자동 복제 차단)
        todos.push({
          id: `qc-t-${key}`,
          title: task.title,
          done: task.properties?.['상태'] === '완료',
          priority: task.properties?.['우선순위'] || '🔥 우선',
          category: task.properties?.['카테고리'] || (task.properties?.['분류'] !== '할 일' ? task.properties?.['분류'] : '업무') || '업무',
          dueDate: dateStr.split(' ')[0],
          dday: calculateDDay(dateStr.split(' ')[0]),
          reminder: 'before_30m',
          eisenhower: (task.properties?.['우선순위'] === 'P2' ? 'P2' : task.properties?.['우선순위'] === 'P3' ? 'P3' : task.properties?.['우선순위'] === 'P4' ? 'P4' : 'P1'),
          isTimeBlocked: false
        });
      } else {
        // [격리] 스마트일정(캘린더) 전용 아이템으로만 등록 (할 일 목록으로 자동 복제 차단)
        const pUrl = rec.notionPageUrls?.[tIdx] || rec.notionPageUrls?.[0];
        const pId = pUrl ? pUrl.split('/').pop()?.split('?')[0]?.replace(/-/g, '') : undefined;
        let icon = task.suggestedIcon;
        if (!icon || icon === '⚡') {
          if (/연가|휴가|반차|휴무/.test(taskTitle)) icon = '🌴';
          else if (/치과|병원|진료|검진/.test(taskTitle)) icon = '🏥';
          else if (/회의|미팅|출장/.test(taskTitle)) icon = '💼';
          else icon = '📅';
        }

        const fullTimePart = dateStr.includes(' ') ? dateStr.split(' ')[1] : '10:00';
        const startIso = `${dateStr.split(' ')[0]}T${fullTimePart}:00`;
        const endHour = parseInt(fullTimePart.split(':')[0], 10) + 1;
        const endIso = `${dateStr.split(' ')[0]}T${String(endHour).padStart(2, '0')}:00:00`;

        schedules.push({
          id: `qc-s-${key}`,
          title: task.title,
          date: dateStr,
          start: startIso,
          end: endIso,
          dday: calculateDDay(dateStr),
          category: task.properties?.['분류'] || '일정',
          icon,
          status: task.properties?.['상태'] || '미완료',
          pageUrl: pUrl,
          notionPageId: pId
        });
      }
    });
  });

  return { schedules, expenses, todos };
}
