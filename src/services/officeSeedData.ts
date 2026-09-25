import type { OfficeProject, PlanTriad, OfficeSource, OfficeDocument } from '../types/office';

export const INITIAL_SOURCES: OfficeSource[] = [
  {
    id: 'src-1',
    title: '사내 규정집_2026개정판.pdf',
    type: 'file',
    fileSize: '2.4 MB',
    tokenCount: 14200,
    createdAt: '2026-09-20 09:30',
    isSelected: true,
    summary: '신규 IT 예산 집행 승인 기준, 개인정보 보호 및 보안 거버넌스 가이드라인',
    content: `[사내 규정 제45조: 신규 솔루션 도입 및 클라우드 AI 서비스 보안 검증 원칙]
1. 연간 예산 5천만 원 이상 신규 솔루션 도입 시 3개 부서(기획·재무·보안) 교차 결재 필수.
2. 외부 LLM/클라우드 모델 연동 시 데이터 비식별화 및 사내 온프레미스 프록시 게이트웨이 경유 의무화.
3. 2026년 4분기 기준 전사 디지털 전환(DX) 우선 투자 분야: 업무 자동화 및 지식 자산화 솔루션.`
  },
  {
    id: 'src-2',
    title: '2026년 3분기 부서별 집행 및 잔여예산안.xlsx',
    type: 'file',
    fileSize: '840 KB',
    tokenCount: 6850,
    createdAt: '2026-09-22 14:15',
    isSelected: true,
    summary: 'R&D/기획팀 잔여 예산 4,200만 원 및 4분기 유보금 현황',
    content: `[예산 현황 요약]
- IT전략본부 기획팀 총 배정액: 120,000,000원
- 1~3분기 집행 누계: 78,000,000원
- 4분기 가용 잔여액: 42,000,000원 (외주용역비 2,500만원, 소프트웨어 라이선스 1,700만원)
- 비고: 성과 연계형 솔루션 검증(PoC) 시 예비비 1,000만원 추가 전용 가능`
  },
  {
    id: 'src-3',
    title: '글로벌 엔터프라이즈 AI 경쟁사 동향 분석.url',
    type: 'url',
    url: 'https://market-intel.2026/enterprise-ai-trend',
    tokenCount: 9100,
    createdAt: '2026-09-23 11:00',
    isSelected: true,
    summary: '국내외 SaaS 오피스 자동화 전환율 및 3-Way 전략 비교',
    content: `[2026 글로벌 엔터프라이즈 AI 동향 보고]
- 포춘 500대 기업의 74%가 단순 챗봇에서 '인플레이스 캔버스 및 자율 에이전트'로 전환 완료.
- B2B 솔루션 도입 시 결정적 요인: 기존 문서 양식(공문서/한글/엑셀)과의 100% 무손실 호환성.
- 초기 진입 장벽을 낮추기 위한 월 구독형 티어링 및 프라이빗 설치형 하이브리드 모델이 시장 주도.`
  }
];

export const INITIAL_PLAN_TRIAD: PlanTriad = {
  selectedOption: 'A',
  optionA: {
    title: 'A안 : 엔터프라이즈 하이브리드 정석형',
    concept: '사내 규정과 보안을 100% 충족하며 사내 프라이빗 게이트웨이 기반 안정적 점진 배포',
    target: '보안에 민감한 공공기관, 금융권, 대기업 본사 부서',
    pricing: '구축형 4,500만 원 + 월 유지보수 250만 원',
    pros: '사내 컴플라이언스 완벽 통과, 데이터 유출 리스크 제로, 기존 기간계 ERP 무결점 연동',
    cons: '초기 셋업 기간 8~10주 소요, 인프라 투자 비용 발생',
    roadmap: [
      '1단계: 사내 프라이빗 프록시 인프라 구축 및 보안 검증 (4주)',
      '2단계: 기획/재무 2개 핵심 부서 한정 클로즈드 베타 (3주)',
      '3단계: 전사 공문서/시트 자동화 전면 확대 배포 (3주)'
    ]
  },
  optionB: {
    title: 'B안 : 자율 에이전트 중심 파격 혁신형',
    concept: '인간 개입을 최소화하고 젠스파크형 자율 심층 조사 및 멀티모달 실시간 캔버스 전면 적용',
    target: '신속한 사업 확장을 추구하는 테크 유니콘 및 이노베이션 랩',
    pricing: '사용량 기반 종량제 (월 기본 150만 원 + AI 생성 건당 과금)',
    pros: '문서 작성 시간 90% 이상 단축, 자율 에이전트 기반 기획서 자동 파이프라인 완성',
    cons: '현업 부서의 프롬프트 및 에이전트 수용성 적응 교육 필요',
    roadmap: [
      '1단계: 멀티모달 자율 에이전트 엔진 API 연동 (2주)',
      '2단계: 실시간 동시 협업 캔버스 웹소켓 인프라 론칭 (3주)',
      '3단계: 전사 해커톤을 통한 현업 실무 에이전트 템플릿 양산 (2주)'
    ]
  },
  optionC: {
    title: 'C안 : 잔여예산 맞춤 초고속 실속 MVP',
    concept: '3분기 잔여 예산 4,200만 원 이내에서 4주 만에 론칭하는 알짜배기 경량 솔루션',
    target: '예산 집행 기한이 임박하고 즉각적인 가시적 성과가 필요한 실무 기획팀',
    pricing: '일체형 턴키 2,800만 원 (라이선스 및 셋업 포함)',
    pros: '추가 예산 승인 불필요, 4주 이내 초고속 현업 실전 투입, 실패 리스크 최소화',
    cons: '고급 프라이빗 파인튜닝 기능 제외, 표준 템플릿 위주 제공',
    roadmap: [
      '1단계: 검증된 노션-오피스 표준 템플릿 커스텀 패키징 (1주)',
      '2단계: 사내 단일 계정 및 SSO 연동 배포 (2주)',
      '3단계: 4분기 실적 보고용 파일럿 프로젝트 런칭 (1주)'
    ]
  }
};

