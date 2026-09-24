// api/notion/export.ts
// 노션 1:1 무손실 내보내기 & 접이식 토글(Toggle) 가이드 파이프라인 API 엔드포인트
// (Vercel Serverless & Node.js 호환)


let lastReqTime = 0;
let queueChain = Promise.resolve();

async function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const now = Date.now();
    const elapsed = now - lastReqTime;
    const interval = 350; // 초당 3회 제한 방어
    if (elapsed < interval) {
      await new Promise(r => setTimeout(r, interval - elapsed));
    }
    lastReqTime = Date.now();
    return fn();
  };
  const next = queueChain.then(run, run);
  queueChain = next.then(() => {}, () => {});
  return next;
}

async function fetchNotionWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
  return enqueueRequest(async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, options);
      if (res.status === 429) {
        if (attempt === maxRetries) return res;
        const retryHeader = res.headers.get('Retry-After');
        const delay = retryHeader ? parseInt(retryHeader, 10) * 1000 : 1200;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return res;
    }
    throw new Error('Notion API 재시도 초과');
  });
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version, x-notion-api-key');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = (req.headers['x-notion-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || '').trim();
    if (!apiKey) {
      return res.status(401).json({ error: 'Notion API 토큰이 필요합니다.' });
    }

    const { template, parentPageId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!template || !parentPageId) {
      return res.status(400).json({ error: 'template과 parentPageId가 필요합니다.' });
    }

    const cleanParentId = parentPageId.replace(/-/g, '').slice(-32);
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };

    // 1. 최상단 접이식 토글(Toggle) 가이드 블록 구성
    const toggleChildren: any[] = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  `⏱️ [1초 뷰 세팅 가이드 - 타임라인 & 보드 뷰 활성화]\n` +
                  `1. 생성된 아래 데이터베이스 우측 상단의 '+ (뷰 추가)' 버튼을 클릭합니다.\n` +
                  `2. [⏱️ 타임라인(Timeline)] 또는 [📋 보드(Board)] 뷰를 선택합니다.\n` +
                  `3. 타임라인 날짜 기준은 자동 생성된 '일정/마감일(Date)' 속성이 1:1 매핑되어 즉시 활성화됩니다!\n` +
                  `4. 보드 뷰는 '상태(Status)' 속성 기준으로 자동 컬럼 분기되어 실무 칸반으로 동작합니다.`
              }
            }
          ],
          icon: { type: 'emoji', emoji: '⏱️' },
          color: 'blue_background'
        }
      },
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  `🤖 [2026 노션 자율 에이전트 3.0 공식 지침서 (SKILL.md 규격)]\n` +
                  `• 페르소나/역할: ${template.title} 총괄 업무 PM 에이전트\n` +
                  `• 핵심 목표: ${template.description || `${template.title} 데이터 무결성 검수 및 실시간 공정 자동화`}\n` +
                  `• 복합 트리거: 매일 09:00 정기 점검 | 상태 '불량/지연' 감지 시 즉시 보고 | 슬랙/이메일 알림\n` +
                  `• 워크슬롭 방지 완료 3원칙:\n` +
                  `  1) 모든 필수 속성(제목, 상태, 마감일) 100% 정상 입력\n` +
                  `  2) 다중 데이터베이스 간 Relation 및 Rollup 양방향 정상 연결\n` +
                  `  3) Formulas 2.0 lets() 진행률 게이지 및 D-Day 정상 산출`
              }
            }
          ],
          icon: { type: 'emoji', emoji: '🤖' },
          color: 'purple_background'
        }
      }
    ];

    const initialBlocks: any[] = [
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '▶ 💡 [1초 뷰 세팅 가이드 & AI 에이전트 지침서] (세팅 완료 후 본 블록을 삭제하세요)' },
              annotations: { bold: true, color: 'blue' }
            }
          ],
          children: toggleChildren
        }
      },
      { object: 'block', type: 'divider', divider: {} }
    ];

    // 2. 메인 페이지 생성
    const newPagePayload: any = {
      parent: { type: 'page_id', page_id: cleanParentId },
      icon: { type: 'emoji', emoji: template.icon || '📑' },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: template.title } }]
        }
      },
      children: initialBlocks
    };

    if (template.cover_url && template.cover_url.startsWith('http')) {
      newPagePayload.cover = { type: 'external', external: { url: template.cover_url } };
    }

    const pageRes = await fetchNotionWithRetry('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify(newPagePayload)
    });

    if (!pageRes.ok) {
      const errData = await pageRes.json().catch(() => ({}));
      return res.status(pageRes.status).json({ error: errData.message || '메인 페이지 생성 실패' });
    }

    const pageData = await pageRes.json();
    const createdPageId = pageData.id;
    const createdPageUrl = pageData.url || `https://notion.so/${createdPageId.replace(/-/g, '')}`;

    // 3. 다중 마스터 DB 순차 비동기 생성 (Rate Limit 방어)
    const createdDbs: any[] = [];
    const databases = Array.isArray(template.databases) ? template.databases : [];

    for (const db of databases) {
      const propertiesPayload: Record<string, any> = {
        '이름': { title: {} }
      };

      const props = Array.isArray(db.properties) ? db.properties : [];
      for (const p of props) {
        if (p.type === 'title') continue;
        if (p.type === 'date') propertiesPayload[p.name] = { date: {} };
        else if (p.type === 'status') propertiesPayload[p.name] = { status: {} };
        else if (p.type === 'select') propertiesPayload[p.name] = { select: {} };
        else if (p.type === 'multi_select') propertiesPayload[p.name] = { multi_select: {} };
        else if (p.type === 'checkbox') propertiesPayload[p.name] = { checkbox: {} };
        else if (p.type === 'number') propertiesPayload[p.name] = { number: {} };
        else if (p.type === 'url') propertiesPayload[p.name] = { url: {} };
        else if (p.type !== 'formula' && p.type !== 'relation' && p.type !== 'rollup') {
          propertiesPayload[p.name] = { rich_text: {} };
        }
      }

      const dbPayload = {
        parent: { type: 'page_id', page_id: createdPageId },
        is_inline: true,
        icon: { type: 'emoji', emoji: db.icon || '📊' },
        title: [{ type: 'text', text: { content: db.name } }],
        properties: propertiesPayload
      };

      const dbRes = await fetchNotionWithRetry('https://api.notion.com/v1/databases', {
        method: 'POST',
        headers,
        body: JSON.stringify(dbPayload)
      });

      if (dbRes.ok) {
        const dbData = await dbRes.json();
        createdDbs.push({ id: dbData.id, name: db.name });

        // 샘플 행 1~3건 순차 삽입
        const rows = Array.isArray(db.sample_rows) ? db.sample_rows.slice(0, 3) : [];
        for (const row of rows) {
          const rowProps: Record<string, any> = {};
          const titleVal = Object.values(row)[0] || `${db.name} 항목`;
          rowProps['이름'] = { title: [{ type: 'text', text: { content: String(titleVal) } }] };

          for (const p of props) {
            if (p.type === 'title') continue;
            const val = row[p.name];
            if (val === undefined || val === null || val === '') continue;

            if (p.type === 'date') {
              rowProps[p.name] = { date: { start: String(val).split(' ')[0] } };
            } else if (p.type === 'checkbox') {
              rowProps[p.name] = { checkbox: Boolean(val) };
            } else if (p.type === 'number') {
              rowProps[p.name] = { number: Number(val) || 0 };
            } else if (p.type !== 'formula' && p.type !== 'relation' && p.type !== 'rollup') {
              rowProps[p.name] = { rich_text: [{ type: 'text', text: { content: String(val).slice(0, 1500) } }] };
            }
          }

          await fetchNotionWithRetry('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent: { database_id: dbData.id },
              properties: rowProps
            })
          }).catch(() => {});
        }
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      ok: true,
      pageId: createdPageId,
      pageUrl: createdPageUrl,
      pageTitle: template.title,
      databases: createdDbs
    });
  } catch (err: any) {
    console.error('Notion Export Error:', err);
    return res.status(500).json({ error: err.message || '노션 배포 처리 중 오류 발생' });
  }
}
