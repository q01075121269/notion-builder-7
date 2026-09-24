// src/services/aiOfficeDualEngine.ts
// 제3챕터 AI 오피스 스튜디오 듀얼 생성 엔진 (CREATIVE ↔ FIXED_FORM) 및 수식 유효성 가드레일

import { sanitizeTemplateTitle } from './notionDynamicBuilder';

export type DualEngineMode = 'CREATIVE' | 'FIXED_FORM';

export interface OfficeDocPayload {
  mode: DualEngineMode;
  targetTab: 'docs' | 'sheets' | 'slides';
  title: string;
  summary: string;
  docsContent?: {
    background: string;
    marketAnalysis: string;
    roadmap: string[];
    diagram: string;
  };
  sheetsData?: {
    templateName: string;
    rows: Array<{ item: string; qty: number; price: number; tax: number; total: number; note: string }>;
    sumFormula: string;
    averageFormula: string;
    isValidFormula: boolean;
  };
  slidesData?: Array<{
    id: number;
    title: string;
    subtitle: string;
    keyMessage: string;
    bullets: [string, string, string];
    presenterNote: string;
  }>;
  fixedFormSlot?: {
    department: string;
    author: string;
    date: string;
    purpose: string;
    bgContext: string;
    budgetTotal: number;
    expectedEffect: string;
  };
}

// 1. 수식 무오류 가드레일 (Formula Validator)
export function validateSheetFormulas(formula: string, maxRowIndex: number): { isValid: boolean; correctedFormula: string } {
  if (!formula || typeof formula !== 'string') {
    return { isValid: false, correctedFormula: `=SUM(E1:E${maxRowIndex})` };
  }

  const clean = formula.trim().toUpperCase();

  // SUM 수식 패턴 검증: =SUM(E1:E10) 등
  const sumRegex = /^=SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/;
  // AVERAGE 수식 패턴 검증: =AVERAGE(E1:E10) 등
  const avgRegex = /^=AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/;

  const isSumMatch = sumRegex.test(clean);
  const isAvgMatch = avgRegex.test(clean);

  if (isSumMatch || isAvgMatch) {
    const match = clean.match(sumRegex) || clean.match(avgRegex);
    if (match) {
      const startRow = parseInt(match[2], 10);
      const endRow = parseInt(match[4], 10);

      // 셀 범위 유효성 체크 (1 이상, start <= end)
      if (startRow >= 1 && endRow >= startRow && endRow <= maxRowIndex + 5) {
        return { isValid: true, correctedFormula: clean };
      }
    }
  }

  // 오류 시 자동 복구(Self-Repair) 처리
  const isAvg = clean.includes('AVERAGE');
  const corrected = isAvg ? `=AVERAGE(E1:E${maxRowIndex})` : `=SUM(E1:E${maxRowIndex})`;
  
  return {
    isValid: false,
    correctedFormula: corrected,
  };
}

