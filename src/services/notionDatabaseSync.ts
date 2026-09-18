// src/services/notionDatabaseSync.ts
// 노션 워크스페이스 DB 목록 자동 재조회 및 동기화 엔진 (65줄 최적화)

import { extractNotionPageId, fetchNotionWithBackoff } from './notionApi';
import type { CreatedNotionResource, CreatedNotionDatabaseInfo } from '../types/notion';

export async function fetchNotionDatabases(
  apiKey: string,
  rawParentPageId: string
): Promise<CreatedNotionResource | null> {
  const parentPageId = extractNotionPageId(rawParentPageId);
  if (!apiKey?.trim() || !parentPageId) return null;

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    // 1. 연결된 워크스페이스 내 모든 데이터베이스 조회
    const searchRes = await fetchNotionWithBackoff('/api/notion/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { value: 'database', property: 'object' },
        page_size: 50
      })
    });

    const databases: CreatedNotionDatabaseInfo[] = [];
    if (searchRes.ok) {
      const data = await searchRes.json();
      (data.results || []).forEach((db: any) => {
        const title = db.title?.[0]?.plain_text || db.title?.[0]?.text?.content || '이름 없는 데이터베이스';
        databases.push({ id: db.id, name: title, url: db.url });
        if (title.includes('라이프')) {
          localStorage.setItem('master_life_hub_db_id', db.id);
        }
      });
    }

    // 2. 부모 페이지 기본 정보 조회
    const pageRes = await fetchNotionWithBackoff(`/api/notion/v1/pages/${parentPageId}`, {
      method: 'GET',
      headers
    }).catch(() => null);

    let pageTitle = '노션 워크스페이스';
    let pageUrl = `https://notion.so/${parentPageId.replace(/-/g, '')}`;
    if (pageRes && pageRes.ok) {
      const pageData = await pageRes.json();
      pageTitle = pageData.properties?.title?.title?.[0]?.plain_text || pageTitle;
      pageUrl = pageData.url || pageUrl;
    }

    const resource: CreatedNotionResource = {
      pageId: parentPageId,
      pageUrl,
      pageTitle,
      databases,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('created_notion_resource', JSON.stringify(resource));
    return resource;
  } catch (err) {
    console.warn('[NotionSync] DB 목록 자동 재조회 실패:', err);
    return null;
  }
}
