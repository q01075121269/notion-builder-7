import type { 
  NotionTemplate, 
  NotionDatabase, 
  NotionBlock, 
  NotionProperty,
  CreatedNotionResource,
  CreatedNotionDatabaseInfo,
  PatchActionResponse
} from '../types/notion';
import type { BeginnerGuide } from '../types/guide';

/**
 * 노션 페이지 URL 또는 다양한 포맷의 문자열에서 32자리 UUID를 추출합니다.
 */
export function extractNotionPageId(input: string): string {
  if (!input) return '';
  const cleanInput = input.trim();

  // 1. URL 쿼리스트링 및 해시 제거
  const urlWithoutQuery = cleanInput.split('?')[0].split('#')[0];

  // 2. 32자리 16진수 hex 패턴 검색
  const uuidWithHyphenRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const matchWithHyphen = urlWithoutQuery.match(uuidWithHyphenRegex);
  if (matchWithHyphen) {
    return matchWithHyphen[0].replace(/-/g, '');
  }

  const rawHexMatch = urlWithoutQuery.match(/[0-9a-fA-F]{32}/);
  if (rawHexMatch) {
    return rawHexMatch[0];
  }

  const last32 = urlWithoutQuery.slice(-32);
  if (/^[0-9a-fA-F]{32}$/.test(last32)) {
    return last32;
  }

  return cleanInput.replace(/-/g, '');
}

/**
 * 표준 8-4-4-4-12 UUID 포맷으로 변환
 */