// 2. 모드 A: 젠스파크(Genspark)형 자유 기획 모드 (CREATIVE)
export function generateCreativeOfficeDoc(prompt: string): OfficeDocPayload {
  const sanitizedTitle = sanitizeTemplateTitle(prompt, '신규 AI 서비스 론칭 제안');
  const cleanPrompt = sanitizedTitle;

  const rows = [
    { item: `${cleanPrompt} AI 코어 엔진 설계`, qty: 1, price: 500000, tax: 50000, total: 550000, note: 'Gemini 3.6 Flash' },
    { item: '클라우드 인프라 및 CDN 구축', qty: 2, price: 200000, tax: 40000, total: 440000, note: '오프라인 IDB 백업' },
    { item: '사용자 UX/UI 스마트 캔버스 모듈', qty: 1, price: 300000, tax: 30000, total: 330000, note: 'Docs·Sheets·Slides' },
    { item: '마케팅 및 프로모션 시연 리포트', qty: 1, price: 150000, tax: 15000, total: 165000, note: 'RAG 팩트 인용' },
  ];

  const maxRow = rows.length;
  const rawSum = `=SUM(E1:E${maxRow})`;
  const formulaCheck = validateSheetFormulas(rawSum, maxRow);

  return {
    mode: 'CREATIVE',
    targetTab: 'docs',
    title: `[자유 기획] ${cleanPrompt}`,
    summary: `본 보고서는 사용자 지시문("${cleanPrompt}")을 바탕으로 시장 배경 분석, AI 수식 그리드 및 5장 규모의 프레젠테이션 슬라이드를 자율 조립한 결과물입니다.`,
    docsContent: {
      background: `${cleanPrompt} 관련 시장 수요 급증에 따른 선제적 시장 점유 및 업무 생산성 300% 향상 목표`,
      marketAnalysis: '기존 파편화된 오피스 툴 사용 대비 통합 AI 오피스 스튜디오 도입 시 문서 작성 오류율 0% 및 평균 기안 시간 45분 -> 3분 단축',
      roadmap: [
        'Phase 1: 모바일 및 웹 기반 1초 퀵 캡처 데이터 자동 수집',
        'Phase 2: Docs·Sheets·Slides 3대 전문 렌더러 라이브 캔버스 매핑',
        'Phase 3: 노션 워크스페이스 원클릭 양방향 동기화 및 팩트 검증 완료'
      ],
      diagram: `[자연어 입력: ${cleanPrompt}] ➔ (Genspark 자유 생성 엔진) ➔ [Docs 보고서 | Sheets 수식 그리드 | Slides 카드]`
    },
    sheetsData: {
      templateName: '자유 기획 예산 명세서',
      rows,
      sumFormula: formulaCheck.correctedFormula,
      averageFormula: `=AVERAGE(E1:E${maxRow})`,
      isValidFormula: formulaCheck.isValid
    },
    slidesData: [
      {
        id: 1,
        title: `01. ${cleanPrompt} 개요`,
        subtitle: '차세대 AI 오피스 스튜디오 혁신 솔루션',
        keyMessage: `💡 ${cleanPrompt}를 위한 통합 비즈니스 라이브 캔버스 구축`,
        bullets: [
          'Docs: 개조식 보고서 및 팩트 인용 뱃지 자동 생성',
          'Sheets: =SUM() 수식 검증 연산 그리드 매핑',
          'Slides: 16:9 반응형 카드 및 발표자 노하우 제공'
        ],
        presenterNote: '청중에게 자유 기획 모드의 핵심 가치와 비전을 명확히 전달하세요.'
      },
      {
        id: 2,
        title: '02. 추진 배경 및 시장 분석',
        subtitle: '생산성 300% 단축 지표 검증',
        keyMessage: '⚡ 수동 서식 작성 소요 시간을 획기적으로 단축하는 사내 표준 통합 체제',
        bullets: [
          '기존 레거시 툴의 파편화 및 수식 계산 오류 해소',
          'NotebookLM RAG 인용 뱃지 기반 100% 팩트 보장',
          '노션 워크스페이스로 원클릭 데이터 최종 푸시'
        ],
        presenterNote: '실제 작성 시간 단축 데이터를 기반으로 설득력을 강화하세요.'
      },
      {
        id: 3,
        title: '03. 3단계 실행 로드맵',
        subtitle: '체계적인 단계별 마일스톤',
        keyMessage: '🚀 수집부터 렌더링, 최종 노션 배포까지 단절 없는 워크플로우 완결',
        bullets: [
          'Step 1: 오케스트레이터 자동 인텐트 분기 및 파싱',
          'Step 2: 수식 무오류 가드레일 자동 유효성 검사',
          'Step 3: 양방향 동기화 및 PDF/CSV 파일 내보내기'
        ],
        presenterNote: '로드맵 진행 상황을 설명하며 기술적 안정성을 강조하세요.'
      },
      {
        id: 4,
        title: '04. 예산 및 소요 인프라',
        subtitle: '=SUM() 수식 검증 완료 예산 대장',
        keyMessage: '📊 합계 수식 연동으로 자동 집계되는 투명한 소요 비용 명세',
        bullets: [
          'AI API 코어 인프라: ₩550,000',
          '클라우드 백업 및 IDB 캐시: ₩440,000',
          'UX/UI 스마트 캔버스 모듈: ₩330,000'
        ],
        presenterNote: 'Sheets 수식 가드레일이 자동 처리되어 오차가 없음을 부각하세요.'
      },
      {
        id: 5,
        title: '05. 결론 및 기대 효과',
        subtitle: '전사 스마트 워크 디지털 전환 완결',
        keyMessage: '🌟 Notion Architect v2.0 AI 오피스 스튜디오 도입 시 선도적 워크스페이스 완성',
        bullets: [
          '문서 작성 오류율 0% 달성',
          '모든 챕터 간 원클릭 데이터 교환',
          'GitHub 배포 및 지속적 파이프라인 가동'
        ],
        presenterNote: '마무리 감사 인사 및 Q&A 진행 안내로 발표를 마무리하세요.'
      }
    ]
  };
}

// 3. 모드 B: 잼스(Gems)형 사내 표준 규격 양식 모드 (FIXED_FORM)
export type FixedFormType = 'EXPENSE' | 'PROPOSAL' | 'WEEKLY';

