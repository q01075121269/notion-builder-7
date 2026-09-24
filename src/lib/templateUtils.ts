// src/lib/templateUtils.ts
// 템플릿 속성 및 스키마 방어적 정규화 전역 유틸리티 (schemaAdapter와 통합 호환)

import { normalizeProperties, normalizeTemplatePayload } from '../utils/schemaAdapter';

export { normalizeProperties, normalizeTemplatePayload };

export function getSafeProperties(props: any): any[] {
  return normalizeProperties(props);
}

/**
 * 템플릿 객체 수신 시 데이터베이스 및 속성 구조를 100% 안전한 배열로 규격화 (Self-Healing)
 */
export function normalizeTemplateData(template: any): any {
  return normalizeTemplatePayload(template);
}
