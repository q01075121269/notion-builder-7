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
/**
 * 다중 관계형(Relation) 시드 데이터 상호 체이닝(Mutual Linking) 및
 * Formulas 2.0 진척률(달성률) 비주얼 게이지 바 속성 자동 주입 엔진
 */
function autoLinkRelationsAndFormulas(databases: NotionDatabase[]): NotionDatabase[] {
  if (!Array.isArray(databases) || databases.length === 0) return databases;

  // 1. 단일 DB인 경우: 상위 진척률(수식) 게이지 보강
  if (databases.length === 1) {
    const db = databases[0];
    const hasGaugeFormula = db.properties.some(p => 
      p.type === 'formula' && (/진행|진척|달성|게이지/i.test(p.name))
    );

    if (!hasGaugeFormula) {
      db.properties.push({
        id: `prop_formula_gauge_${Date.now()}`,
        name: '진척률 (수식)',
        type: 'formula',
        expression: 'lets(s, prop("상태"), rate, if(s == "완료", 100, if(s == "진행 중", 60, if(s == "검토", 80, 20))), filled, round(rate / 20), slice("■■■■■", 0, filled) + slice("□□□□□", 0, 5 - filled) + " " + rate + "%")'
      });
    }

    if (Array.isArray(db.sample_rows)) {
      db.sample_rows = db.sample_rows.map(row => {
        const status = String(row['상태'] || row['진행상태'] || row['Status'] || '');
        let gaugeVal = '■■■□□ 60%';
        if (/완료|Done/i.test(status)) gaugeVal = '■■■■■ 100%';
        else if (/검토|Review/i.test(status)) gaugeVal = '■■■■□ 80%';
        else if (/대기|시작전/i.test(status)) gaugeVal = '■□□□□ 20%';
        return {
          ...row,
          '진척률 (수식)': row['진척률 (수식)'] || row['진척률'] || row['진행률'] || gaugeVal
        };
      });
    }
    return [db];
  }

  // 2. 다중 DB (2개 이상)인 경우: 상위 마스터 DB(0번) ↔ 하위 실행 DB(1번) 상호 체이닝
  const parentDb = databases[0];
  const childDb = databases[1];

  // 상위 DB relation 속성 탐색 또는 신설
  let parentRelProp = parentDb.properties.find(p => p.type === 'relation');
  if (!parentRelProp) {
    parentRelProp = {
      id: `prop_rel_child_${Date.now()}`,
      name: '세부 과제 (연결)',
      type: 'relation'
    };
    parentDb.properties.push(parentRelProp);
  }

  // 상위 DB Formulas 2.0 진척률(달성률) 비주얼 게이지 바 속성 탐색 또는 신설
  let parentGaugeProp = parentDb.properties.find(p => 
    p.type === 'formula' && (/진행|진척|달성|게이지/i.test(p.name))
  );
  if (!parentGaugeProp) {
    parentGaugeProp = {
      id: `prop_formula_gauge_${Date.now()}`,
      name: '진척률 (수식)',
      type: 'formula',
      expression: `lets(
  total, if(empty(prop("${parentRelProp.name}")), 1, prop("${parentRelProp.name}").length()),
  done, if(empty(prop("${parentRelProp.name}")), if(prop("상태") == "완료", 1, 0), prop("${parentRelProp.name}").filter(current.prop("상태") == "완료").length()),
  rate, if(total > 0, round(done / total * 100), 0),
  filled, round(rate / 20),
  slice("■■■■■", 0, filled) + slice("□□□□□", 0, 5 - filled) + " " + rate + "%"
)`
    };
    // 제목 바로 옆이나 상태 옆에 위치하도록 배치
    parentDb.properties.splice(1, 0, parentGaugeProp);
  }

  // 하위 DB relation 속성 탐색 또는 신설
  let childRelProp = childDb.properties.find(p => p.type === 'relation');
  if (!childRelProp) {
    childRelProp = {
      id: `prop_rel_parent_${Date.now()}`,
      name: '상위 프로젝트 (연결)',
      type: 'relation'
    };
    childDb.properties.push(childRelProp);
  }

  // 각 DB 타이틀 속성명 식별
  const parentTitleProp = parentDb.properties.find(p => p.type === 'title') || parentDb.properties[0];
  const childTitleProp = childDb.properties.find(p => p.type === 'title') || childDb.properties[0];

  const parentRows = Array.isArray(parentDb.sample_rows) ? [...parentDb.sample_rows] : [];
  const childRows = Array.isArray(childDb.sample_rows) ? [...childDb.sample_rows] : [];

  if (parentRows.length > 0 && childRows.length > 0) {
    // 하위 과제명 리스트 추출
    const childTitles = childRows.map(r => String(r[childTitleProp.name] || Object.values(r)[0] || '세부 과제'));

    // 상위 프로젝트명 리스트 추출
    const parentTitles = parentRows.map(r => String(r[parentTitleProp.name] || Object.values(r)[0] || '마스터 프로젝트'));

    // 상위 행들에 하위 과제들 상호 연결 및 진척률 게이지 값 할당
    parentDb.sample_rows = parentRows.map((pRow, pIdx) => {
      // 각 상위 프로젝트마다 하위 과제를 2개 내외로 분할 매핑
      const assignedChildTitles = childTitles.slice(pIdx * 2, pIdx * 2 + 2);
      const effectiveChildTitles = assignedChildTitles.length > 0 ? assignedChildTitles : [childTitles[pIdx % childTitles.length]];

      // 하위 과제들의 상태 기반 게이지 값 계산
      const matchedChildRows = childRows.filter(cr => 
        effectiveChildTitles.includes(String(cr[childTitleProp.name] || Object.values(cr)[0]))
      );
      const doneCount = matchedChildRows.filter(cr => {
        const s = String(cr['상태'] || cr['진행상태'] || cr['Status'] || '');
        return /완료|Done|합격/i.test(s);
      }).length;
      const totalCount = matchedChildRows.length || 1;
      const rate = Math.round((doneCount / totalCount) * 100);
      const filled = Math.min(5, Math.max(0, Math.round(rate / 20)));
      const gaugeBar = `${'■'.repeat(filled)}${'□'.repeat(5 - filled)} ${rate}%`;

      return {
        ...pRow,
        [parentRelProp.name]: (Array.isArray(pRow[parentRelProp.name]) && pRow[parentRelProp.name].length > 0)
          ? pRow[parentRelProp.name]
          : effectiveChildTitles,
        [parentGaugeProp.name]: pRow[parentGaugeProp.name] || gaugeBar
      };
    });

    // 하위 행들에 해당 상위 프로젝트명 상호 연결
    childDb.sample_rows = childRows.map((cRow, cIdx) => {
      const assignedParentTitle = parentTitles[Math.floor(cIdx / 2) % parentTitles.length] || parentTitles[0];
      return {
        ...cRow,
        [childRelProp.name]: (Array.isArray(cRow[childRelProp.name]) && cRow[childRelProp.name].length > 0)
          ? cRow[childRelProp.name]
          : [assignedParentTitle]
      };
    });
  }

  return databases;
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

  const rawMappedDbs: NotionDatabase[] = rawDatabases.map((db: any, dbIdx: number) => {
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

  // 다중 관계형 시드 데이터 상호 체이닝 및 Formulas 2.0 진척률 게이지 바 속성 자동 주입
  const databases = autoLinkRelationsAndFormulas(rawMappedDbs);

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