export function generateFixedFormOfficeDoc(formType: FixedFormType, rawText: string): OfficeDocPayload {
  const dateStr = new Date().toISOString().split('T')[0];

  if (formType === 'EXPENSE') {
    // ① [지출결의서] 양식 고정 Slot-Filling
    const rows = [
      { item: '사내 AI 모델 사용료 (Gemini 3.6)', qty: 1, price: 150000, tax: 15000, total: 165000, note: '월간 결제' },
      { item: '팀 워크스페이스 라이선스 비용', qty: 5, price: 20000, tax: 10000, total: 110000, note: '팀 5인' },
      { item: '미디어 렌더링 서버 호스팅', qty: 1, price: 100000, tax: 10000, total: 110000, note: 'GPU 인스턴스' },
    ];
    const maxRow = rows.length;
    const formulaCheck = validateSheetFormulas(`=SUM(E1:E${maxRow})`, maxRow);

    return {
      mode: 'FIXED_FORM',
      targetTab: 'sheets',
      title: '📋 [표준 양식] 사내 지출결의서',
      summary: '사내 표준 서식 틀(일자, 부서, 적요, 공급가액, 부가세, =SUM 합계)이 100% 보존된 지출결의서 공문서입니다.',
      fixedFormSlot: {
        department: 'AI 전략기획팀',
        author: '김노션 팀장',
        date: dateStr,
        purpose: 'AI 오피스 스튜디오 및 개발 인프라 집행 건',
        bgContext: rawText || '팀 개발 인프라 증설 및 결제 건 건의',
        budgetTotal: 385000,
        expectedEffect: '팀 개발 속도 향상 및 자동 수식 집계로 회계 처리 시간 절감'
      },
      sheetsData: {
        templateName: '사내 표준 지출결의서 (고정 서식)',
        rows,
        sumFormula: formulaCheck.correctedFormula,
        averageFormula: `=AVERAGE(E1:E${maxRow})`,
        isValidFormula: formulaCheck.isValid
      }
    };
  }

  if (formType === 'WEEKLY') {
    // ③ [주간업무보고] 양식 고정 Slot-Filling
    return {
      mode: 'FIXED_FORM',
      targetTab: 'docs',
      title: '📋 [표준 양식] 주간 업무 보고서',
      summary: '금주 실적, 차주 계획, 이슈 및 건의사항 슬롯이 고정된 사내 표준 주간업무보고서입니다.',
      fixedFormSlot: {
        department: 'AI 서비스 개발팀',
        author: '이아키 팀장',
        date: dateStr,
        purpose: '2026년 9월 3주차 주간 업무 실적 및 계획 보고',
        bgContext: rawText || '제3챕터 AI 오피스 스튜디오 및 제4챕터 AI 미디어 랩 파이프라인 완성',
        budgetTotal: 0,
        expectedEffect: '전사 개발 진척도 시각화 및 부서 간 협업 프로세스 투명화'
      },
      docsContent: {
        background: '금주 개발 목표 달성 현황: AI 오피스 3대 라이브 캔버스 및 수식 유효성 가드레일 탑재 완결',
        marketAnalysis: '차주 주요일정: 사용자 피드백 반영, 성능 최적화 및 메인 브랜치 CI/CD 배포 완료',
        roadmap: [
          '금주 실적: 스마트 독스, 시트, 슬라이드 전문 렌더러 구현',
          '차주 계획: 옴니 챗 인텐트 분기 듀얼 오케스트레이터 결합 완료',
          '이슈 사항: 모바일 브라우저 렌더링 최적화 및 오프라인 IDB 캐시 동기화'
        ],
        diagram: '[금주 실적 완료] ➔ [차주 계획 진행] ➔ [이슈 교정 완료]'
      }
    };
  }

  // ② [기획품의서] 기본 (PROPOSAL)
  return {
    mode: 'FIXED_FORM',
    targetTab: 'docs',
    title: '📋 [표준 양식] 기획 품의서',
    summary: '제안 목적, 추진 배경, 소요 예산, 기대 효과 슬롯이 고정 정밀 주입(Slot-Filling)된 공문서 기안입니다.',
    fixedFormSlot: {
      department: '경영혁신실 / AI Lab',
      author: '박수석 연구원',
      date: dateStr,
      purpose: rawText || 'Notion Architect v2.0 AI 오피스 스튜디오 전사 도입의 건',
      bgContext: '사내 업무 작성 효율 극대화 및 노션 워크스페이스 실시간 양방향 적재',
      budgetTotal: 1250000,
      expectedEffect: '전사 문서 작성 시간 80% 단축 및 회계 수식 오류 제로화'
    },
    docsContent: {
      background: '1. 제안 목적: 파편화된 문서 작업 환경을 단일 AI 라이브 캔버스로 통합',
      marketAnalysis: '2. 추진 배경: 업무 작성 시 발생하는 양식 불일치 및 수식 계산 실수 방지',
      roadmap: [
        '소요 예산: 총 ₩1,250,000 (API 인프라 및 서버 캐시 비용 포함)',
        '기대 효과: 연간 2,400시간 업무 공수 절감 및 결재 승인 속도 3배 증가'
      ],
      diagram: '[기안 품의 작성] ➔ [결재 승인 완료] ➔ [노션 DB 자동 등록]'
    }
  };
}

