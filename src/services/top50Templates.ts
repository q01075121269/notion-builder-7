import type { NotionTemplate } from '../types/notion';

export interface Top50TemplateItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  category: '업무/프로젝트' | '가계부/재테크' | '루틴/자기계발' | '학업/스터디';
  tag: string;
  icon: string;
  cover_url: string;
  badge: string;
  views: number;
  likes: number;
  templateData: NotionTemplate;
}

// 2026년 9월 시즌 직장인 및 라이프 인기 템플릿 50종 데이터셋
export const TOP_50_SHOWCASE_TEMPLATES: Top50TemplateItem[] = [
  // 1 ~ 10위 (핵심 인기)
  {
    id: 'top-1',
    rank: 1,
    title: '3분기 실적 결산 & 전사 KPI 성과 대시보드',
    description: 'Formula 2.0 달성률 프로그레스 바와 분기 마감 D-Day 수식이 연동된 실무 핵심 업무일지',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '📊',
    cover_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 9월 마감 1위',
    views: 18400,
    likes: 2450,
    templateData: {
      title: '3분기 실적 결산 & 전사 KPI 성과 대시보드',
      icon: '📊',
      cover_query: 'corporate financial analytics',
      cover_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80',
      description: '팀 및 개인별 KPI 달성률, 주간 마일스톤, 매출 현황 및 병목 점검 올인원 업무일지',
      page_layout: [],
      databases: [
        {
          name: '3분기 KPI 성과 목표부',
          view_type: 'table',
          properties: [
            { name: '성과 지표(KPI)', type: 'title' },
            { name: '목표치(Target)', type: 'number' },
            { name: '현재 실적(Actual)', type: 'number' },
            { name: '달성률(수식)', type: 'formula', expression: 'round(prop("현재 실적(Actual)") / prop("목표치(Target)") * 100) + "%"' },
            { name: '평가 상태', type: 'status', options: ['목표 달성', '순항 중', '주의 필요', '경고'] },
            { name: '마감 일자', type: 'date' }
          ]
        }
      ]
    }
  },
  {
    id: 'top-2',
    rank: 2,
    title: '2026 2학기 학기별 과제 & 시험 올인원 트래커',
    description: '9월 개강 시즌 맞춤 강의 시간표, 주차별 과제 마감 카운트다운 및 학점 계산기',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '🎓',
    cover_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    badge: '🎓 개강 1위',
    views: 16200,
    likes: 2190,
    templateData: {
      title: '2026 2학기 학기별 과제 & 시험 올인원 트래커',
      icon: '🎓',
      cover_query: 'study library desk',
      cover_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      description: '강의 시간표와 중간/기말고사 시험 일정 및 성적 관리',
      page_layout: [],
      databases: [
        {
          name: '과제 및 시험 일정부',
          view_type: 'table',
          properties: [
            { name: '과제/시험명', type: 'title' },
            { name: '마감일', type: 'date' },
            { name: '상태', type: 'status', options: ['시작 전', '진행 중', '제출 완료'] },
            { name: '과목 구분', type: 'select', options: ['전공필수', '전공선택', '교양'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-3',
    rank: 3,
    title: '9월 애자일 프로젝트 스프린트 & 제품 백로그',
    description: '2주 단위 스프린트 업무, 제품 기능 백로그 칸반, 담당자 및 버그 트래킹 보드',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🚀',
    cover_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    badge: '⚡ 스프린트 필수',
    views: 15300,
    likes: 1980,
    templateData: {
      title: '9월 애자일 프로젝트 스프린트 & 제품 백로그',
      icon: '🚀',
      cover_query: 'tech scrum board agile',
      cover_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1600&q=80',
      description: '스타트업 애자일 개발 및 기획 협업 대시보드',
      page_layout: [],
      databases: [
        {
          name: '스프린트 태스크 칸반',
          view_type: 'board',
          properties: [
            { name: '작업명', type: 'title' },
            { name: '단계', type: 'status', options: ['Backlog', 'In Progress', 'Review', 'Done'] },
            { name: '우선순위', type: 'select', options: ['P0', 'P1', 'P2'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-4',
    rank: 4,
    title: '하반기 스마트 가계부 & 자산 포트폴리오 관리',
    description: '월별 지출 카테고리 분석, 저축 목표 달성률 및 고정 지출 납부일 캘린더',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '💳',
    cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    badge: '💰 재테크 1위',
    views: 14100,
    likes: 1850,
    templateData: {
      title: '하반기 스마트 가계부 & 자산 포트폴리오 관리',
      icon: '💳',
      cover_query: 'finance money budgeting',
      cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
      description: '수입, 지출, 예산 및 저축 관리 시스템',
      page_layout: [],
      databases: [
        {
          name: '수입 및 지출 장부',
          view_type: 'table',
          properties: [
            { name: '거래 항목', type: 'title' },
            { name: '구분', type: 'select', options: ['지출', '수입', '저축'] },
            { name: '금액', type: 'number' },
            { name: '결제 수단', type: 'select', options: ['신용카드', '체크카드', '현금'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-5',
    rank: 5,
    title: '2026 하반기 공채 & 이직 서류/면접 지원 파이프라인',
    description: '기업별 서류 마감일, 직무 분석, 포트폴리오 링크 및 면접 기출 질문 아카이브',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '💼',
    cover_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    badge: '💼 하반기 공채',
    views: 13500,
    likes: 1720,
    templateData: {
      title: '2026 하반기 공채 & 이직 서류/면접 지원 파이프라인',
      icon: '💼',
      cover_query: 'career job interview office',
      cover_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      description: '하반기 대기업/스타트업 채용 지원 트래커',
      page_layout: [],
      databases: [
        {
          name: '지원 현황 파이프라인',
          view_type: 'board',
          properties: [
            { name: '기업명 및 직무', type: 'title' },
            { name: '전형 단계', type: 'status', options: ['서류 작성', '서류 제출', '1차 면접', '최종 면접', '합격'] },
            { name: '마감일', type: 'date' }
          ]
        }
      ]
    }
  },
  {
    id: 'top-6',
    rank: 6,
    title: '9월 갓생 모닝 루틴 & 66일 습관 형성 트래커',
    description: '기상 미라클모닝, 스트릭(Streak) 연속 성공 기록부 및 주간 달성률 게이지',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🌱',
    cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    badge: '🌱 갓생 1위',
    views: 12800,
    likes: 1640,
    templateData: {
      title: '9월 갓생 모닝 루틴 & 66일 습관 형성 트래커',
      icon: '🌱',
      cover_query: 'morning routine habit notebook',
      cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
      description: '매일 아침 루틴과 습관 형성 체크리스트',
      page_layout: [],
      databases: [
        {
          name: '일일 습관 기록부',
          view_type: 'table',
          properties: [
            { name: '날짜', type: 'title' },
            { name: '기상 시간', type: 'text' },
            { name: '모닝 독서 30분', type: 'checkbox' },
            { name: '스트레칭', type: 'checkbox' }
          ]
        }
      ]
    }
  },
  {
    id: 'top-7',
    rank: 7,
    title: '3분기 회고 (KPT) & 4분기 전사/개인 OKR 수립',
    description: 'Keep / Problem / Try 프레임워크와 4분기 핵심 목표 Objective-Key Results',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🎯',
    cover_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    badge: '🎯 분기 회고',
    views: 11900,
    likes: 1510,
    templateData: {
      title: '3분기 회고 (KPT) & 4분기 전사/개인 OKR 수립',
      icon: '🎯',
      cover_query: 'team meeting strategy okr',
      cover_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
      description: '회고 및 차기 분기 로드맵 기획 템플릿',
      page_layout: [],
      databases: [
        {
          name: '4분기 OKR 핵심 목표부',
          view_type: 'table',
          properties: [
            { name: '핵심 목표 (Objective)', type: 'title' },
            { name: '핵심 결과 지표 (Key Result)', type: 'text' },
            { name: '진행 상태', type: 'status', options: ['기획 중', '진행 중', '완료'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-8',
    rank: 8,
    title: '프리랜서 & 외주 프로젝트 인보이스/정산 관리',
    description: '클라이언트별 계약 금액, 세금 3.3% 자동 차감 수식 및 미수금 트래킹 대시보드',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '📑',
    cover_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    badge: '💼 프리랜서',
    views: 11200,
    likes: 1430,
    templateData: {
      title: '프리랜서 & 외주 프로젝트 인보이스/정산 관리',
      icon: '📑',
      cover_query: 'freelance contract invoice coffee desk',
      cover_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80',
      description: '외주 프로젝트 일정 및 정산 관리부',
      page_layout: [],
      databases: [
        {
          name: '외주 계약 장부',
          view_type: 'table',
          properties: [
            { name: '프로젝트명', type: 'title' },
            { name: '클라이언트', type: 'text' },
            { name: '계약금액', type: 'number' },
            { name: '입금 상태', type: 'status', options: ['견적 발행', '착수금 수령', '잔금 입금완료'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-9',
    rank: 9,
    title: '가을 독서 기록 & 인사이트 북노트 (독서 마라톤)',
    description: '도서 책장 갤러리 뷰, 별점 평가, 핵심 인용구 및 독서량 게이지 수식',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '📚',
    cover_url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80',
    badge: '📚 독서 1위',
    views: 10800,
    likes: 1390,
    templateData: {
      title: '가을 독서 기록 & 인사이트 북노트',
      icon: '📚',
      cover_query: 'autumn reading book library cozy',
      cover_url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=1600&q=80',
      description: '읽은 책 기록과 인사이트 아카이빙',
      page_layout: [],
      databases: [
        {
          name: '내 서재 갤러리',
          view_type: 'gallery',
          properties: [
            { name: '도서명', type: 'title' },
            { name: '저자', type: 'text' },
            { name: '독서 상태', type: 'status', options: ['읽을 책', '읽는 중', '완독'] },
            { name: '별점', type: 'select', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐'] }
          ]
        }
      ]
    }
  },
  {
    id: 'top-10',
    rank: 10,
    title: '하반기 바디프로필 & 피트니스 운동 루틴 트래커',
    description: '부위별 분할 운동 루틴, 점진적 과부하 중량 일지 및 매일 식단 매크로',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🏋️',
    cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    badge: '🏋️ 헬스/식단',
    views: 10200,
    likes: 1310,
    templateData: {
      title: '하반기 바디프로필 & 피트니스 운동 루틴 트래커',
      icon: '🏋️',
      cover_query: 'gym workout fitness dumbbell weights',
      cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
      description: '운동 루틴 및 영양 섭취 기록',
      page_layout: [],
      databases: [
        {
          name: '일일 운동 기록부',
          view_type: 'table',
          properties: [
            { name: '루틴명', type: 'title' },
            { name: '운동 부위', type: 'select', options: ['가슴', '등', '하체', '어깨', '유산소'] },
            { name: '세트수 x 중량', type: 'text' }
          ]
        }
      ]
    }
  },

  // 11 ~ 20위
  {
    id: 'top-11',
    rank: 11,
    title: '국내/해외 주식 투자 매매일지 & 포트폴리오 비중',
    description: '매수/매도 복기, 배당금 캘린더, 섹터별 투자 비중 원형 그래프 및 수익률 수식',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '📈',
    cover_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    badge: '📈 주식/투자',
    views: 9800,
    likes: 1250,
    templateData: {
      title: '국내/해외 주식 투자 매매일지',
      icon: '📈',
      cover_query: 'stock market trading investment',
      cover_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
      description: '주식 매매일지와 수익률 기록부',
      page_layout: [],
      databases: [{ name: '종목 매매 장부', view_type: 'table', properties: [{ name: '종목명', type: 'title' }, { name: '매수가', type: 'number' }, { name: '현재가', type: 'number' }] }]
    }
  },
  {
    id: 'top-12',
    rank: 12,
    title: '스타트업 채용 관리(ATS) 및 지원자 인터뷰 파이프라인',
    description: '서류 심사, 1차 실무 인터뷰, 컬처핏 평가표 및 최종 합격자 온보딩 칸반',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '👥',
    cover_url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
    badge: '👥 HR 채용',
    views: 9500,
    likes: 1210,
    templateData: {
      title: '스타트업 채용 관리(ATS) 시스템',
      icon: '👥',
      cover_query: 'interview candidates hr corporate',
      cover_url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80',
      description: '지원자 단계별 인터뷰 평가 파이프라인',
      page_layout: [],
      databases: [{ name: '지원자 현황', view_type: 'board', properties: [{ name: '지원자명', type: 'title' }, { name: '단계', type: 'status', options: ['서류접수', '1차면접', '최종면접', '합격'] }] }]
    }
  },
  {
    id: 'top-13',
    rank: 13,
    title: '부동산 임장 노트 & 내 집 마련 체크리스트',
    description: '아파트 단지 정보, 학군/교통 입지 분석, 매매/전세 호가 비교 및 임장 사진 갤러리',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '🏠',
    cover_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    badge: '🏠 부동산',
    views: 9200,
    likes: 1180,
    templateData: {
      title: '부동산 임장 노트 & 내 집 마련 체크리스트',
      icon: '🏠',
      cover_query: 'modern house architecture real estate',
      cover_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
      description: '부동산 임장 및 입지 분석 장부',
      page_layout: [],
      databases: [{ name: '임장 단지 목록', view_type: 'table', properties: [{ name: '단지명', type: 'title' }, { name: '지역', type: 'text' }, { name: '매매호가', type: 'number' }] }]
    }
  },
  {
    id: 'top-14',
    rank: 14,
    title: '개발자 코딩테스트 & CS 지식 오답노트',
    description: '백준/프로그래머스 난이도별 알고리즘 문제 링크, 시간복잡도 분석, 정답 코드 블록',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '💻',
    cover_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    badge: '💻 코테/개발',
    views: 8900,
    likes: 1140,
    templateData: {
      title: '개발자 코딩테스트 & CS 지식 오답노트',
      icon: '💻',
      cover_query: 'software code programming screen',
      cover_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80',
      description: '알고리즘 문제 풀이 및 복기 아카이브',
      page_layout: [],
      databases: [{ name: '문제 풀이 저장소', view_type: 'table', properties: [{ name: '문제 제목', type: 'title' }, { name: '유형', type: 'select', options: ['DFS/BFS', 'DP', '그리디'] }, { name: '해결 여부', type: 'status' }] }]
    }
  },
  {
    id: 'top-15',
    rank: 15,
    title: '신규 입사자 온보딩 핸드북 & 사내 위키',
    description: '회사 비전, 슬랙/깃허브 개발 환경 셋업 가이드, 조직도, 복지 규정 올인원 포털',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🏢',
    cover_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    badge: '🏢 사내 위키',
    views: 8700,
    likes: 1100,
    templateData: {
      title: '신규 입사자 온보딩 핸드북 & 사내 위키',
      icon: '🏢',
      cover_query: 'modern office workspace meeting',
      cover_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      description: '팀 온보딩 가이드와 사내 업무 규정 포털',
      page_layout: [],
      databases: [{ name: '온보딩 체크리스트', view_type: 'table', properties: [{ name: '태스크', type: 'title' }, { name: '기한', type: 'date' }, { name: '완료', type: 'checkbox' }] }]
    }
  },
  {
    id: 'top-16',
    rank: 16,
    title: '수면 패턴 & 컨디션 바이오리듬 트래커',
    description: '취침/기상 시각 수식 자동 계산, 수면 질 평가, 일일 에너지 레벨 연계 그래프',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🌙',
    cover_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    badge: '🌙 수면/휴식',
    views: 8400,
    likes: 1060,
    templateData: {
      title: '수면 패턴 & 컨디션 바이오리듬 트래커',
      icon: '🌙',
      cover_query: 'night sky moon cozy bed',
      cover_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80',
      description: '수면 시간과 컨디션 모니터링',
      page_layout: [],
      databases: [{ name: '수면 일지', view_type: 'table', properties: [{ name: '날짜', type: 'title' }, { name: '수면 시간(h)', type: 'number' }, { name: '컨디션', type: 'select', options: ['최상', '보통', '피곤'] }] }]
    }
  },
  {
    id: 'top-17',
    rank: 17,
    title: '대학원 석/박사 연구 논문 리뷰 & 레퍼런스 정리',
    description: '논문 PDF 첨부, 핵심 연구 가설, 방법론, 인용 형식(BibTeX) 및 학회 일정',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '🔬',
    cover_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    badge: '🔬 연구/논문',
    views: 8100,
    likes: 1020,
    templateData: {
      title: '대학원 연구 논문 리뷰 & 레퍼런스 아카이브',
      icon: '🔬',
      cover_query: 'science laboratory research university',
      cover_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=80',
      description: '논문 읽기 진행률과 핵심 요약 데이터베이스',
      page_layout: [],
      databases: [{ name: '논문 데이터베이스', view_type: 'table', properties: [{ name: '논문명', type: 'title' }, { name: '저자', type: 'text' }, { name: '상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-18',
    rank: 18,
    title: '1 on 1 정기 미팅 기록 & 팀원 성장 로드맵',
    description: '리더-팀원 간 정기 원온원 아젠다, 업무 고충 피드백, 액션 아이템 팔로업',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '💬',
    cover_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    badge: '💬 팀 빌딩',
    views: 7900,
    likes: 990,
    templateData: {
      title: '1 on 1 정기 미팅 기록 & 팀원 성장 로드맵',
      icon: '💬',
      cover_query: 'one on one coffee conversation business',
      cover_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80',
      description: '팀원 면담 기록 및 커리어 액션 플랜',
      page_layout: [],
      databases: [{ name: '원온원 미팅록', view_type: 'table', properties: [{ name: '미팅 제목', type: 'title' }, { name: '팀원', type: 'text' }, { name: '날짜', type: 'date' }] }]
    }
  },
  {
    id: 'top-19',
    rank: 19,
    title: '유튜브 & 인스타그램 SNS 콘텐츠 캘린더/제작 파이프라인',
    description: '아이디어 기획, 스크립트 작성, 촬영, 편집, 썸네일 A/B 테스트 및 업로드 일정',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🎬',
    cover_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=800&q=80',
    badge: '🎬 크리에이터',
    views: 7700,
    likes: 960,
    templateData: {
      title: '유튜브 & 인스타그램 SNS 콘텐츠 파이프라인',
      icon: '🎬',
      cover_query: 'youtube camera video editing creator',
      cover_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=1600&q=80',
      description: '영상 콘텐츠 발행 일정 및 기획안',
      page_layout: [],
      databases: [{ name: '콘텐츠 발행 캘린더', view_type: 'calendar', properties: [{ name: '콘텐츠 제목', type: 'title' }, { name: '채널', type: 'select', options: ['유튜브', '인스타그램', '블로그'] }, { name: '상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-20',
    rank: 20,
    title: '매일 3줄 감사 일기 & 마인드풀니스 회고',
    description: '하루를 차분하게 마무리하는 3줄 감사, 오늘 가장 인상 깊었던 순간, 내일의 다짐',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '✨',
    cover_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    badge: '✨ 멘탈케어',
    views: 7500,
    likes: 940,
    templateData: {
      title: '매일 3줄 감사 일기 & 마인드풀니스 회고',
      icon: '✨',
      cover_query: 'mindfulness sunset meadow calm',
      cover_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
      description: '감사 일기와 하루 멘탈 점검 기록부',
      page_layout: [],
      databases: [{ name: '감사 일기장', view_type: 'table', properties: [{ name: '날짜', type: 'title' }, { name: '오늘의 감사', type: 'text' }, { name: '기분 점수', type: 'select', options: ['5점 (최고)', '4점', '3점', '2점', '1점'] }] }]
    }
  },

  // 21 ~ 30위
  {
    id: 'top-21',
    rank: 21,
    title: 'B2B 영업 고객 관리(CRM) 및 계약 수주 파이프라인',
    description: '리드 확보, 제안서 발송, 계약 단계별 성사 확률(Deal Size) 및 담당자 관리',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🤝',
    cover_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    badge: '🤝 B2B 영업',
    views: 7300,
    likes: 910,
    templateData: {
      title: 'B2B 영업 고객 관리(CRM) 파이프라인',
      icon: '🤝',
      cover_query: 'business handshake meeting b2b',
      cover_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80',
      description: '영업 기회와 고객사 커뮤니케이션 트래커',
      page_layout: [],
      databases: [{ name: '딜 파이프라인', view_type: 'board', properties: [{ name: '고객사명', type: 'title' }, { name: '단계', type: 'status' }, { name: '예상 수주액', type: 'number' }] }]
    }
  },
  {
    id: 'top-22',
    rank: 22,
    title: '미니멀 라이프 비움 일지 & 옷장 캡슐 워드로브',
    description: '계절별 옷장 캡슐 코디, 불필요한 물건 당근마켓/나눔 방출 기록 및 소비 절제',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🧺',
    cover_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    badge: '🧺 미니멀라이프',
    views: 7100,
    likes: 880,
    templateData: {
      title: '미니멀 라이프 비움 일지 & 캡슐 워드로브',
      icon: '🧺',
      cover_query: 'minimalist wardrobe clean room',
      cover_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80',
      description: '비움 목록과 미니멀 옷장 정리',
      page_layout: [],
      databases: [{ name: '비움 리스트', view_type: 'table', properties: [{ name: '물품명', type: 'title' }, { name: '처리 방식', type: 'select', options: ['중고판매', '기부', '폐기'] }] }]
    }
  },
  {
    id: 'top-23',
    rank: 23,
    title: '반려동물(강아지/고양이) 건강수첩 & 예방접종 캘린더',
    description: '체중 변화 그래프, 사료/간식 반응, 동물병원 진료 내역 및 심장사상충 예정일',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🐾',
    cover_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    badge: '🐾 펫케어',
    views: 6900,
    likes: 850,
    templateData: {
      title: '반려동물 건강수첩 & 진료 일지',
      icon: '🐾',
      cover_query: 'cute puppy dog cat pet',
      cover_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1600&q=80',
      description: '반려동물 진료 기록과 접종 캘린더',
      page_layout: [],
      databases: [{ name: '병원 진료 장부', view_type: 'table', properties: [{ name: '진료 항목', type: 'title' }, { name: '날짜', type: 'date' }, { name: '비용', type: 'number' }] }]
    }
  },
  {
    id: 'top-24',
    rank: 24,
    title: '토익/오픽/토플 어학 시험 단기 완성 플래너',
    description: '파트별 목표 점수, 매일 LC/RC 단어 암기 체크, 모의고사 오답 및 시험 D-Day',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '🗣️',
    cover_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    badge: '🗣️ 어학/스펙',
    views: 6700,
    likes: 820,
    templateData: {
      title: '어학 시험 단기 완성 플래너',
      icon: '🗣️',
      cover_query: 'english study book vocabulary',
      cover_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80',
      description: '어학 시험 준비 및 모의고사 점수 트래커',
      page_layout: [],
      databases: [{ name: '모의고사 기록부', view_type: 'table', properties: [{ name: '회차', type: 'title' }, { name: '점수', type: 'number' }, { name: '날짜', type: 'date' }] }]
    }
  },
  {
    id: 'top-25',
    rank: 25,
    title: '제품 기획자(PM/PO) PRD 요구사항 명세서',
    description: '기능 문제 정의, 유저 스토리, 기능 명세 테이블, 와이어프레임 링크 및 릴리즈 일정',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '📋',
    cover_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    badge: '📋 PM/PO',
    views: 6500,
    likes: 800,
    templateData: {
      title: '제품 요구사항 명세서 (PRD) 템플릿',
      icon: '📋',
      cover_query: 'product management tech laptop',
      cover_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80',
      description: '기능 정의와 개발 요구사항 스펙 문서',
      page_layout: [],
      databases: [{ name: '기능 스펙 목록', view_type: 'table', properties: [{ name: '기능명', type: 'title' }, { name: '우선순위', type: 'select', options: ['Must Have', 'Should Have', 'Nice to Have'] }, { name: '상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-26',
    rank: 26,
    title: '하반기 국내/해외 여행 플래너 & 여행 가계부',
    description: '항공권/숙소 바우처, 일자별 타임라인 일정표, 짐 싸기 체크리스트 및 환율 계산',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '✈️',
    cover_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    badge: '✈️ 여행/힐링',
    views: 6300,
    likes: 770,
    templateData: {
      title: '국내/해외 여행 일정 & 가계부 플래너',
      icon: '✈️',
      cover_query: 'travel airplane passport map luggage',
      cover_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
      description: '여행 일정표와 현지 경비 지출 장부',
      page_layout: [],
      databases: [{ name: '일자별 일정표', view_type: 'table', properties: [{ name: '방문지', type: 'title' }, { name: '날짜', type: 'date' }, { name: '예상 비용', type: 'number' }] }]
    }
  },
  {
    id: 'top-27',
    rank: 27,
    title: '개인 브랜딩 & 사이드 프로젝트 런칭 대시보드',
    description: '타깃 오디언스 정의, MVP 런칭 로드맵, 홍보 채널 성과 및 초기 유저 피드백',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '💡',
    cover_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    badge: '💡 사이드프로젝트',
    views: 6100,
    likes: 750,
    templateData: {
      title: '사이드 프로젝트 런칭 대시보드',
      icon: '💡',
      cover_query: 'startup coding side project idea',
      cover_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      description: '사이드 프로젝트 개발 및 런칭 트래커',
      page_layout: [],
      databases: [{ name: '마일스톤 목록', view_type: 'board', properties: [{ name: '과제', type: 'title' }, { name: '상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-28',
    rank: 28,
    title: '연간 구독 서비스 & 정기결제 지출 다이어트',
    description: '넷플릭스/스포티파이/SaaS 결제일, 월별 누적 구독 비용, 미사용 서비스 해지 점검',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '🔄',
    cover_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
    badge: '🔄 구독/고정비',
    views: 5900,
    likes: 720,
    templateData: {
      title: '구독 서비스 & 정기결제 지출 다이어트',
      icon: '🔄',
      cover_query: 'credit card payment subscription digital',
      cover_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80',
      description: '월별 고정 지출 및 정기 구독료 관리',
      page_layout: [],
      databases: [{ name: '구독 서비스 장부', view_type: 'table', properties: [{ name: '서비스명', type: 'title' }, { name: '월 결제액', type: 'number' }, { name: '결제일', type: 'text' }] }]
    }
  },
  {
    id: 'top-29',
    rank: 29,
    title: '공인중개사/기사 자격증 30일 완성 스터디 플래너',
    description: '기출 회차별 정답률 통계, 과목별 과락 방지 점수 계산, 핵심 암기 노트',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '📝',
    cover_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    badge: '📝 자격증',
    views: 5700,
    likes: 690,
    templateData: {
      title: '자격증 30일 완성 스터디 플래너',
      icon: '📝',
      cover_query: 'exam certification study pen paper',
      cover_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80',
      description: '자격증 공부 진도율과 모의고사 점수',
      page_layout: [],
      databases: [{ name: '공부 진도표', view_type: 'table', properties: [{ name: '단원명', type: 'title' }, { name: '달성률', type: 'status' }] }]
    }
  },
  {
    id: 'top-30',
    rank: 30,
    title: '소규모 팀 주간 업무 보고 & 회의록 아카이브',
    description: '매주 금요일 주간 성과 공유, 차주 예정 과제, 블로커(Blocker) 해결 회의록',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '📌',
    cover_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    badge: '📌 회의록',
    views: 5500,
    likes: 670,
    templateData: {
      title: '소규모 팀 주간 업무 보고 & 회의록',
      icon: '📌',
      cover_query: 'team collaboration meeting board office',
      cover_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
      description: '주간 업무 공유 및 회의록 기록 시스템',
      page_layout: [],
      databases: [{ name: '주간 회의록', view_type: 'table', properties: [{ name: '회의 안건', type: 'title' }, { name: '일자', type: 'date' }, { name: '작성자', type: 'text' }] }]
    }
  },

  // 31 ~ 40위
  {
    id: 'top-31',
    rank: 31,
    title: '오마카세/와인 테이스팅 & 맛집 아카이브 지도',
    description: '방문 일자, 미식 평점, 추천 메뉴, 와인 빈티지 및 재방문 의사 갤러리',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🍷',
    cover_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    badge: '🍷 미식/와인',
    views: 5300,
    likes: 650,
    templateData: {
      title: '맛집 & 와인 테이스팅 노트',
      icon: '🍷',
      cover_query: 'wine gourmet restaurant dining',
      cover_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=80',
      description: '미식 기록과 추천 장소 아카이브',
      page_layout: [],
      databases: [{ name: '미식 기록부', view_type: 'gallery', properties: [{ name: '가게명', type: 'title' }, { name: '별점', type: 'select', options: ['5점', '4점', '3점'] }] }]
    }
  },
  {
    id: 'top-32',
    rank: 32,
    title: '소프트웨어 QA 테스트 케이스 & 버그 트래커',
    description: '기능별 TC 번호, 사전조건, 기대결과, 재현 스텝 및 심각도(Severity) 트래킹',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🐞',
    cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    badge: '🐞 QA/테스트',
    views: 5100,
    likes: 620,
    templateData: {
      title: '소프트웨어 QA 테스트 케이스 & 버그 트래커',
      icon: '🐞',
      cover_query: 'code matrix bug test software',
      cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
      description: 'QA 테스트 진행 및 결함 수정 관리',
      page_layout: [],
      databases: [{ name: '버그 이슈 목록', view_type: 'table', properties: [{ name: '이슈 제목', type: 'title' }, { name: '심각도', type: 'select', options: ['Critical', 'Major', 'Minor'] }, { name: '해결 상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-33',
    rank: 33,
    title: '홈카페 레시피 & 커피 원두 원산지 테이스팅 노트',
    description: '원두 품종, 로스팅 포인트, 추출 도구(에어로프레스/드립), 물 온도 및 향미 프로파일',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '☕',
    cover_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    badge: '☕ 홈카페',
    views: 4900,
    likes: 600,
    templateData: {
      title: '홈카페 원두 테이스팅 & 브루잉 노트',
      icon: '☕',
      cover_query: 'coffee beans barista pour over',
      cover_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
      description: '커피 원두 기록과 추출 레시피',
      page_layout: [],
      databases: [{ name: '원두 테이스팅 장부', view_type: 'table', properties: [{ name: '원두명', type: 'title' }, { name: '산미/바디감', type: 'text' }] }]
    }
  },
  {
    id: 'top-34',
    rank: 34,
    title: '연간 세금 신고(종합소득세/연말정산) 공제 증빙 서류함',
    description: '기부금, 의료비, 교육비, 신용카드 영수증 증빙 첨부 및 환급액 추정 시뮬레이션',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '🧾',
    cover_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    badge: '🧾 세무/공제',
    views: 4800,
    likes: 580,
    templateData: {
      title: '연말정산 & 세금 공제 증빙 서류함',
      icon: '🧾',
      cover_query: 'calculator receipt tax audit',
      cover_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1600&q=80',
      description: '세액 공제 서류와 영수증 관리',
      page_layout: [],
      databases: [{ name: '공제 영수증 목록', view_type: 'table', properties: [{ name: '항목명', type: 'title' }, { name: '금액', type: 'number' }] }]
    }
  },
  {
    id: 'top-35',
    rank: 35,
    title: '대학 전공 조별과제(팀플) 협업 워크스페이스',
    description: '팀원별 역할 분담, 미팅 일정, 자료조사 링크 및 최종 PPT 발표 준비 대시보드',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '👥',
    cover_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    badge: '👥 팀플/조별',
    views: 4600,
    likes: 560,
    templateData: {
      title: '대학 조별과제(팀플) 협업 워크스페이스',
      icon: '👥',
      cover_query: 'students studying university group project',
      cover_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
      description: '조별과제 역할 분담과 회의 자료',
      page_layout: [],
      databases: [{ name: '역할 분담표', view_type: 'table', properties: [{ name: '과제 항목', type: 'title' }, { name: '담당 팀원', type: 'text' }, { name: '마감일', type: 'date' }] }]
    }
  },
  {
    id: 'top-36',
    rank: 36,
    title: '마케팅 인플루언서 협찬 & 시딩(Seeding) 관리',
    description: '인플루언서 팔로워 수, 제품 발송 송장, 콘텐츠 업로드 링크 및 전환율 성과',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🎁',
    cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    badge: '🎁 마케팅',
    views: 4500,
    likes: 540,
    templateData: {
      title: '인플루언서 협찬 & 시딩 관리 대시보드',
      icon: '🎁',
      cover_query: 'social media marketing gift product',
      cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
      description: '마케팅 협찬 진행 상황 트래커',
      page_layout: [],
      databases: [{ name: '협찬 리스트', view_type: 'table', properties: [{ name: '인플루언서 계정', type: 'title' }, { name: '발송 상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-37',
    rank: 37,
    title: '플랜테리어(반려식물) 물주기 & 분갈이 캘린더',
    description: '식물별 물주기 주기, 직사광선/통풍 환경, 분갈이 영양제 투여일 및 성장 사진',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🪴',
    cover_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    badge: '🪴 식물집사',
    views: 4300,
    likes: 520,
    templateData: {
      title: '반려식물 물주기 & 분갈이 다이어리',
      icon: '🪴',
      cover_query: 'plants green botanical indoor home',
      cover_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1600&q=80',
      description: '식물 관리 주기와 성장 기록',
      page_layout: [],
      databases: [{ name: '식물 목록', view_type: 'gallery', properties: [{ name: '식물명', type: 'title' }, { name: '물주기 간격', type: 'text' }] }]
    }
  },
  {
    id: 'top-38',
    rank: 38,
    title: '만다라트(Mandal-Art) 64개 핵심 실천 계획표',
    description: '오타니 쇼헤이 식 핵심 목표 1개와 8대 하위 목표, 64개 세부 행동 지침 시스템',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🎯',
    cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    badge: '🎯 만다라트',
    views: 4200,
    likes: 500,
    templateData: {
      title: '만다라트 64개 핵심 실천 계획표',
      icon: '🎯',
      cover_query: 'target archery focus success goal',
      cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
      description: '만다라트 목표 구조화 템플릿',
      page_layout: [],
      databases: [{ name: '실천 과제 매트릭스', view_type: 'table', properties: [{ name: '세부 행동', type: 'title' }, { name: '상위 영역', type: 'select', options: ['건강', '역량', '멘탈', '재정'] }] }]
    }
  },
  {
    id: 'top-39',
    rank: 39,
    title: '인공지능(AI) 프롬프트 엔지니어링 라이브러리',
    description: 'ChatGPT/Gemini/Claude 모델별 시스템 프롬프트, 변수 입력 템플릿 및 결과물 평가',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🤖',
    cover_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    badge: '🤖 AI 프롬프트',
    views: 4000,
    likes: 480,
    templateData: {
      title: 'AI 프롬프트 엔지니어링 라이브러리',
      icon: '🤖',
      cover_query: 'ai artificial intelligence digital brain robot',
      cover_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1600&q=80',
      description: '실무용 프롬프트 및 시스템 지침 저장소',
      page_layout: [],
      databases: [{ name: '프롬프트 보관소', view_type: 'table', properties: [{ name: '프롬프트 제목', type: 'title' }, { name: '용도', type: 'select', options: ['코드작성', '기획', '카피라이팅'] }] }]
    }
  },
  {
    id: 'top-40',
    rank: 40,
    title: '영화/드라마/넷플릭스 인생작 아카이브 & 평점',
    description: '포스터 갤러리 뷰, 관람 일자, 인생 대사 명언, 감독/배우 정보 및 왓챠식 별점',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🍿',
    cover_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    badge: '🍿 문화/영화',
    views: 3900,
    likes: 460,
    templateData: {
      title: '영화/드라마 인생작 아카이브 & 리뷰',
      icon: '🍿',
      cover_query: 'cinema movie theater pop corn film',
      cover_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      description: '감상한 영화 리뷰와 평점 아카이브',
      page_layout: [],
      databases: [{ name: '영화 평점 장부', view_type: 'gallery', properties: [{ name: '작품명', type: 'title' }, { name: '평점', type: 'select', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐'] }] }]
    }
  },

  // 41 ~ 50위
  {
    id: 'top-41',
    rank: 41,
    title: '중고거래(당근/중고나라) 판매 대기 & 택배 정산',
    description: '상품 사진, 희망 판매가, 네고 가능 여부, 편의점 택배 송장 및 정산 총액',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '📦',
    cover_url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
    badge: '📦 중고거래',
    views: 3700,
    likes: 440,
    templateData: {
      title: '중고거래 판매 & 택배 정산 장부',
      icon: '📦',
      cover_query: 'cardboard package delivery box',
      cover_url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1600&q=80',
      description: '중고 물품 판매 상태와 수익금 관리',
      page_layout: [],
      databases: [{ name: '판매 아이템 목록', view_type: 'table', properties: [{ name: '물품명', type: 'title' }, { name: '판매상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-42',
    rank: 42,
    title: '디자인 시스템 에셋 & 컬러/타이포그래피 팔레트',
    description: '브랜드 메인 컬러 HEX 코드, 웹 폰트 가이드라인, 아이콘 SVG 및 UI 컴포넌트',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🎨',
    cover_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    badge: '🎨 디자인시스템',
    views: 3600,
    likes: 420,
    templateData: {
      title: '브랜드 디자인 시스템 & 스타일 가이드',
      icon: '🎨',
      cover_query: 'design color palette typography typography',
      cover_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80',
      description: 'UI 컴포넌트와 디자인 토큰 명세서',
      page_layout: [],
      databases: [{ name: '컬러 팔레트', view_type: 'table', properties: [{ name: '토큰명', type: 'title' }, { name: 'HEX 코드', type: 'text' }] }]
    }
  },
  {
    id: 'top-43',
    rank: 43,
    title: '신혼부부 결혼 준비(웨딩) 예산 & D-Day 체크리스트',
    description: '스드메 견적 비교, 웨딩홀 계약금 잔금일, 청첩장 모바일 명단 및 축의금 정산',
    category: '가계부/재테크',
    tag: '#가계부/재테크',
    icon: '💍',
    cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    badge: '💍 웨딩/결혼',
    views: 3500,
    likes: 400,
    templateData: {
      title: '신혼부부 결혼 준비 예산 & 체크리스트',
      icon: '💍',
      cover_query: 'wedding flowers dress ring romance',
      cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      description: '결혼식 준비 일정표와 비용 예산 장부',
      page_layout: [],
      databases: [{ name: '웨딩 예산부', view_type: 'table', properties: [{ name: '지출 항목', type: 'title' }, { name: '실지출액', type: 'number' }] }]
    }
  },
  {
    id: 'top-44',
    rank: 44,
    title: '주간 장보기(밀프렙) 식단 & 냉장고 지도 파먹기',
    description: '냉장고 유통기한 임박 재료, 일주일 점심/저녁 도시락 메뉴 및 마트 장보기 메모',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🥗',
    cover_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    badge: '🥗 밀프렙/식단',
    views: 3400,
    likes: 380,
    templateData: {
      title: '주간 밀프렙 식단 & 냉장고 재고 관리',
      icon: '🥗',
      cover_query: 'cooking food salad meal prep kitchen',
      cover_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=80',
      description: '식재료 유통기한과 주간 식단표',
      page_layout: [],
      databases: [{ name: '냉장고 재료 목록', view_type: 'table', properties: [{ name: '재료명', type: 'title' }, { name: '유통기한', type: 'date' }] }]
    }
  },
  {
    id: 'top-45',
    rank: 45,
    title: '이커머스/스마트스토어 주문 발송 및 CS 문의 처리',
    description: '일일 송장 등록, 반품/교환 클레임 상태, 고객 FAQ 답변 템플릿 및 재고 수량',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🛒',
    cover_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    badge: '🛒 이커머스',
    views: 3300,
    likes: 360,
    templateData: {
      title: '스마트스토어 주문 & CS 문의 처리 대시보드',
      icon: '🛒',
      cover_query: 'ecommerce shop retail store online',
      cover_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
      description: '쇼핑몰 주문 배송과 고객 문의 처리부',
      page_layout: [],
      databases: [{ name: 'CS 인박스', view_type: 'table', properties: [{ name: '문의 내용', type: 'title' }, { name: '처리 상태', type: 'status' }] }]
    }
  },
  {
    id: 'top-46',
    rank: 46,
    title: '연간 버킷리스트 100가지 & 인생 마일스톤 달성',
    description: '인생에서 꼭 해보고 싶은 100가지 경험, 카테고리별 달성 인증 사진 및 회고',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🏆',
    cover_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    badge: '🏆 버킷리스트',
    views: 3200,
    likes: 350,
    templateData: {
      title: '인생 버킷리스트 100가지 달성 트래커',
      icon: '🏆',
      cover_query: 'adventure travel mountain peak victory',
      cover_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
      description: '버킷리스트 달성 현황 갤러리',
      page_layout: [],
      databases: [{ name: '버킷리스트 100', view_type: 'gallery', properties: [{ name: '목표명', type: 'title' }, { name: '달성 여부', type: 'checkbox' }] }]
    }
  },
  {
    id: 'top-47',
    rank: 47,
    title: '디지털 노마드 원격근무 장소 & 워케이션 가이드',
    description: '도시별 Wi-Fi 속도, 공유오피스 데스크 요금, 물가 지수 및 추천 숙소',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🏝️',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    badge: '🏝️ 워케이션',
    views: 3100,
    likes: 330,
    templateData: {
      title: '디지털 노마드 워케이션 장소 가이드',
      icon: '🏝️',
      cover_query: 'beach laptop digital nomad island',
      cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
      description: '원격근무 최적 도시와 카페 정보',
      page_layout: [],
      databases: [{ name: '워케이션 추천 장소', view_type: 'table', properties: [{ name: '도시명', type: 'title' }, { name: '인터넷 속도', type: 'select', options: ['매우 빠름', '보통', '느림'] }] }]
    }
  },
  {
    id: 'top-48',
    rank: 48,
    title: '뉴스레터 아티클 클리핑 & 인사이트 지식 서고',
    description: '구독 중인 테크/트렌드 뉴스레터 요약, 3문장 인사이트 및 주제별 태그 아카이브',
    category: '학업/스터디',
    tag: '#학업/스터디',
    icon: '📰',
    cover_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    badge: '📰 지식/서고',
    views: 3000,
    likes: 310,
    templateData: {
      title: '뉴스레터 클리핑 & 인사이트 지식 서고',
      icon: '📰',
      cover_query: 'newspaper glasses coffee reading',
      cover_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80',
      description: '인사이트 아티클 수집 저장소',
      page_layout: [],
      databases: [{ name: '아티클 아카이브', view_type: 'table', properties: [{ name: '제목', type: 'title' }, { name: '출처', type: 'text' }, { name: '분류', type: 'select', options: ['테크', '경제', '트렌드'] }] }]
    }
  },
  {
    id: 'top-49',
    rank: 49,
    title: '인디게임/소프트웨어 출시 체크리스트 & 마일스톤',
    description: '스팀/앱스토어 빌드 제출, 트레일러 영상 제작, 인게임 사운드 및 프레스킷 배포',
    category: '업무/프로젝트',
    tag: '#업무/프로젝트',
    icon: '🎮',
    cover_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    badge: '🎮 인디게임/출시',
    views: 2900,
    likes: 290,
    templateData: {
      title: '인디게임 런칭 체크리스트 & 마일스톤',
      icon: '🎮',
      cover_query: 'video game controller neon pixel arcade',
      cover_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
      description: '게임 런칭 준비 태스크 관리부',
      page_layout: [],
      databases: [{ name: '출시 마일스톤', view_type: 'board', properties: [{ name: '과제', type: 'title' }, { name: '단계', type: 'status' }] }]
    }
  },
  {
    id: 'top-50',
    rank: 50,
    title: '연말 종합 인생 결산 & 새해 신년 목표 플래너',
    description: '올해 10대 뉴스 회고, 감사했던 인연들, 버려야 할 나쁜 습관 및 새해 비전보드',
    category: '루틴/자기계발',
    tag: '#루틴/자기계발',
    icon: '🌟',
    cover_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    badge: '🌟 신년/결산',
    views: 2800,
    likes: 270,
    templateData: {
      title: '연말 종합 인생 결산 & 새해 목표 플래너',
      icon: '🌟',
      cover_query: 'fireworks new year celebration sparkle champagne',
      cover_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=80',
      description: '한 해 결산과 차기 연도 비전 수립 대시보드',
      page_layout: [],
      databases: [{ name: '새해 목표 목록', view_type: 'table', properties: [{ name: '목표', type: 'title' }, { name: '실천 계획', type: 'text' }] }]
    }
  }
];