export function formatUuid(id: string): string {
  const clean = id.replace(/-/g, '');
  if (clean.length !== 32) return id;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

/**
 * 노션 공식 API Rate Limit(초당 3회 요청 제한) 방어 및 지수 백오프(Exponential Backoff) 재시도 엔진
 */
export async function fetchNotionWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  // 선제적 호출 간격 350ms 보장 (초당 3회 초과 선제 방지)
  await new Promise(r => setTimeout(r, 350));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // 429 Too Many Requests 감지 시 Exponential Backoff 재시도
      if (res.status === 429) {
        if (attempt === maxRetries) {
          return res;
        }
        const retryAfterHeader = res.headers.get('Retry-After');
        let delayMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : Math.pow(2, attempt) * 600 + Math.random() * 300;
        if (isNaN(delayMs) || delayMs <= 0) delayMs = 1000;
        console.warn(`[Notion Rate Limit 429] ${delayMs}ms 후 자동 재시도합니다... (시도 ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      // 일시적 서버 오류(502, 503, 504) 시 1회 재시도
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      return res;
    } catch (netErr) {
      if (attempt === maxRetries) throw netErr;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  throw new Error('노션 API 통신 재시도 한도를 초과했습니다.');
}

interface PublishProgressCallback {
  (step: string, percentage: number): void;
}

/**
 * 노션 공식 API를 호출하여 사용자의 워크스페이스에 템플릿 페이지, 데이터베이스, 블록들을 자동 생성합니다.
 */
export async function createNotionTemplateInWorkspace(
  template: NotionTemplate,
  apiKey: string,
  rawParentPageId: string,
  onProgress?: PublishProgressCallback
): Promise<CreatedNotionResource> {
  const parentPageId = extractNotionPageId(rawParentPageId);

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Notion API 토큰(Internal Integration Secret)이 입력되지 않았습니다.');
  }

  if (!parentPageId || parentPageId.length < 32) {
    throw new Error('유효한 노션 부모 페이지 ID 또는 URL을 입력해 주세요. (32자리 식별자 필요)');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  // 1단계: 부모 페이지 접근 권한 사전 검증
  if (onProgress) onProgress('부모 페이지 접근 권한을 확인하는 중...', 15);

  try {
    const parentCheckRes = await fetchNotionWithBackoff(`/api/notion/v1/pages/${parentPageId}`, {
      method: 'GET',
      headers
    });

    if (!parentCheckRes.ok) {
      const err = await parentCheckRes.json().catch(() => ({}));
      handleNotionApiError(parentCheckRes.status, err, '부모 페이지 권한 확인');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('부모 페이지')) {
      throw err;
    }
    console.warn('부모 페이지 사전 검증 스킵:', err);
  }

  // 2단계: 메인 페이지 생성
  if (onProgress) onProgress(`"${template.title}" 메인 노션 페이지 생성 중...`, 35);

  const newPagePayload: Record<string, any> = {
    parent: {
      type: 'page_id',
      page_id: parentPageId
    },
    icon: {
      type: 'emoji',
      emoji: template.icon || '📑'
    },
    properties: {
      title: {
        title: [
          {
            type: 'text',
            text: {
              content: template.title
            }
          }
        ]
      }
    }
  };

  if (template.cover_url && template.cover_url.startsWith('http')) {
    newPagePayload.cover = {
      type: 'external',
      external: {
        url: template.cover_url
      }
    };
  }

  const createPageRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify(newPagePayload)
  });

  if (!createPageRes.ok) {
    const err = await createPageRes.json().catch(() => ({}));
    handleNotionApiError(createPageRes.status, err, '메인 페이지 생성');
  }

  const createdPage = await createPageRes.json();
  const createdPageId: string = createdPage.id;
  const createdPageUrl: string = createdPage.url || `https://notion.so/${createdPageId.replace(/-/g, '')}`;

  // 3단계: 데이터베이스 및 속성 스키마 생성
  const createdDatabases: CreatedNotionDatabaseInfo[] = [];

  for (let i = 0; i < template.databases.length; i++) {
    const db = template.databases[i];
    const progressPercent = 45 + Math.round(((i + 1) / (template.databases.length + 1)) * 30);
    if (onProgress) onProgress(`데이터베이스 [${db.name}] 스키마 및 속성 구성 중...`, progressPercent);

    const dbPropertiesPayload = buildDatabasePropertiesPayload(db.properties);

    const createDbPayload = {
      parent: {
        type: 'page_id',
        page_id: createdPageId
      },
      icon: {
        type: 'emoji',
        emoji: '🗂️'
      },
      title: [
        {
          type: 'text',
          text: {
            content: db.name
          }
        }
      ],
      properties: dbPropertiesPayload
    };

    try {
      const createDbRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
        method: 'POST',
        headers,
        body: JSON.stringify(createDbPayload)
      });

      if (!createDbRes.ok) {
        const err = await createDbRes.json().catch(() => ({}));
        console.warn(`DB [${db.name}] 생성 실패, fallback 시도:`, err);
        const fallbackProperties: Record<string, any> = {};
        Object.keys(dbPropertiesPayload).forEach(k => {
          if (dbPropertiesPayload[k].formula) {
            fallbackProperties[k] = { rich_text: {} };
          } else {
            fallbackProperties[k] = dbPropertiesPayload[k];
          }
        });
        createDbPayload.properties = fallbackProperties;
        const retryRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
          method: 'POST',
          headers,
          body: JSON.stringify(createDbPayload)
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          createdDatabases.push({ id: retryData.id, name: db.name, url: retryData.url });
          await insertSampleRows(retryData.id, db, headers, onProgress);
          continue;
        }
      } else {
        const createdDbData = await createDbRes.json();
        createdDatabases.push({ id: createdDbData.id, name: db.name, url: createdDbData.url });
        await insertSampleRows(createdDbData.id, db, headers, onProgress);
      }
    } catch (dbErr) {
      console.error(`DB ${db.name} 생성 중 예외:`, dbErr);
    }
  }

  // 4단계: 본문 레이아웃 블록(Children Blocks) 생성
  if (onProgress) onProgress('본문 레이아웃 블록(콜아웃, 토글, 텍스트) 생성 중...', 85);

  const blocksPayload = convertTemplateBlocksToNotionPayload(template.page_layout);

  if (blocksPayload.length > 0) {
    try {
      await fetchNotionWithBackoff(`/api/notion/v1/blocks/${createdPageId}/children`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          children: blocksPayload
        })
      });
    } catch (blockErr) {
      console.error('본문 블록 생성 예외:', blockErr);
    }
  }

  if (onProgress) onProgress('템플릿 생성 완료!', 100);

  return {
    pageId: createdPageId,
    pageUrl: createdPageUrl,
    pageTitle: template.title,
    pageIcon: template.icon,
    databases: createdDatabases,
    createdAt: new Date().toISOString()
  };
}

/**
 * [3단계 핵심] 사용자의 실제 노션 워크스페이스에 부분 업데이트(PATCH)를 실행합니다.
 */
