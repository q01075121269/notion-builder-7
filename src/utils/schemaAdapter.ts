// src/utils/schemaAdapter.ts
// DB properties 스키마 어댑터 정규화 및 런타임 타입 충돌 원천 방어 (AI_DEV_RULES 준수)

import type { NotionTemplate, NotionDatabase, NotionProperty, NotionPropertyType } from '../types/notion';

/**
 * 임의의 문자열 또는 타입을 NotionPropertyType으로 안전하게 변환
 */
export function mapToPropertyType(rawType: any, isFirst = false): NotionPropertyType {
  const str = String(rawType || '').toLowerCase();
  if (str === 'text' || str === 'rich_text' || str === 'string') return 'text';
  if (str === 'title') return 'title';
  if (str === 'date' || str === 'datetime') return 'date';
  if (str === 'number' || str === 'numeric' || str === 'int' || str === 'float') return 'number';
  if (str === 'select') return 'select';
  if (str === 'multi_select') return 'multi_select';
  if (str === 'status') return 'status';
  if (str === 'formula') return 'formula';
  if (str === 'relation') return 'relation';
  if (str === 'rollup') return 'rollup';
  if (str === 'checkbox' || str === 'boolean') return 'checkbox';
  if (str === 'url') return 'url';
  if (str === 'person' || str === 'people' || str === 'user') return 'person';
  return isFirst ? 'title' : 'text';
}

/**
 * properties가 객체(Record<string, any>), 배열, undefined, null 등 다양한 형태로 유입되어도
 * 캔버스가 안전하게 읽을 수 있는 표준 배열 [{ id, name, type, ... }] 형태로 즉시 변환합니다.
 */
export function normalizeProperties(props: any): NotionProperty[] {
  if (props === undefined || props === null) {
    return [];
  }

  // 1. 이미 배열 형태인 경우: 누락된 필수 필드(id, name, type) 보정 및 정규화
  if (Array.isArray(props)) {
    return props
      .filter((item) => item !== null && item !== undefined)
      .map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `prop_${idx}_${item}`,
            name: item,
            type: mapToPropertyType(idx === 0 ? 'title' : 'text', idx === 0),
          };
        }
        if (typeof item === 'object') {
          const name = String(item.name || item.id || `속성 ${idx + 1}`);
          const id = String(item.id || item.name || `prop_${idx}`);
          const type = mapToPropertyType(item.type, idx === 0);

          return {
            ...item,
            id,
            name,
            type,
          };
        }
        return {
          id: `prop_${idx}`,
          name: `속성 ${idx + 1}`,
          type: 'text' as NotionPropertyType,
        };
      });
  }

  // 2. 객체 형태인 경우 (Record<string, any> 또는 Notion 공식 API 응답 포맷):
  // { "이름": { type: "title", ... }, "상태": { type: "status" } } -> 배열로 즉시 변환
  if (typeof props === 'object') {
    return Object.entries(props).map(([propKey, val]: [string, any], idx) => {
      const name = propKey || `속성 ${idx + 1}`;
      if (typeof val === 'string') {
        return {
          id: `prop_${idx}_${name}`,
          name,
          type: mapToPropertyType(val, idx === 0),
        };
      }
      if (val && typeof val === 'object') {
        const type = mapToPropertyType(val.type, idx === 0);
        return {
          ...val,
          id: String(val.id || name),
          name,
          type,
        };
      }
      return {
        id: `prop_${idx}_${name}`,
        name,
        type: mapToPropertyType(idx === 0 ? 'title' : 'text', idx === 0),
      };
    });
  }

  return [];
}

/**
 * AI 응답이나 백엔드 페이로드 전체를 수신하여 databases, properties, page_layout 등을
 * 100% 안전하게 정규화합니다. (Cannot read properties of undefined 크래시 원천 방어)
 */
export function normalizeTemplatePayload(payload: any): NotionTemplate | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const rawDatabases = Array.isArray(payload.databases) ? payload.databases : [];

  const databases: NotionDatabase[] = rawDatabases.map((db: any, dbIdx: number) => {
    const rawProps = db?.properties ?? db?.schema ?? db?.columns;
    const properties = normalizeProperties(rawProps);
    const dbName = String(db?.name || db?.db_name || db?.title || `데이터베이스 ${dbIdx + 1}`);

    return {
      ...db,
      id: db?.id || `db-${dbIdx}-${Date.now()}`,
      name: dbName,
      description: db?.description || '',
      properties,
      sample_rows: Array.isArray(db?.sample_rows) ? db.sample_rows : undefined,
    };
  });

  return {
    ...payload,
    id: payload.id || `template-${Date.now()}`,
    title: payload.title || '새 맞춤형 워크스페이스',
    description: payload.description || '',
    cover_url: payload.cover_url || '',
    icon: payload.icon || '📑',
    page_layout: Array.isArray(payload.page_layout) ? payload.page_layout : [],
    databases,
  };
}

export default normalizeTemplatePayload;