export const INITIAL_DOCUMENT: OfficeDocument = {
  id: 'doc-seed-2026',
  projectId: 'proj-ai-2026',
  title: '2026년 하반기 차세대 AI 오피스 스튜디오 도입 기안서',
  format: 'docs',
  metadata: {
    author: '김전략 수석매니저',
    department: 'IT전략기획본부 디지털혁신팀',
    approvers: ['김기획(기안)', '박팀장(검토)', '이본부장(결재)'],
    docNumber: '기안-2026-0925-01',
    date: '2026년 09월 25일'
  },
  content: {
    docsContent: {
      sections: [
        {
          id: 'sec-1',
          level: 1,
          marker: '1.',
          text: '추진 배경 및 목적'
        },
        {
          id: 'sec-2',
          level: 2,
          marker: '□',
          text: '전사 생성형 AI 활용 본격화에 따른 표준 문서 및 데이터 기안 자동화 체계 필요성 대두'
        },
        {
          id: 'sec-3',
          level: 3,
          marker: '○',
          text: '기존 수기 작성 방식 대비 문서 작성 공수 약 78% 절감 및 사내 데이터 무결성 확보 목적 [출처: 3]'
        },
        {
          id: 'sec-4',
          level: 3,
          marker: '○',
          text: '사내 규정 제45조 준수를 위한 프라이빗 보안 게이트웨이 탑재 및 인플레이스 결재 라인 연동 [출처: 1]'
        },
        {
          id: 'sec-5',
          level: 1,
          marker: '2.',
          text: '핵심 도입 방안 및 비교 검토 (3-Way 기획안 반영)'
        },
        {
          id: 'sec-6',
          level: 2,
          marker: '□',
          text: '선정 전략: [A안] 엔터프라이즈 하이브리드 정석형 기반 점진 도입'
        },
        {
          id: 'sec-7',
          level: 3,
          marker: '○',
          text: '단계별 로드맵에 의거하여 4분기 PoC 착수 후 2027년 상반기 전사 본청 확대 적용'
        },
        {
          id: 'sec-8',
          level: 4,
          marker: '―',
          text: '소요 예산: 3분기 가용 잔여예산 4,200만 원 범위 내 안전 집행 (총 2,800만 원 책정) [출처: 2]'
        },
        {
          id: 'sec-9',
          level: 1,
          marker: '3.',
          text: '기대 효과 및 향후 일정'
        },
        {
          id: 'sec-10',
          level: 2,
          marker: '□',
          text: '전사 업무 생산성 혁신 및 공문서-노션-스프레드시트 3각 상호운용성 완성'
        },
        {
          id: 'sec-11',
          level: 3,
          marker: '○',
          text: '2026.10.01: 사내 보안 적합성 심의 완료 및 파일럿 그룹 오픈'
        },
        {
          id: 'sec-12',
          level: 3,
          marker: '○',
          text: '2026.11.15: 중간 성과 측정 및 전사 노션 위키 연동 배포'
        }
      ]
    },
    slidesContent: {
      slides: [
        {
          id: 'slide-1',
          title: '2026 하반기 차세대 AI 오피스 스튜디오',
          subtitle: 'Work Faster, Think Deeper • 자율 에이전트와 유니버설 캔버스의 만남',
          bullets: [
            '지식 창고(Knowledge Dock) 기반 100% 팩트 그라운딩',
            '3-Way 기획 인큐베이터: 정석 vs 파격 vs 실속 원클릭 생성',
            '인플레이스 WYSIWYG 캔버스 및 옴니 포맷 익스포트'
          ],
          badge: 'KEYNOTE'
        },
        {
          id: 'slide-2',
          title: '전략 3안 (3-Way Strategy) 심층 비교',
          subtitle: '상황과 예산에 맞춘 3가지 최적의 추진 경로',
          bullets: [
            'A안 (정석형): 사내 규정 100% 준수, 온프레미스 프라이빗 보안망',
            'B안 (혁신형): 멀티모달 자율 에이전트 및 실시간 동시 편집 캔버스',
            'C안 (실속형): 잔여예산 4,200만 원 이내 4주 턴키 초고속 론칭'
          ],
          badge: 'STRATEGY'
        },
        {
          id: 'slide-3',
          title: '도입 기대 효과 및 ROI 산출',
          subtitle: '비용 절감과 업무 퀄리티의 정량적 도약',
          bullets: [
            '문서 작성 리드타임: 평균 4.2일 ➔ 45분으로 90% 단축',
            '문서 누락 및 양식 오류율: 0% 수렴 (실시간 린팅)',
            '사내 지식 자산화율: 노션 마스터 DB 연동으로 300% 증가'
          ],
          badge: 'METRICS'
        }
      ]
    },
    sheetsContent: {
      headers: ['항목 구분', '세부 내역 및 산출 근거', '단위', '수량', '단가 (원)', '공급가액 (원)'],
      rows: [
        {
          id: 'row-1',
          cells: ['솔루션 라이선스', 'AI 오피스 스튜디오 코어 라이선스', '식', 1, 15000000, 15000000]
        },
        {
          id: 'row-2',
          cells: ['인프라 구축비', '사내 프라이빗 게이트웨이 및 보안 연동', '식', 1, 8000000, 8000000]
        },
        {
          id: 'row-3',
          cells: ['컨설팅 및 교육', '3-Way 프롬프트 엔지니어링 및 실무 교육', '회', 2, 2500000, 5000000]
        }
      ],
      hasTotalRow: true,
      totalFormula: '=SUM(F2:F4)'
    },
    citations: [
      {
        id: 'cit-1',
        sourceId: 'src-1',
        sourceTitle: '사내 규정집_2026개정판.pdf',
        textQuote: '연간 예산 5천만 원 이상 신규 솔루션 도입 시 3개 부서 교차 결재 필수 및 사내 프록시 의무화',
        pageOrLine: '제45조 2항'
      },
      {
        id: 'cit-2',
        sourceId: 'src-2',
        sourceTitle: '2026년 3분기 부서별 집행 및 잔여예산안.xlsx',
        textQuote: '4분기 가용 잔여액: 42,000,000원 (외주용역비 2,500만원, 라이선스 1,700만원)',
        pageOrLine: '시트1 B12:D14'
      },
      {
        id: 'cit-3',
        sourceId: 'src-3',
        sourceTitle: '글로벌 엔터프라이즈 AI 경쟁사 동향 분석.url',
        textQuote: '단순 챗봇에서 인플레이스 캔버스 및 자율 에이전트 전환으로 작성 공수 78% 이상 절감',
        pageOrLine: 'Section 3.2'
      }
    ]
  },
  history: [
    {
      action: '문서 최초 생성',
      timestamp: '2026-09-25 00:00:00',
      snapshot: null
    }
  ]
};

