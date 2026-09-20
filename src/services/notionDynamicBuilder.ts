// src/services/notionDynamicBuilder.ts
// AI 오케스트레이터 payload 및 채팅 명령어를 최상급 NotionTemplate 구조체로 동적 인스턴스화

import type { NotionTemplate, NotionDatabase, NotionProperty, NotionBlock } from '../types/notion';

export interface DynamicBuildParams {
  topic: string;
  title: string;
  initialPrompt?: string;
  dbSchemas?: any[];
  formulas?: any[];
  valueAdd?: string[];
  complexity?: string;
}

export function buildDynamicTemplateFromPayload(params: DynamicBuildParams): NotionTemplate {
  const { topic, title, dbSchemas, formulas, valueAdd } = params;

  const templateId = `dyn-template-${Date.now()}`;
  const icon = topic.includes('합격') || topic.includes('시험') || topic.includes('자격증') ? '🎯'
    : topic.includes('독서') || topic.includes('책') ? '📚'
    : topic.includes('프로젝트') || topic.includes('개발') ? '💻'
    : topic.includes('가계부') || topic.includes('돈') || topic.includes('지출') ? '💰'
    : topic.includes('루틴') || topic.includes('스케줄') ? '📅'
    : '✨';

  const coverUrl = topic.includes('합격') || topic.includes('시험')
    ? 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80'
    : topic.includes('독서')
    ? 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80'
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';

  // 1. 다중 DB 빌드 (payload.db_schema 기반)
  const databases: NotionDatabase[] = [];

  if (Array.isArray(dbSchemas) && dbSchemas.length > 0) {
    dbSchemas.forEach((schema, idx) => {
      const props: NotionProperty[] = [];

      if (Array.isArray(schema.properties)) {
        schema.properties.forEach((p: any) => {
          if (p.name) {
            const rawType = (p.type || 'text').toLowerCase();
            const validTypes = ['title', 'date', 'status', 'formula', 'relation', 'select', 'multi_select', 'checkbox', 'number', 'url', 'text', 'person'];
            const propType = validTypes.includes(rawType) ? rawType as any : 'text';

            props.push({
              name: p.name,
              type: propType,
              expression: p.formula || p.expression,
              options: Array.isArray(p.options) ? p.options : undefined
            });
          }
        });
      }

      // 기본 이름 필수 속성이 없다면 추가
      if (!props.some(p => p.type === 'title')) {
        props.unshift({ name: '제목', type: 'title' });
      }

      databases.push({
        name: schema.db_name || `${title} 마스터 DB ${idx + 1}`,
        description: `AI가 동적으로 맞춤 구성한 ${schema.db_name || '마스터 DB'}입니다.`,
        view_type: 'table',
        properties: props,
        sample_rows: [
          { '제목': `${title} 예시 가이드 데이터 1`, '상태': '진행 중' },
          { '제목': `${title} 핵심 완료 목표 2`, '상태': '완료' }
        ]
      });
    });
  } else {
    // payload에 db_schema가 부족한 경우 기본 고품질 관계형 DB 구성
    databases.push({
      name: `🎯 ${title} 핵심 마스터 트래커`,
      description: `AI 맞춤 제작 메인 마스터 데이터베이스`,
      view_type: 'table',
      properties: [
        { name: '이름', type: 'title' },
        { name: '목표일', type: 'date' },
        { name: '진행 상태', type: 'status', options: ['대기 중', '진행 중', '완료'] },
        { name: '카테고리', type: 'select', options: ['핵심 목표', '중요 과제', '일반 메모'] },
        { name: '진행률 Formula 2.0', type: 'formula', expression: 'if(prop("진행 상태") == "완료", "100% 🟢", "50% 🟡")' },
        { name: 'AI 핵심 요약', type: 'text' }
      ],
      sample_rows: [
        { '이름': `${title} 1단계 실행 계획`, '진행 상태': '진행 중', '카테고리': '핵심 목표' },
        { '이름': `${title} 2단계 목표 검수`, '진행 상태': '대기 중', '카테고리': '중요 과제' }
      ]
    });
  }

  // 2. 가이드 블록 빌드
  const page_layout: NotionBlock[] = [
    {
      type: 'callout',
      icon: icon,
      content: `${title} AI 맞춤형 노션 템플릿에 오신 것을 환영합니다!\nNotion Architect v2.0 AI 오케스트레이터가 사용자의 요청("${params.initialPrompt || topic}")을 완벽히 분석하여 자동 인스턴스화했습니다.`,
      color: 'blue_background'
    },
    {
      type: 'heading_1',
      content: `📌 ${title} 특장점 및 차별화 스펙`
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[0]) || 'Formulas 2.0 자동 계산 수식 탑재'
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[1]) || '다중 관계형 DB 간 실시간 구조화 체계'
    },
    {
      type: 'divider'
    }
  ];

  return {
    id: templateId,
    title: title || `${topic} AI 맞춤형 템플릿`,
    icon,
    cover_query: topic,
    cover_url: coverUrl,
    description: `AI 오케스트레이터가 대화 명령을 바탕으로 최신 스키마 및 수식을 적용하여 자동 빌드한 템플릿입니다.`,
    tags: ['#AI맞춤제작', '#Formulas2.0', `#${topic.replace(/\s+/g, '')}`, '#자동생성'],
    databases,
    page_layout,
    formulas2Specs: Array.isArray(formulas) ? formulas : [
      { name: '진행률 수식', formula: 'if(prop("진행 상태")=="완료","100%","50%")', use_case: 'D-Day 및 과제 진행도 실시간 트래킹' }
    ],
    valueAddList: valueAdd || ['AI 자동 스키마 최적화', 'Formulas 2.0 고성능 수식 연동'],
    created_at: new Date().toISOString()
  };
}
