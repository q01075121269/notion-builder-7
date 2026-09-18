// src/services/notionMasterWorkspace.ts
// 노션 3대 마스터 워크스페이스 원클릭 자동 구축 및 로컬 저장 (65줄 최적화)

import { extractNotionPageId, fetchNotionWithBackoff } from './notionApi';
import { 
  LIFE_HUB_DB_SCHEMA, 
  TEMPLATE_ARCHIVE_DB_SCHEMA, 
  DEV_LAB_DB_SCHEMA,
  EXPENSE_LEDGER_DB_SCHEMA
} from './notionMasterSchemas';
import type { CreatedNotionResource, CreatedNotionDatabaseInfo } from '../types/notion';

export async function buildMasterWorkspaceInNotion(
  apiKey: string,
  rawParentPageId: string,
  onProgress?: (step: string, percent: number) => void
): Promise<CreatedNotionResource> {
  const parentPageId = extractNotionPageId(rawParentPageId);
  if (!apiKey?.trim() || !parentPageId) {
    throw new Error('노션 API 키와 부모 페이지 ID가 필요합니다.');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  onProgress?.('👑 마스터 허브 메인 페이지 구성 중...', 15);
  const pageRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '👑' },
      properties: { title: { title: [{ type: 'text', text: { content: '👑 AI Notion Master Hub' } }] } }
    })
  });
  if (!pageRes.ok) throw new Error('마스터 허브 페이지 생성에 실패했습니다.');
  const pageData = await pageRes.json();
  const hubPageId: string = pageData.id;

  const schemas = [
    LIFE_HUB_DB_SCHEMA, 
    EXPENSE_LEDGER_DB_SCHEMA, 
    TEMPLATE_ARCHIVE_DB_SCHEMA, 
    DEV_LAB_DB_SCHEMA
  ];
  const storageKeys = [
    'master_life_hub_db_id', 
    'master_expense_db_id', 
    'master_template_archive_db_id', 
    'master_dev_lab_db_id'
  ];
  const createdDbs: CreatedNotionDatabaseInfo[] = [];

  for (let i = 0; i < schemas.length; i++) {
    const s = schemas[i];
    onProgress?.(`[${s.name}] 데이터베이스 생성 중...`, 25 + i * 18);
    const dbRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: hubPageId },
        icon: { type: 'emoji', emoji: s.icon },
        title: [{ type: 'text', text: { content: s.name } }],
        properties: s.properties
      })
    });
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      localStorage.setItem(storageKeys[i], dbData.id);
      if (storageKeys[i] === 'master_expense_db_id') {
        localStorage.setItem('selected_expense_db_id', dbData.id);
      }
      createdDbs.push({ id: dbData.id, name: s.name, url: dbData.url });
    }
  }

  localStorage.setItem('master_hub_page_id', hubPageId);
  onProgress?.('🎉 마스터 허브 구축 완료!', 100);

  return {
    pageId: hubPageId,
    pageUrl: pageData.url || `https://notion.so/${hubPageId.replace(/-/g, '')}`,
    pageTitle: '👑 AI Notion Master Hub',
    pageIcon: '👑',
    databases: createdDbs,
    createdAt: new Date().toISOString()
  };
}