export const SEED_PROJECTS: OfficeProject[] = [
  {
    id: 'proj-ai-2026',
    title: '2026 하반기 신규 AI 솔루션 사업기획',
    description: '사내 규정 및 잔여 예산 기반 엔터프라이즈 AI 오피스 스튜디오 도입 기획',
    createdAt: '2026-09-24 10:00',
    updatedAt: '2026-09-25 00:30',
    sources: INITIAL_SOURCES,
    currentDoc: INITIAL_DOCUMENT,
    planTriad: INITIAL_PLAN_TRIAD
  },
  {
    id: 'proj-flagship-2026',
    title: '2026 플래그십 기획',
    description: '차세대 플래그십 서비스 론칭 및 B2B 시장 공략 로드맵',
    createdAt: '2026-09-20 14:00',
    updatedAt: '2026-09-24 18:20',
    sources: [
      {
        id: 'src-flag-1',
        title: '2026 플래그십 제품 정의서.pdf',
        type: 'file',
        fileSize: '3.1 MB',
        tokenCount: 18500,
        createdAt: '2026-09-20 14:30',
        isSelected: true,
        summary: '하이엔드 사용자 타깃 프리미엄 기능 명세',
        content: '플래그십 핵심 가치: 올인원 멀티모달 워크스페이스, 실시간 AI 에이전트 브레인스토밍 지원.'
      }
    ],
    currentDoc: {
      ...INITIAL_DOCUMENT,
      id: 'doc-flag-1',
      title: '2026 플래그십 전략 기획서',
      projectId: 'proj-flagship-2026'
    },
    planTriad: INITIAL_PLAN_TRIAD
  },
  {
    id: 'proj-marketing-2026',
    title: '하반기 마케팅 조사',
    description: '국내외 SaaS 타깃 오디언스 및 인바운드 마케팅 퍼널 분석',
    createdAt: '2026-09-22 16:30',
    updatedAt: '2026-09-24 20:10',
    sources: [
      {
        id: 'src-mkt-1',
        title: 'B2B SaaS 마케팅 벤치마크.url',
        type: 'url',
        url: 'https://marketing-report-2026.io',
        tokenCount: 7800,
        createdAt: '2026-09-22 17:00',
        isSelected: true,
        summary: '오가닉 유입 및 CVR 35% 증대 전략',
        content: '무료 체험판 사용자 대상 3단계 온보딩 이메일 시퀀스 및 즉시 사용 가능한 인터랙티브 캔버스 템플릿 제공이 전환율 1위 견인.'
      }
    ],
    currentDoc: {
      ...INITIAL_DOCUMENT,
      id: 'doc-mkt-1',
      title: '2026 하반기 B2B 마케팅 전략 수립안',
      projectId: 'proj-marketing-2026'
    },
    planTriad: INITIAL_PLAN_TRIAD
  }
];