// 4. 스마트 시트 체크리스트 생성 전용 처리기
export function generateChecklistSheetDoc(prompt: string): OfficeDocPayload {
  const cleanPrompt = prompt.trim() || '스마트 업무 및 프로젝트 실행 체크리스트';

  // 1. [음성 요청] 태그 분리 및 본문 텍스트 파싱
  const bodyText = cleanPrompt.replace(/\[음성 요청\]:.*$/s, '').trim() || cleanPrompt;
  const lines = bodyText
    .split(/\n+|\. (?=[가-힣A-Za-z0-9])|;/)
    .map(l => l.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(l => l.length > 2 && !l.includes('스마트 시트') && !l.includes('체크리스트') && !l.includes('만들어 줘'));

  let parsedItems = lines.slice(0, 8).map((line, idx) => ({
    item: `${idx + 1}. ${line.slice(0, 45)}`,
    qty: 1,
    price: 100000 + idx * 20000,
    tax: (100000 + idx * 20000) * 0.1,
    total: (100000 + idx * 20000) * 1.1,
    note: idx === 0 ? '필수 검수 완료' : idx % 2 === 0 ? '검수 대기' : '진행 중'
  }));

  if (parsedItems.length === 0) {
    parsedItems = [
      { item: '1. AI 오피스 스튜디오 연동 및 템플릿 검수', qty: 1, price: 100000, tax: 10000, total: 110000, note: '필수 체크 (완료)' },
      { item: '2. 스마트 시트 자동 수식(=SUM/=COUNTIF) 가드레일 작동', qty: 1, price: 150000, tax: 15000, total: 165000, note: '검수 완료' },
      { item: '3. 업무/임무 관련 세부 실행 항목 파싱 및 슬롯 배치', qty: 1, price: 200000, tax: 20000, total: 220000, note: '진행 중' },
      { item: '4. 노션 마스터 DB 통합 및 원클릭 데이터 최종 푸시', qty: 1, price: 100000, tax: 10000, total: 110000, note: '대기 중' },
    ];
  }

  const maxRow = parsedItems.length;
  const formulaCheck = validateSheetFormulas(`=SUM(E1:E${maxRow})`, maxRow);

  return {
    mode: 'CREATIVE',
    targetTab: 'sheets',
    title: `📊 [스마트 시트] ${cleanPrompt.slice(0, 30)} 체크리스트`,
    summary: `제출하신 업무 본문 텍스트(${parsedItems.length}개 세부 실행 항목)를 정밀 파싱하여 스마트 시트 라이브 체크리스트로 완벽 구율했습니다.`,
    sheetsData: {
      templateName: `${cleanPrompt.slice(0, 20)} 마스터 체크리스트`,
      rows: parsedItems,
      sumFormula: formulaCheck.correctedFormula,
      averageFormula: `=AVERAGE(E1:E${maxRow})`,
      isValidFormula: formulaCheck.isValid
    }
  };
}

// 5. 통합 오케스트레이터 듀얼 처리기 (Orchestrator Adapter)
export function processOfficeOrchestration(userPrompt: string): OfficeDocPayload {
  const lower = userPrompt.toLowerCase();

  // 체크리스트, 시트, 스마트 시트, 엑셀, 표 키워드가 있으면 체크리스트 스마트 시트 생성 엔진 실행
  if (lower.includes('시트') || lower.includes('체크리스트') || lower.includes('표') || lower.includes('엑셀') || lower.includes('sheet')) {
    return generateChecklistSheetDoc(userPrompt);
  }

  // 지출결의서, 기획품의서, 주간보고, 양식, 품의 등의 표준 양식 키워드가 있으면 모드 B (FIXED_FORM)
  if (lower.includes('양식') || lower.includes('지출결의서') || lower.includes('품의서') || lower.includes('주간') || lower.includes('결재') || lower.includes('서식')) {
    let formType: FixedFormType = 'PROPOSAL';
    if (lower.includes('지출') || lower.includes('결의') || lower.includes('가계부')) {
      formType = 'EXPENSE';
    } else if (lower.includes('주간') || lower.includes('보고') || lower.includes('실적')) {
      formType = 'WEEKLY';
    }
    return generateFixedFormOfficeDoc(formType, userPrompt);
  }

  // 그 외 일반 지시는 모드 A (CREATIVE - Genspark 자유 기획 모드)
  return generateCreativeOfficeDoc(userPrompt);
}
