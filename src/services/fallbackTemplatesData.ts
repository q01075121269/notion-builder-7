// src/services/fallbackTemplatesData.ts
// AI API 할당량 초과 시 사용되는 도메인별 고품질 노션 템플릿 데이터

import type { NotionTemplate } from '../types/notion';

export const DEVLAB_TEMPLATE: NotionTemplate = {
  title: '💻 2026 개발 랩 & 시스템 아키텍처 마스터 (DevLab Master)',
  icon: '💻',
  cover_query: 'dark high-tech software engineering workspace code terminal',
  cover_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80',
  description: '본 웹프로그램의 [개발 랩] 규격과 100% 호환되는 AI 프롬프트 실험실, 트러블슈팅 일지, 기능 개발 백로그 올인원 템플릿입니다.',
  databases: [
    {
      name: '🔬 개발 랩 (AI 프롬프트·테스트·코드 스니펫)',
      description: 'Gemini AI 프롬프트 연구, 테스트 시나리오, 핵심 알고리즘 및 코드 스니펫을 실시간 검증합니다.',
      view_type: 'table',
      properties: [
        { name: '실험 항목', type: 'title' },
        { name: '타겟 엔진', type: 'select', options: ['Gemini 3.6 Flash', 'Gemini 2.5 Flash', 'Claude 3.5 Sonnet', 'GPT-4o'] },
        { name: '실험 상태', type: 'status', options: ['아이디어', '실험 진행 중', '검증 완료', '보류'] },
        { 
          name: '진행률(수식)', 
          type: 'formula', 
          expression: `ifs(prop("실험 상태") == "검증 완료", "■■■■■ 100% 🟢", prop("실험 상태") == "실험 진행 중", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")` 
        },
        { name: '기술 태그', type: 'multi_select', options: ['Prompt', 'Notion API', 'Frontend', 'Backend', 'SQLite'] },
        { name: '실험일', type: 'date' },
        { name: '코드 및 메모', type: 'text' }
      ],
      sample_rows: [
        {
          '실험 항목': 'Gemini 3.6 Flash 기반 멀티모달 아키텍처 다이어그램 자동 생성',
          '타겟 엔진': 'Gemini 3.6 Flash',
          '실험 상태': '검증 완료',
          '진행률(수식)': '■■■■■ 100% 🟢',
          '기술 태그': ['Prompt', 'Frontend'],
          '실험일': '2026-09-18',
          '코드 및 메모': 'Mermaid JS 코드 블록을 추출하여 실시간 브라우저 렌더링 성공'
        },
        {
          '실험 항목': '로컬 SQLite 캐시와 노션 원격 DB 양방향 오프라인 동기화',
          '타겟 엔진': 'Gemini 2.5 Flash',
          '실험 상태': '실험 진행 중',
          '진행률(수식)': '■■■□□ 60% 🟡',
          '기술 태그': ['Backend', 'SQLite', 'Notion API'],
          '실험일': '2026-09-17',
          '코드 및 메모': '오프라인 1초 퀵 캡처 큐 보존 후 네트워크 복구 시 자동 푸시'
        },
        {
          '실험 항목': '1초 퀵 캡처 인텐트 라우터 프롬프트 가드레일',
          '타겟 엔진': 'Gemini 3.6 Flash',
          '실험 상태': '아이디어',
          '진행률(수식)': '□□□□□ 0% ⚪',
          '기술 태그': ['Prompt'],
          '실험일': '2026-09-20',
          '코드 및 메모': '일정/할일/지출/아이디어 4대 자동 분류 정확도 99% 달성 목표'
        }
      ]
    },
    {
      name: '🐞 트러블슈팅 & 버그 일지 (Troubleshooting & Debug)',
      description: '발생한 시스템 오류, 원인 분석, 해결 솔루션 및 재발 방지 대책을 체계적으로 축적합니다.',
      view_type: 'board',
      properties: [
        { name: '오류 및 이슈명', type: 'title' },
        { name: '심각도', type: 'select', options: ['P0 - 치명적', 'P1 - 높음', 'P2 - 보통', 'P3 - 낮음'] },
        { name: '해결 상태', type: 'status', options: ['원인 분석 중', '패치 적용 중', '해결 완료'] },
        { name: '발생일', type: 'date' },
        { name: '원인 분석', type: 'text' },
        { name: '해결 솔루션', type: 'text' }
      ],
      sample_rows: [
        {
          '오류 및 이슈명': 'Gemini API 429 Quota Exceeded 방어 로컬 지능형 엔진 구축',
          '심각도': 'P1 - 높음',
          '해결 상태': '해결 완료',
          '발생일': '2026-09-18',
          '원인 분석': '무료 API 분당 요청 한도 도달 시 단일 고정 템플릿만 무한 반복 생성되는 현상',
          '해결 솔루션': '프롬프트 인텐트 기반 다중 도메인 로컬 스마트 생성 엔진으로 완벽 분기'
        },
        {
          '오류 및 이슈명': 'Notion Formula 2.0 유니코드 진행률 바 렌더링 최적화',
          '심각도': 'P2 - 보통',
          '해결 상태': '해결 완료',
          '발생일': '2026-09-15',
          '원인 분석': 'Notion API 스키마 생성 시 ifs 수식 검증 규격 차이',
          '해결 솔루션': '문자열 결합 및 if 중첩 표준 구문으로 일원화'
        }
      ]
    },
    {
      name: '🚀 기능 개발 백로그 & 스프린트 (Sprint Backlog)',
      description: '2주 단위 애자일 스프린트와 로드맵 마일스톤을 실시간 추적합니다.',
      view_type: 'table',
      properties: [
        { name: '태스크명', type: 'title' },
        { name: '스프린트', type: 'select', options: ['Sprint 14', 'Sprint 15', 'Sprint 16', 'Backlog'] },
        { name: '마감일', type: 'date' },
        { 
          name: 'D-Day', 
          type: 'formula', 
          expression: `ifs(empty(prop("마감일")), "미정", dateBetween(dateStart(prop("마감일")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("마감일")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("마감일")), now(), "days") + "일")` 
        },
        { name: '담당자', type: 'text' }
      ],
      sample_rows: [
        {
          '태스크명': '개발 랩 실시간 노션 원클릭 배포 연동',
          '스프린트': 'Sprint 14',
          '마감일': '2026-09-22',
          'D-Day': 'D-4일',
          '담당자': '시스템 아키텍트'
        },
        {
          '태스크명': '다크모드 및 모바일 UI 제스처 최적화',
          '스프린트': 'Sprint 14',
          '마감일': '2026-09-25',
          'D-Day': 'D-7일',
          '담당자': '프론트엔드 리드'
        }
      ]
    }
  ],
  page_layout: [
    {
      type: 'callout',
      icon: '💻',
      color: 'blue',
      content: '💻 **개발 랩 마스터 가이드**: AI 프롬프트 연구, 트러블슈팅 일지, 스프린트 백로그가 유기적으로 연동되어 개발 생산성을 극대화합니다.'
    },
    {
      type: 'column_list',
      columns: [
        {
          width: 50,
          blocks: [
            { type: 'heading_2', content: '⚡ 이번 주 핵심 개발 스프린트' },
            { type: 'bulleted_list_item', content: '개발 랩 3대 데이터베이스 스키마 안정화' },
            { type: 'bulleted_list_item', content: '오프라인 PWA 및 동기화 루프 검증' }
          ]
        },
        {
          width: 50,
          blocks: [
            { type: 'heading_2', content: '🔗 개발 랩 퀵 링크' },
            { type: 'bulleted_list_item', content: 'GitHub 리포지토리 및 PR 목록' },
            { type: 'bulleted_list_item', content: 'Google Cloud Console & API 상태' }
          ]
        }
      ]
    },
    {
      type: 'toggle',
      title: '📚 개발 랩 시스템 아키텍처 및 연동 규격',
      content: '핵심 파이프라인 및 모듈 상세 명세',
      blocks: [
        { type: 'paragraph', content: '• 프론트엔드: React / Next.js 구조 기반의 모듈러 컴포넌트' },
        { type: 'paragraph', content: '• AI 오케스트레이션: Gemini 멀티 모델 Fallback 및 인텐트 라우터' },
        { type: 'paragraph', content: '• 노션 연동: Notion REST API v2022-06-28 데이터베이스 양방향 푸시' }
      ]
    }
  ]
};