export async function applyPatchToRemoteWorkspace(
  patch: PatchActionResponse,
  apiKey: string,
  resource: CreatedNotionResource
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !resource || !resource.pageId) {
    return { success: false, message: '노션 연동 정보가 없습니다.' };
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    // 1. 데이터베이스 속성(컬럼) 부분 수정: PATCH /v1/databases/{database_id}
    if (patch.action === 'UPDATE_DATABASE') {
      const targetDbName = patch.target_id || '';
      const targetDb = resource.databases.find(
        d => d.name.toLowerCase().includes(targetDbName.toLowerCase()) || targetDbName.toLowerCase().includes(d.name.toLowerCase())
      ) || resource.databases[0];

      if (targetDb && patch.changes.new_properties && patch.changes.new_properties.length > 0) {
        const patchPropertiesPayload = buildDatabasePropertiesPayload(patch.changes.new_properties);
        const res = await fetchNotionWithBackoff(`/api/notion/v1/databases/${targetDb.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            properties: patchPropertiesPayload
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('DB PATCH 실패:', err);
          return { success: false, message: `DB 속성 수정 실패: ${err.message || '요청 거부'}` };
        }

        return { success: true, message: `노션 DB [${targetDb.name}]에 새 속성이 실시간 추가되었습니다!` };
      }
    }

    // 2. 블록 추가: PATCH /v1/blocks/{page_id}/children
    if (patch.action === 'ADD_BLOCK' && patch.changes.blocks_to_append && patch.changes.blocks_to_append.length > 0) {
      const blocksPayload = convertTemplateBlocksToNotionPayload(patch.changes.blocks_to_append);
      const res = await fetchNotionWithBackoff(`/api/notion/v1/blocks/${resource.pageId}/children`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          children: blocksPayload
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('블록 추가 PATCH 실패:', err);
        return { success: false, message: `블록 추가 실패: ${err.message || '요청 거부'}` };
      }

      return { success: true, message: '노션 페이지 하단에 새 블록이 실시간 추가되었습니다!' };
    }

    // 3. 페이지 속성(제목, 아이콘) 수정: PATCH /v1/pages/{page_id}
    if (patch.action === 'UPDATE_PAGE') {
      const pagePatchPayload: Record<string, any> = {};
      if (patch.changes.updated_title) {
        pagePatchPayload.properties = {
          title: {
            title: [{ type: 'text', text: { content: patch.changes.updated_title } }]
          }
        };
      }
      if (patch.changes.updated_icon) {
        pagePatchPayload.icon = {
          type: 'emoji',
          emoji: patch.changes.updated_icon
        };
      }

      if (Object.keys(pagePatchPayload).length > 0) {
        const res = await fetchNotionWithBackoff(`/api/notion/v1/pages/${resource.pageId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(pagePatchPayload)
        });

        if (res.ok) {
          return { success: true, message: '노션 페이지 정보(제목/아이콘)가 실시간 업데이트되었습니다!' };
        }
      }
    }

    return { success: true, message: '노션 워크스페이스와 정상 동기화되었습니다.' };
  } catch (err: any) {
    console.error('원격 PATCH 수행 예외:', err);
    return { success: false, message: `원격 노션 동기화 실패: ${err.message}` };
  }
}

/**
 * 데이터베이스 속성 목록을 노션 REST API Payload 객체로 변환
 */
