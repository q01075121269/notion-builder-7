// src/lib/templateUtils.ts
// 템플릿 속성 및 스키마 방어적 정규화 전역 유틸리티

export function getSafeProperties(props: any): any[] {
  if (!props) return [];
  if (Array.isArray(props)) return props;
  if (typeof props === 'object') {
    return Object.entries(props).map(([name, val]: [string, any]) => ({
      name,
      id: val?.id || name,
      type: typeof val === 'string' ? val : (val?.type || 'rich_text'),
      ...(typeof val === 'object' ? val : {})
    }));
  }
  return [];
}

/**
 * 템플릿 객체 수신 시 데이터베이스 및 속성 구조를 100% 안전한 배열로 규격화 (Self-Healing)
 */
export function normalizeTemplateData(template: any): any {
  if (!template) return null;
  const databases = Array.isArray(template.databases) ? template.databases : [];
  return {
    ...template,
    databases: databases.map((db: any) => ({
      ...db,
      properties: getSafeProperties(db?.properties)
    }))
  };
}