export const LIFE_HUB_TEMPLATE: NotionTemplate = {
  title: '👑 2026 라이프 허브 올인원 시스템 (Life Hub Master)',
  icon: '👑',
  cover_query: 'minimalist organized workspace schedule',
  cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be8860ee?auto=format&fit=crop&w=1600&q=80',
  description: '모바일 1초 퀵 캡처와 완벽 연동되는 일정·할일·가계부 3대 통합 라이프 허브 대시보드입니다.',
  databases: [
    {
      name: '📅 라이프 허브 (일정·할일·메모)',
      view_type: 'calendar',
      properties: [
        { name: '이름', type: 'title' },
        { name: '일정', type: 'date' },
        { name: '상태', type: 'status', options: ['미완료', '진행 중', '완료'] },
        { name: '분류', type: 'select', options: ['일정', '할 일', '지출', '아이디어', '메모'] },
        { name: 'AI 메모', type: 'text' }
      ]
    },
    {
      name: '💰 가계부 (지출·소비 내역)',
      view_type: 'table',
      properties: [
        { name: '상호명', type: 'title' },
        { name: '금액', type: 'number' },
        { name: '결제일', type: 'date' },
        { name: '분류', type: 'select', options: ['식비', '교통', '쇼핑', '주거', '여가', '기타'] },
        { name: 'AI 메모', type: 'text' }
      ]
    }
  ],
  page_layout: [
    { type: 'callout', content: '👑 **라이프 허브 마스터 안내**: 퀵 캡처 허브에서 음성이나 사진을 올리면 이 화면의 [일정표]와 [가계부]로 1초 만에 자동 분기 저장됩니다.', icon: '👑' },
    { type: 'heading_2', content: '📅 오늘 하루 핵심 일정 & 우선순위' },
    { type: 'bulleted_list_item', content: '모바일 1초 퀵 캡처 연동 확인' },
    { type: 'bulleted_list_item', content: '오늘 지출 내역 및 가계부 확인' }
  ]
};