function buildDatabasePropertiesPayload(properties: NotionProperty[]): Record<string, any> {
  const payload: Record<string, any> = {};

  properties.forEach(prop => {
    const type = prop.type;
    if (type === 'title') {
      payload[prop.name] = { title: {} };
    } else if (type === 'date') {
      payload[prop.name] = { date: {} };
    } else if (type === 'status') {
      payload[prop.name] = {
        status: {
          options: (prop.options || ['시작 전', '진행 중', '완료']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'formula') {
      const expr = prop.expression ? sanitizeFormula(prop.expression) : 'prop("이름")';
      payload[prop.name] = {
        formula: {
          expression: expr
        }
      };
    } else if (type === 'select') {
      payload[prop.name] = {
        select: {
          options: (prop.options || ['선택 1', '선택 2']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'multi_select') {
      payload[prop.name] = {
        multi_select: {
          options: (prop.options || ['태그 1', '태그 2']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'checkbox') {
      payload[prop.name] = { checkbox: {} };
    } else if (type === 'number') {
      payload[prop.name] = { number: { format: 'number' } };
    } else {
      payload[prop.name] = { rich_text: {} };
    }
  });

  return payload;
}

/**
 * 데이터베이스 샘플 행(Row) 일괄 등록 파이프라인
 * - JSON 내 sample_rows에 담긴 가상 데이터를 페이지 항목으로 순차 등록
 * - formula 속성은 노션 API read-only 계산 필드이므로 페이로드에서 제외하여 오류 방지
 * - 진행 상태 피드백 ("샘플 예시 데이터 채우는 중 (1/3)...") 실시간 제공
 */
async function insertSampleRows(
  databaseId: string, 
  db: NotionDatabase, 
  headers: any, 
  onProgress?: PublishProgressCallback
) {
  if (!db.sample_rows || db.sample_rows.length === 0) return;
  const rowsToInsert = db.sample_rows.slice(0, 5); // 최대 5개 샘플 행 등록
  const totalRows = rowsToInsert.length;

  for (let i = 0; i < totalRows; i++) {
    const row = rowsToInsert[i];
    if (onProgress) {
      onProgress(`[${db.name}] 샘플 예시 데이터 채우는 중 (${i + 1}/${totalRows})...`, 70 + Math.round(((i + 1) / totalRows) * 12));
    }

    const rowProperties: Record<string, any> = {};

    db.properties.forEach(prop => {
      const val = row[prop.name];
      if (val === undefined || val === null || val === '') return;

      if (prop.type === 'title') {
        rowProperties[prop.name] = {
          title: [{ type: 'text', text: { content: String(val) } }]
        };
      } else if (prop.type === 'date') {
        const rawDate = String(val).split(' ')[0].trim();
        // YYYY-MM-DD 포맷 정규식 및 Date 객체 무결성 검증
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !isNaN(new Date(rawDate).getTime());
        const safeDate = isValidDate ? rawDate : new Date().toISOString().split('T')[0];
        rowProperties[prop.name] = {
          date: { start: safeDate }
        };
      } else if (prop.type === 'status') {
        // 노션 스키마에 정의된 options와 1:1 매칭 보장
        const validOptions = prop.options || ['시작 전', '진행 중', '완료'];
        const stringVal = String(val).trim();
        const matched = validOptions.find(opt => opt.toLowerCase() === stringVal.toLowerCase()) || validOptions[0];
        rowProperties[prop.name] = {
          status: { name: matched }
        };
      } else if (prop.type === 'select') {
        rowProperties[prop.name] = {
          select: { name: String(val).trim() }
        };
      } else if (prop.type === 'multi_select') {
        const items = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim());
        rowProperties[prop.name] = {
          multi_select: items.map((name: string) => ({ name }))
        };
      } else if (prop.type === 'checkbox') {
        rowProperties[prop.name] = {
          checkbox: Boolean(val)
        };
      } else if (prop.type === 'number') {
        const numVal = Number(String(val).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numVal)) {
          rowProperties[prop.name] = {
            number: numVal
          };
        }
      } else if (prop.type === 'url') {
        rowProperties[prop.name] = {
          url: String(val).trim()
        };
      } else if (prop.type !== 'formula' && prop.type !== 'relation') {
        rowProperties[prop.name] = {
          rich_text: [{ type: 'text', text: { content: String(val) } }]
        };
      }
      // formula와 relation은 노션 API에서 수동 주입 불가(계산 필드/ID 필요)하므로 안전하게 제외
    });

    try {
      const res = await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: rowProperties
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[${db.name}] 샘플 행 ${i + 1} 삽입 응답 경고:`, errJson);
      }
    } catch (e) {
      console.warn(`[${db.name}] 샘플 행 ${i + 1} 삽입 네트워크 오류 (무시하고 계속):`, e);
    }
  }
}

/**
 * 템플릿의 page_layout 블록들을 노션 공식 Block Children 포맷으로 변환
 */
function convertTemplateBlocksToNotionPayload(blocks: NotionBlock[]): any[] {
  const result: any[] = [];

  for (const block of blocks) {
    if (block.type === 'callout') {
      result.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content.replace(/\*\*/g, '')
              }
            }
          ],
          icon: {
            type: 'emoji',
            emoji: block.icon || '💡'
          },
          color: 'blue_background'
        }
      });
    } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const headingType = block.type;
      result.push({
        object: 'block',
        type: headingType,
        [headingType]: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    } else if (block.type === 'toggle') {
      const toggleChildren: any[] = [];
      if (block.content) {
        toggleChildren.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: block.content } }]
          }
        });
      }
      if (block.blocks) {
        toggleChildren.push(...convertTemplateBlocksToNotionPayload(block.blocks));
      }

      result.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.title
              }
            }
          ],
          children: toggleChildren.length > 0 ? toggleChildren.slice(0, 10) : undefined
        }
      });
    } else if (block.type === 'bulleted_list_item') {
      result.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    } else if (block.type === 'divider') {
      result.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    } else if (block.type === 'column_list') {
      if (block.columns && block.columns.length > 0) {
        block.columns.forEach(col => {
          if (col.blocks) {
            result.push(...convertTemplateBlocksToNotionPayload(col.blocks));
          }
        });
      }
    } else if (block.type === 'paragraph') {
      result.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    }
  }

  return result.slice(0, 95);
}

function sanitizeFormula(expression: string): string {
  if (!expression) return 'prop("이름")';
  return expression.replace(/‘|’/g, "'").replace(/“|”/g, '"');
}

function handleNotionApiError(status: number, errBody: any, context: string) {
  const code = errBody?.code || '';
  const rawMsg = errBody?.message || '';

  if (status === 401) {
    throw new Error(
      `[Notion API 인증 실패] 입력하신 내부 통합 토큰(Internal Integration Secret)이 유효하지 않습니다. 토큰 값(secret_...)을 다시 확인해 주세요.`
    );
  }

  if (status === 403 || status === 404) {
    throw new Error(
      `[노션 페이지 접근 권한 없음] 부모 페이지(${context})를 찾을 수 없거나 접근 권한이 없습니다.\n\n해결 방법:\n1. 대상 노션 페이지 우측 상단 '···' 클릭\n2. '연결(Connect to)' 메뉴 클릭\n3. 발급받으신 노션 통합을 반드시 '추가'해 주세요.`
    );
  }

  if (status === 400) {
    throw new Error(
      `[요청 규격 오류] 노션 API 요청 형식이 올바르지 않습니다: ${rawMsg || code || '부모 페이지 ID를 확인해 주세요.'}`
    );
  }

  throw new Error(`[Notion API 오류 (${status})] ${rawMsg || '노션 API 요청 처리 중 오류가 발생했습니다.'}`);
}

/**
 * 5단계: 노션 페이지 본문 최상단에 [📖 친절한 설명서 (열기)] 토글 블록을 자동 삽입합니다.
 */
export async function appendGuideToggleToNotionPage(
  pageId: string,
  guide: BeginnerGuide,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanId = extractNotionPageId(pageId);
  const formattedId = formatUuid(cleanId);

  const toggleChildren: any[] = [
    // 1. 3줄 요약 콜아웃
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        rich_text: [
          {
            type: 'text',
            text: {
              content: `📌 [이 템플릿으로 할 수 있는 일 3가지]\n\n1. ${guide.summary[0] || ''}\n2. ${guide.summary[1] || ''}\n3. ${guide.summary[2] || ''}`
            },
            annotations: { bold: false }
          }
        ]
      }
    },
    // 2. 첫날 3가지 따라하기 헤딩
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🚀 첫날 딱 3가지만 따라 하기' } }]
      }
    }
  ];

  // 3단계 행동 요령 블록 추가
  guide.firstDaySteps.forEach(step => {
    toggleChildren.push({
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: `${step.title}: ` },
            annotations: { bold: true }
          },
          {
            type: 'text',
            text: { content: `${step.description} (예: ${step.actionExample})` }
          }
        ]
      }
    });
  });

  // 3. 달력 연동 팁 콜아웃
  toggleChildren.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '📅' },
      rich_text: [
        {
          type: 'text',
          text: {
            content: `[달력과 함께 보는 법]\n${guide.calendarGuide.description}\n\n💡 꿀팁: ${guide.calendarGuide.proTip}`
          }
        }
      ]
    }
  });

  // 4. 자주 묻는 질문 FAQ
  toggleChildren.push({
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: '❓ 자주 묻는 질문 (FAQ)' } }]
    }
  });

  guide.faqs.forEach(faq => {
    toggleChildren.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: `Q. ${faq.question}\n👉 A. ${faq.answer}` } }
        ]
      }
    });
  });

  // 전체 토글 블록 구성
  const guideToggleBlock = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: { content: `📖 [처음 사용자를 위한 친절한 설명서 (눌러서 열기)] - ${guide.headline}` },
          annotations: { bold: true, color: 'blue' }
        }
      ],
      children: toggleChildren.slice(0, 95) // 노션 블록 중첩 최대치 안전 제한
    }
  };

  try {
    const res = await fetchNotionWithBackoff(`/api/notion/v1/blocks/${formattedId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        children: [guideToggleBlock]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleNotionApiError(res.status, err, formattedId);
    }

    return {
      success: true,
      message: '노션 페이지에 설명서 토글 블록이 성공적으로 추가되었습니다!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || '노션 API 토글 블록 삽입 중 오류가 발생했습니다.'
    };
  }
}

