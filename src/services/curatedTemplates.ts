import type { NotionTemplate } from '../types/notion';

export interface CuratedTemplateItem {
  id: string;
  rank: number;
  badge: string;
  category: '업무/실무' | '학업/스터디' | '라이프/재무' | '프로젝트/취업';
  views: number;
  likes: number;
  recommendedPrompt: string;
  template: NotionTemplate;
}

export const SEPTEMBER_TOP_10_TEMPLATES: CuratedTemplateItem[] = [
  {
    id: 'curated-1',
    rank: 1,
    badge: '🔥 9월 마감 1위',
    category: '업무/실무',
    views: 14820,
    likes: 2150,
    recommendedPrompt: '3분기 실적 점검 템플릿에서 우리 팀 마케팅 채널별 ROI 분석 데이터베이스를 추가하고 분기 마감 D-Day 수식을 연결해줘.',
    template: {
      title: '3분기 실적 점검 & KPI 핵심 성과 대시보드',
      icon: '📊',
      cover_query: 'modern office corporate financial analytics skyline',
      cover_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80',
      description: '9월 3분기 마감 대비 팀 및 개인별 KPI 달성률(Formula 2.0 수식 바), 분기 마일스톤, 매출 현황 및 병목 점검 올인원 업무일지입니다.',
      databases: [
        {
          name: '3분기 KPI 성과 목표부',
          description: '핵심 목표, 목표치 대비 현재 달성치, Formula 2.0 유니코드 진행률 및 상태를 실시간 트래킹합니다.',
          view_type: 'table',
          properties: [
            { name: '성과 지표(KPI)', type: 'title' },
            { name: '목표치(Target)', type: 'number' },
            { name: '현재 실적(Actual)', type: 'number' },
            { 
              name: '달성률(수식)', 
              type: 'formula', 
              expression: `ifs(prop("현재 실적(Actual)") >= prop("목표치(Target)"), "■■■■■ 100% 🟢 (초과 달성)", round(prop("현재 실적(Actual)") / prop("목표치(Target)") * 100) >= 80, "■■■■□ " + round(prop("현재 실적(Actual)") / prop("목표치(Target)") * 100) + "% 🔵", round(prop("현재 실적(Actual)") / prop("목표치(Target)") * 100) >= 50, "■■■□□ " + round(prop("현재 실적(Actual)") / prop("목표치(Target)") * 100) + "% 🟡", "■□□□□ 미달 🚨")`
            },
            { name: '평가 상태', type: 'status', options: ['목표 달성', '순항 중', '주의 필요', '경고'] },
            { name: '마감 일자', type: 'date' },
            { name: '담당 팀원', type: 'text' }
          ],
          sample_rows: [
            {
              '성과 지표(KPI)': '신규 유료 구독자 수 (MRR 성장)',
              '목표치(Target)': 5000,
              '현재 실적(Actual)': 4850,
              '달성률(수식)': '■■■■□ 97% 🔵',
              '평가 상태': '순항 중',
              '마감 일자': '2026-09-30',
              '담당 팀원': '김태호 PM'
            },
            {
              '성과 지표(KPI)': 'B2B 엔터프라이즈 리드 확보 건수',
              '목표치(Target)': 120,
              '현재 실적(Actual)': 135,
              '달성률(수식)': '■■■■■ 100% 🟢 (초과 달성)',
              '평가 상태': '목표 달성',
              '마감 일자': '2026-09-25',
              '담당 팀원': '이지은 팀장'
            },
            {
              '성과 지표(KPI)': '핵심 온보딩 이탈률 개선 (Churn rate)',
              '목표치(Target)': 2.5,
              '현재 실적(Actual)': 3.1,
              '달성률(수식)': '■□□□□ 미달 🚨',
              '평가 상태': '주의 필요',
              '마감 일자': '2026-09-30',
              '담당 팀원': '박준혁 리드'
            }
          ]
        },
        {
          name: '9월 주간 마일스톤 & Action Items',
          description: '분기 마감을 완수하기 위한 주차별 핵심 실행 과제와 우선순위 칸반 보드입니다.',
          view_type: 'board',
          properties: [
            { name: '액션 태스크', type: 'title' },
            { name: '진행 단계', type: 'status', options: ['할 일', '진행 중', '리뷰 중', '완료'] },
            { name: '우선순위', type: 'select', options: ['🔥 P0 - 최우선', '⚡ P1 - 중요', '☕ P2 - 보통'] },
            { name: '마감일', type: 'date' }
          ],
          sample_rows: [
            {
              '액션 태스크': '3분기 재무 결산 및 부서별 예산 대비 지출표 확정',
              '진행 단계': '진행 중',
              '우선순위': '🔥 P0 - 최우선',
              '마감일': '2026-09-28'
            },
            {
              '액션 태스크': '4분기 사업 계획서 및 신규 프로덕트 로드맵 초안 작성',
              '진행 단계': '할 일',
              '우선순위': '⚡ P1 - 중요',
              '마감일': '2026-10-05'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '🎯',
          color: 'blue',
          content: '💡 **3분기 마무리 핵심 목표**: 9월 30일까지 모든 핵심 KPI 달성률 90% 이상 도달 및 4분기 예산안 수립 완료!'
        },
        {
          type: 'heading_2',
          content: '📈 주간 실적 점검 미팅 아젠다'
        },
        {
          type: 'bulleted_list_item',
          content: '매주 월요일 오전 10시: 전사 KPI 대시보드 지표 업데이트 및 리스크 요인 공유'
        },
        {
          type: 'bulleted_list_item',
          content: '매주 목요일: 분기 목표 미달 항목 집중 부스팅 대책 수립'
        }
      ]
    }
  },
  {
    id: 'curated-2',
    rank: 2,
    badge: '🎓 2학기 개강 1위',
    category: '학업/스터디',
    views: 12450,
    likes: 1890,
    recommendedPrompt: '2학기 과제 시험 트래커 템플릿에서 학점 계산기 데이터베이스와 시험 D-Day 뱃지 수식을 더 강화해줘.',
    template: {
      title: '2026 2학기 학기별 과제 & 시험 올인원 트래커',
      icon: '🎓',
      cover_query: 'aesthetic university college library study desk',
      cover_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      description: '9월 개강 시즌 필수! 강의 시간표, 주차별 과제 제출 마감 D-Day, 중간고사 시험 일정 및 성적 관리 템플릿입니다.',
      databases: [
        {
          name: '과제 및 시험 D-Day 일정부',
          description: '과제 제출 기한과 중간고사 D-Day 카운트다운을 자동 계산합니다.',
          view_type: 'table',
          properties: [
            { name: '과제/시험명', type: 'title' },
            { name: '마감일', type: 'date' },
            { name: '상태', type: 'status', options: ['시작 전', '진행 중', '제출 완료'] },
            { 
              name: 'D-Day(수식)', 
              type: 'formula', 
              expression: `ifs(empty(prop("마감일")), "⚪ 미정", dateBetween(dateStart(prop("마감일")), now(), "days") < 0, "⚠️ 기한 초과", dateBetween(dateStart(prop("마감일")), now(), "days") == 0, "🔥 오늘 마감!", "⏳ D-" + dateBetween(dateStart(prop("마감일")), now(), "days"))` 
            },
            { name: '과목 구분', type: 'select', options: ['전공필수', '전공선택', '교양'] }
          ],
          sample_rows: [
            {
              '과제/시험명': '데이터통신 중간고사',
              '마감일': '2026-10-21',
              '상태': '진행 중',
              'D-Day(수식)': '⏳ D-34',
              '과목 구분': '전공필수'
            },
            {
              '과제/시험명': '인공지능 개론 3주차 실습 과제',
              '마감일': '2026-09-24',
              '상태': '제출 완료',
              'D-Day(수식)': '제출 완료',
              '과목 구분': '전공선택'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '🏆',
          color: 'green',
          content: '🎯 **2학기 목표 학점 4.3 달성**: 예습/복습 루틴을 지키고 모든 과제는 마감 1일 전 제출하기!'
        }
      ]
    }
  },
  {
    id: 'curated-3',
    rank: 3,
    badge: '🚀 스타트업 애자일',
    category: '프로젝트/취업',
    views: 11200,
    likes: 1640,
    recommendedPrompt: '애자일 스프린트 템플릿에 데일리 스크럼 기록 토글과 스프린트 회고(Retrospective) 템플릿 블록을 추가해줘.',
    template: {
      title: '9월 애자일 프로젝트 스프린트 & 제품 백로그',
      icon: '🚀',
      cover_query: 'modern tech startup agile scrum board',
      cover_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1600&q=80',
      description: '2주 단위 스프린트 업무, 제품 기능 백로그 칸반, 담당자 릴레이션 및 버그 트래킹 협업 대시보드입니다.',
      databases: [
        {
          name: '스프린트 태스크 칸반',
          view_type: 'board',
          properties: [
            { name: '태스크명', type: 'title' },
            { name: '상태', type: 'status', options: ['Backlog', 'In Progress', 'Code Review', 'Done'] },
            { name: '우선순위', type: 'select', options: ['P0 - 긴급', 'P1 - 높음', 'P2 - 보통'] },
            { name: '스프린트 주기', type: 'select', options: ['Sprint 18 (9월 2차)', 'Sprint 19 (10월 1차)'] },
            { name: '종료일', type: 'date' }
          ],
          sample_rows: [
            {
              '태스크명': '구글 OAuth 간편 로그인 연동 모듈',
              '상태': 'Code Review',
              '우선순위': 'P0 - 긴급',
              '스프린트 주기': 'Sprint 18 (9월 2차)',
              '종료일': '2026-09-22'
            },
            {
              '태스크명': '모바일 반응형 하단 네비게이션 개편',
              '상태': 'Done',
              '우선순위': 'P1 - 높음',
              '스프린트 주기': 'Sprint 18 (9월 2차)',
              '종료일': '2026-09-17'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '⚡',
          content: '🔥 **Sprint 18 핵심 목표**: 온보딩 이탈률 20% 감소 및 핵심 결제 API V2 배포 완료'
        }
      ]
    }
  },
  {
    id: 'curated-4',
    rank: 4,
    badge: '💳 재무/가계부 인기',
    category: '라이프/재무',
    views: 10890,
    likes: 1520,
    recommendedPrompt: '스마트 가계부 템플릿에 월별 저축 목표 달성률 게이지와 고정 지출 자동 계산 속성을 넣어줘.',
    template: {
      title: '스마트 가계부 & 하반기 자산 포트폴리오',
      icon: '💳',
      cover_query: 'minimalist finance budget ledger spreadsheet coins',
      cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
      description: '월별 지출 카테고리 분석, 저축 목표 달성률, 고정 지출 납부일 캘린더 연동 스마트 가계부입니다.',
      databases: [
        {
          name: '지출 및 수입 내역부',
          view_type: 'table',
          properties: [
            { name: '항목명', type: 'title' },
            { name: '결제일', type: 'date' },
            { name: '금액', type: 'number' },
            { name: '구분', type: 'select', options: ['수입', '고정지출', '변동지출', '저축/투자'] },
            { name: '카테고리', type: 'select', options: ['식비', '주거/통신', '교통', '문화/취미', '쇼핑'] }
          ],
          sample_rows: [
            {
              '항목명': '9월 급여 입금',
              '결제일': '2026-09-25',
              '금액': 3800000,
              '구분': '수입',
              '카테고리': '주거/통신'
            },
            {
              '항목명': '팀 점심 회식 식비',
              '결제일': '2026-09-17',
              '금액': 15000,
              '구분': '변동지출',
              '카테고리': '식비'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '💡',
          content: '💰 **이번 달 저축 목표**: 월 120만원 비상금 및 ISA 계좌 자동이체 완료하기'
        }
      ]
    }
  },
  {
    id: 'curated-5',
    rank: 5,
    badge: '💼 하반기 공채 필수',
    category: '프로젝트/취업',
    views: 9940,
    likes: 1410,
    recommendedPrompt: '하반기 공채 지원 트래커에 서류 합격률 통계 롤업과 면접 예상 질문 복기 토글을 추가해줘.',
    template: {
      title: '2026 하반기 채용 & 이력서 서류 지원 트래커',
      icon: '💼',
      cover_query: 'resume job application business interview corporate',
      cover_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      description: '9월~10월 하반기 대기업/스타트업 채용 지원 마감일 D-Day, 전형 단계, 포트폴리오 관리 대시보드입니다.',
      databases: [
        {
          name: '채용 지원 현황부',
          view_type: 'board',
          properties: [
            { name: '기업명 및 직무', type: 'title' },
            { name: '전형 단계', type: 'status', options: ['서류 작성', '서류 제출', '코딩테스트/과제', '1차 면접', '최종 합격'] },
            { name: '서류 마감일', type: 'date' },
            { name: '지원 직군', type: 'select', options: ['프론트엔드', '풀스택', '프로덕트 매니저(PM)', '데이터 분석'] }
          ],
          sample_rows: [
            {
              '기업명 및 직무': '네이버웹툰 - 서비스 개발자',
              '전형 단계': '서류 제출',
              '서류 마감일': '2026-09-22',
              '지원 직군': '풀스택'
            },
            {
              '기업명 및 직무': '토스(비바리퍼블리카) - 프론트엔드 플랫폼',
              '전형 단계': '코딩테스트/과제',
              '서류 마감일': '2026-09-29',
              '지원 직군': '프론트엔드'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '🎯',
          content: '🚀 **취업 성공 전략**: 지원 기업별 인재상 키워드를 자기소개서 문항마다 2개 이상 매핑하기'
        }
      ]
    }
  },
  {
    id: 'curated-6',
    rank: 6,
    badge: '🌱 라이프 습관 1위',
    category: '라이프/재무',
    views: 9350,
    likes: 1320,
    recommendedPrompt: '스마트 습관 트래커에 주간 스트릭 연속 성공일수 수식과 나이트 루틴 체크리스트를 넣어줘.',
    template: {
      title: '스마트 습관 트래커 & 모닝 루틴 스트릭',
      icon: '🌱',
      cover_query: 'morning sunlight coffee journal habit plant',
      cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
      description: '주간 달성률 시각화, 모닝/나이트 루틴 체크리스트, 스트릭(Streak) 연속 성공 기록부입니다.',
      databases: [
        {
          name: '데일리 습관 체크리스트',
          view_type: 'table',
          properties: [
            { name: '일자', type: 'title' },
            { name: '기상 후 물 한 잔', type: 'checkbox' },
            { name: '모닝 스트레칭 15분', type: 'checkbox' },
            { name: '개발/기술 블로그 1편 읽기', type: 'checkbox' },
            { name: '저녁 독서 30분', type: 'checkbox' },
            { 
              name: '오늘 달성률(수식)', 
              type: 'formula', 
              expression: `ifs((toNumber(prop("기상 후 물 한 잔")) + toNumber(prop("모닝 스트레칭 15분")) + toNumber(prop("개발/기술 블로그 1편 읽기")) + toNumber(prop("저녁 독서 30분"))) == 4, "■■■■ 100% 🟢 올클리어!", (toNumber(prop("기상 후 물 한 잔")) + toNumber(prop("모닝 스트레칭 15분")) + toNumber(prop("개발/기술 블로그 1편 읽기")) + toNumber(prop("저녁 독서 30분"))) >= 2, "■■□□ 50% 🟡 절반 달성", "□□□□ 시작하기 ⚪")`
            }
          ],
          sample_rows: [
            {
              '일자': '2026-09-17 (목)',
              '기상 후 물 한 잔': true,
              '모닝 스트레칭 15분': true,
              '개발/기술 블로그 1편 읽기': true,
              '저녁 독서 30분': true,
              '오늘 달성률(수식)': '■■■■ 100% 🟢 올클리어!'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '✨',
          content: '💡 "작은 습관의 반복이 결국 비범한 결과를 만듭니다."'
        }
      ]
    }
  },
  {
    id: 'curated-7',
    rank: 7,
    badge: '🔄 팀 회고 베스트',
    category: '업무/실무',
    views: 8640,
    likes: 1190,
    recommendedPrompt: '주간 스프린트 회고 템플릿에 팀원 투표 기능과 다음 주 시도할 핵심 액션 아이템 섹션을 만들어줘.',
    template: {
      title: '주간 스프린트 회고 (KPT) & 액션 아이템',
      icon: '🔄',
      cover_query: 'minimalist team retro whiteboard meeting sticky notes',
      cover_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
      description: 'Keep(유지할 점), Problem(문제점), Try(새로 시도할 점) 3단 구조의 팀 및 개인 주간 회고 템플릿입니다.',
      databases: [
        {
          name: 'KPT 회고 피드백 카드',
          view_type: 'board',
          properties: [
            { name: '회고 항목', type: 'title' },
            { name: '구분', type: 'select', options: ['🟢 Keep (유지)', '🔴 Problem (문제)', '⚡ Try (시도)'] },
            { name: '작성 주차', type: 'select', options: ['9월 3주차', '9월 4주차'] },
            { name: '우선순위', type: 'select', options: ['High', 'Medium', 'Low'] }
          ],
          sample_rows: [
            {
              '회고 항목': '매일 아침 10분 스탠드업으로 일정 병목을 빠르게 해결함',
              '구분': '🟢 Keep (유지)',
              '작성 주차': '9월 3주차',
              '우선순위': 'High'
            },
            {
              '회고 항목': 'API 스펙 변경 사항이 문서에 실시간 반영되지 않아 재작업 발생',
              '구분': '🔴 Problem (문제)',
              '작성 주차': '9월 3주차',
              '우선순위': 'High'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '💡',
          content: '🎯 한 주 동안 배운 점을 솔직하게 기록하고 다음 주에는 1% 더 성장합시다.'
        }
      ]
    }
  },
  {
    id: 'curated-8',
    rank: 8,
    badge: '💼 프리랜서 추천',
    category: '업무/실무',
    views: 7920,
    likes: 1040,
    recommendedPrompt: '프리랜서 외주 프로젝트 템플릿에 계약서 파일 첨부 속성과 미수금 알림 계산식을 추가해줘.',
    template: {
      title: '프리랜서 외주 프로젝트 & 인보이스 정산 관리',
      icon: '💼',
      cover_query: 'freelancer macbook modern minimalist coffee desk invoice',
      cover_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1600&q=80',
      description: '클라이언트별 계약금/잔금 지급 일정, 세금계산서 발행 여부, 마감 기한 트래킹 올인원 시트입니다.',
      databases: [
        {
          name: '외주 프로젝트 계약 관리부',
          view_type: 'table',
          properties: [
            { name: '프로젝트명', type: 'title' },
            { name: '고객사(Client)', type: 'text' },
            { name: '계약 금액', type: 'number' },
            { name: '정산 상태', type: 'select', options: ['입금 완료', '잔금 대기', '인보이스 발행', '계약 진행 중'] },
            { name: '마감일', type: 'date' }
          ],
          sample_rows: [
            {
              '프로젝트명': '핀테크 모바일 앱 UI/UX 디자인 리뉴얼',
              '고객사(Client)': '(주)알파파이낸스',
              '계약 금액': 4500000,
              '정산 상태': '입금 완료',
              '마감일': '2026-09-15'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '💵',
          content: '💡 세금계산서는 매월 10일 이전 일괄 발행 완료 및 원천징수영수증 챙기기!'
        }
      ]
    }
  },
  {
    id: 'curated-9',
    rank: 9,
    badge: '📚 가을 독서 시즌',
    category: '라이프/재무',
    views: 7410,
    likes: 980,
    recommendedPrompt: '가을 독서 서재 템플릿에 월간 독서 목표 게이지와 감명 깊은 문장 갤러리 뷰를 넣어줘.',
    template: {
      title: '2026 가을 독서 기록 & 인사이트 인생 서재',
      icon: '📚',
      cover_query: 'autumn fall books library warm aesthetic coffee leaves',
      cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be837a27?auto=format&fit=crop&w=1600&q=80',
      description: '독서 상태(읽고 싶은 책/완독), 별점 평점, 가슴을 울린 문장 인용 콜아웃 기록 서재입니다.',
      databases: [
        {
          name: '도서 기록 아카이브',
          view_type: 'board',
          properties: [
            { name: '도서명', type: 'title' },
            { name: '저자', type: 'text' },
            { name: '독서 상태', type: 'status', options: ['읽고 싶은 책', '읽는 중', '완독', '보류'] },
            { name: '별점(평점)', type: 'select', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐'] },
            { name: '완독일', type: 'date' }
          ],
          sample_rows: [
            {
              '도서명': '도둑맞은 집중력 (요한 하리)',
              '저자': '요한 하리',
              '독서 상태': '완독',
              '별점(평점)': '⭐⭐⭐⭐⭐',
              '완독일': '2026-09-12'
            },
            {
              '도서명': '원씽 (The ONE Thing)',
              '저자': '게리 켈러',
              '독서 상태': '읽는 중',
              '별점(평점)': '⭐⭐⭐⭐⭐',
              '완독일': '2026-09-20'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '📖',
          content: '💡 "단 한 줄의 문장이라도 내 삶의 행동을 바꾼다면 그 책은 인생 책이다."'
        }
      ]
    }
  },
  {
    id: 'curated-10',
    rank: 10,
    badge: '🏋️ 피트니스/건강',
    category: '라이프/재무',
    views: 6850,
    likes: 890,
    recommendedPrompt: '피트니스 운동 루틴 템플릿에 부위별 3분할 루틴과 체중 변화 그래프 수식을 연결해줘.',
    template: {
      title: '건강 관리 & 피트니스 운동 루틴 대시보드',
      icon: '🏋️',
      cover_query: 'fitness gym workout weights healthy lifestyle aesthetic',
      cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
      description: '부위별 분할 운동(상체/하체/유산소), 중량 및 세트 수 기록, 수분 섭취 트래커입니다.',
      databases: [
        {
          name: '운동 일지 & 루틴 기록부',
          view_type: 'table',
          properties: [
            { name: '운동 항목', type: 'title' },
            { name: '운동 부위', type: 'select', options: ['가슴/어깨', '등/이두', '하체', '유산소/코어'] },
            { name: '수행 중량(kg)', type: 'number' },
            { name: '세트 수', type: 'number' },
            { name: '날짜', type: 'date' }
          ],
          sample_rows: [
            {
              '운동 항목': '바벨 스쿼트 5세트',
              '운동 부위': '하체',
              '수행 중량(kg)': 90,
              '세트 수': 5,
              '날짜': '2026-09-17'
            }
          ]
        }
      ],
      page_layout: [
        {
          type: 'callout',
          icon: '💧',
          content: '🏃‍♂️ 하루 물 2리터 섭취 및 단백질 100g 챙기기!'
        }
      ]
    }
  }
];