export function createDynamicTemplate(keyword: string): NotionTemplate {
  const cleanKeyword = keyword.trim() || '맞춤형 프로젝트';
  return {
    title: `✨ 2026 ${cleanKeyword} 스마트 대시보드`,
    icon: '✨',
    cover_query: `${cleanKeyword} modern workspace planning`,
    cover_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80',
    description: `요청하신 [${cleanKeyword}] 목적에 맞춤 설계된 고성능 노션 대시보드 템플릿입니다.`,
    databases: [
      {
        name: `📋 ${cleanKeyword} 핵심 태스크 & 목표 트래커`,
        description: `${cleanKeyword}의 주요 작업과 진행 상태, D-Day를 체계적으로 관리합니다.`,
        view_type: 'table',
        properties: [
          { name: '항목명', type: 'title' },
          { name: '목표 일정', type: 'date' },
          { name: '진행 상태', type: 'status', options: ['준비 중', '진행 중', '완료'] },
          { 
            name: '진행률(수식)', 
            type: 'formula', 
            expression: `ifs(prop("진행 상태") == "완료", "■■■■■ 100% 🟢", prop("진행 상태") == "진행 중", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")` 
          },
          { 
            name: 'D-Day', 
            type: 'formula', 
            expression: `ifs(empty(prop("목표 일정")), "미정", dateBetween(dateStart(prop("목표 일정")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("목표 일정")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("목표 일정")), now(), "days") + "일")` 
          },
          { name: '우선순위', type: 'select', options: ['🔥 높음', '⭐ 보통', '☕ 여유'] }
        ],
        sample_rows: [
          {
            '항목명': `${cleanKeyword} 1단계 핵심 계획 수립`,
            '목표 일정': '2026-09-25',
            '진행 상태': '진행 중',
            '진행률(수식)': '■■■□□ 60% 🟡',
            'D-Day': 'D-7일',
            '우선순위': '🔥 높음'
          }
        ]
      },
      {
        name: `💡 ${cleanKeyword} 리서치 & 아이디어 노트`,
        description: `${cleanKeyword} 관련 핵심 참고자료와 인사이트를 기록합니다.`,
        view_type: 'board',
        properties: [
          { name: '아이디어/자료명', type: 'title' },
          { name: '카테고리', type: 'select', options: ['인사이트', '벤치마킹', '회의록', '기타'] },
          { name: '기록일', type: 'date' },
          { name: '핵심 메모', type: 'text' }
        ],
        sample_rows: [
          {
            '아이디어/자료명': `${cleanKeyword} 베스트 프랙티스 분석`,
            '카테고리': '벤치마킹',
            '기록일': '2026-09-18',
            '핵심 메모': '성공적인 실행을 위한 레퍼런스 사례 수집'
          }
        ]
      }
    ],
    page_layout: [
      {
        type: 'callout',
        icon: '✨',
        color: 'emerald',
        content: `✨ **${cleanKeyword} 마스터 대시보드**: 목표 달성을 위한 핵심 태스크 트래커와 아이디어 노트가 통합 구성되어 있습니다.`
      },
      {
        type: 'heading_2',
        content: `📌 ${cleanKeyword} 이번 주 핵심 액션 플랜`
      },
      {
        type: 'bulleted_list_item',
        content: '목표 달성을 위한 최우선 태스크 점검'
      },
      {
        type: 'bulleted_list_item',
        content: '필요 리소스 확보 및 실행 일정 조율'
      }
    ]
  };
}