export const createCleanBlankDocument = (projectId: string, title = '새 기획 프로젝트 공식 기안서'): OfficeDocument => ({
  id: `doc-${Date.now()}`,
  projectId,
  title,
  format: 'docs',
  metadata: {
    author: '담당 매니저',
    department: '기획운영팀',
    approvers: ['기안자(기안)', '팀장(검토)', '본부장(결재)'],
    docNumber: `기안-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  },
  content: {
    docsContent: {
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          level: 1,
          marker: '1.',
          text: '추진 배경 및 목적'
        },
        {
          id: `sec-${Date.now()}-2`,
          level: 2,
          marker: '□',
          text: '새로운 프로젝트 추진을 위한 목적 및 배경 기재'
        },
        {
          id: `sec-${Date.now()}-3`,
          level: 3,
          marker: '○',
          text: '우측 코파일럿에 원하시는 주제(예: 스마트 시설 유지 관리)를 말씀하시면 실무급 공문서가 즉시 자동 작성됩니다.'
        },
        {
          id: `sec-${Date.now()}-4`,
          level: 1,
          marker: '2.',
          text: '주요 사업 내용 및 추진 방안'
        },
        {
          id: `sec-${Date.now()}-5`,
          level: 2,
          marker: '□',
          text: '핵심 실행 과제 및 단계별 추진 로드맵'
        },
        {
          id: `sec-${Date.now()}-6`,
          level: 3,
          marker: '○',
          text: '단계별 마일스톤 및 주요 유관 부서 협업 체계 구축'
        },
        {
          id: `sec-${Date.now()}-7`,
          level: 1,
          marker: '3.',
          text: '소요 예산 및 기대 효과'
        },
        {
          id: `sec-${Date.now()}-8`,
          level: 2,
          marker: '□',
          text: '예산 집행 계획 및 정량적/정성적 기대 효과'
        }
      ]
    },
    sheetsContent: {
      headers: ['번호', '항목명', '산출 근거', '예산(원)', '집행 비고'],
      rows: [
        { id: `row-${Date.now()}-1`, cells: [1, '초기 솔루션 구축비', '기본 라이선스 및 인프라', 20000000, '계약 체결 시'] },
        { id: `row-${Date.now()}-2`, cells: [2, '시스템 커스터마이징', '현장 환경 연동 및 최적화', 15000000, '중도금'] },
        { id: `row-${Date.now()}-3`, cells: [3, '운영자 교육 및 기술지원', '현업 실무자 가이드 배포', 7000000, '검수 완료 시'] }
      ]
    },
    slidesContent: {
      slides: [
        {
          id: `slide-${Date.now()}-1`,
          title: '새 프로젝트 기획 제안',
          subtitle: '실시간 AI 코파일럿 기안',
          bullets: ['신규 프로젝트 개요', '핵심 추진 전략', '기대 효과 및 로드맵']
        },
        {
          id: `slide-${Date.now()}-2`,
          title: '추진 전략 및 실행 방안',
          subtitle: '단계별 마일스톤',
          bullets: ['사전 검토 및 요구사항 정의', '핵심 시스템 구축', '전사 배포 및 안정화']
        }
      ]
    },
    citations: []
  },
  history: [
    {
      action: '새 프로젝트 백지 기안서 템플릿 생성',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      snapshot: null
    }
  ]
});

