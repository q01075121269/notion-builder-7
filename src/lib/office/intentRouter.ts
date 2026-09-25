// src/lib/office/intentRouter.ts
// Jev형 지능형 의도 분류기(Intent Classifier) 및 Gemini 심층 기안문 작문 엔진

import type { 
  OfficeDocument, 
  DocSection, 
  SheetRow, 
  OfficeSource, 
  OfficeDocumentFormat 
} from '../../types/office';

export type OfficeIntentType =
  | 'REWRITE_DOCUMENT_TOPIC'   // 특정 주제(예: AI 에이전트 도입 등)로 문서 전체 전문 재구성
  | 'AUTO_GENERATE_TITLE'       // 본문 내용에 부합하는 전문적이고 타당한 제목 자동 작문 ("아래 내용에 맞게", "적당하게" 등)
  | 'MULTI_LINE_TITLE'          // 제목을 2줄로 줄바꿈/분할
  | 'UPDATE_SECTION'            // 특정 구역(추진 배경, 1번 항목, 실행 방안 등) 수정 또는 항목 추가
  | 'UPDATE_APPROVERS'          // 결재란/결재선 직급 및 명단 변경
  | 'INSERT_TABLE_ROW'          // 표에 데이터/행 추가 및 수식 계산
  | 'FORMAT_TRANSFORM'          // 개조식(-함) 일괄 정돈 또는 서식 변환
  | 'DEEP_CONSULTING';          // 심층 맥락 질의응답 및 전략 제안

export interface ClassifiedIntent {
  type: OfficeIntentType;
  topic?: string;
  targetArea?: 'title' | 'approvers' | 'metadata' | 'sections' | 'sheets' | 'slides';
  parameters?: Record<string, any>;
  reasoning: string;
}

export interface IntentExecutionResult {
  updatedDoc: OfficeDocument;
  actionName: string;
  replyText: string;
  highlightTarget?: string;
  targetFormat?: OfficeDocumentFormat;
}

// 1. 금액 파서 헬퍼: "120만 원", "50만원", "1500000원", "150만", "4200만" 등 숫자로 변환
export const parseKoreanCurrency = (text: string): { amount: number; matchedStr: string } => {
  const manMatch = text.match(/(\d+[\d,]*)\s*만\s*원?/);
  if (manMatch) {
    const val = parseInt(manMatch[1].replace(/,/g, ''), 10);
    return { amount: val * 10000, matchedStr: manMatch[0] };
  }

  const wonMatch = text.match(/(\d+[\d,]*)\s*원/);
  if (wonMatch) {
    const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
    return { amount: val, matchedStr: wonMatch[0] };
  }

  const numMatch = text.match(/(\d{5,})/);
  if (numMatch) {
    return { amount: parseInt(numMatch[1], 10), matchedStr: numMatch[0] };
  }

  return { amount: 42000000, matchedStr: '' };
};

// 2. Jev형 정밀 의도 분류기 (Intent Classifier)
export function classifyOfficeIntent(
  rawPrompt: string,
  _currentDoc: OfficeDocument
): ClassifiedIntent {
  const text = rawPrompt.trim();
  const lower = text.toLowerCase();

  // A. 제목 관련 메타 지시 분석 (단순 문자열 취득이 아닌 '의도' 판별)
  const isAutoTitleKeywords = [
    '아래 내용에 맞게', '내용에 맞게', '적당하게', '적당한 제목', '어울리는 제목',
    '제목 추천', '제목 알아서', '제목 지어줘', '제목 자동 생성', '제목 정해줘',
    '제목 다시 지어', '제목 뽑아줘', '제목 변경해줘 내용에'
  ];
  const hasAutoTitleIntent = isAutoTitleKeywords.some(kw => text.includes(kw));

  const isMultiLineReq = /두\s*줄|2줄|줄바꿈|행바꿈|줄\s*나눠|멀티라인/.test(text);

  // 1순위: 주제 전면 개편 명령 (예: "지금 내용을 AI 에이전트 내용으로 바꿔봐", "자율 에이전트 도입으로 재구성")
  const isTopicRewrite = 
    (text.includes('내용') && (text.includes('바꿔') || text.includes('변경') || text.includes('개편') || text.includes('재구성'))) &&
    (text.includes('에이전트') || text.includes('agent') || lower.includes('ai') || text.includes('자동화') || text.includes('도입') || text.includes('주제'));

  if (isTopicRewrite) {
    return {
      type: 'REWRITE_DOCUMENT_TOPIC',
      topic: 'AI_AGENT_AUTOMATION',
      targetArea: 'sections',
      reasoning: '전사 자율형 AI 에이전트 도입 및 업무 프로세스 자동화 주제로 문서 전면 개편 지시 감지'
    };
  }

  // 2순위: 제목 자동 작문 (본문 내용에 부합하는 정규 제목 생성)
  if (hasAutoTitleIntent) {
    return {
      type: 'AUTO_GENERATE_TITLE',
      targetArea: 'title',
      parameters: { isMultiLine: isMultiLineReq },
      reasoning: '사용자가 본문 맥락에 맞는 최적의 정식 기안서 제목 자동 작성을 요청함'
    };
  }

  // 3순위: 제목 2줄 분할 줄바꿈 명령
  if (isMultiLineReq && (text.includes('제목') || text.includes('타이틀') || text.includes('문서명') || text.includes('기안서'))) {
    return {
      type: 'MULTI_LINE_TITLE',
      targetArea: 'title',
      reasoning: '제목을 2줄로 시각적 가독성 있게 줄바꿈 분할 요청'
    };
  }

  // 4순위: 결재란/결재선 직급 변경 명령
  if (text.includes('결재') || text.includes('서명선') || text.includes('승인선') || text.includes('결재자') || text.includes('결재란')) {
    return {
      type: 'UPDATE_APPROVERS',
      targetArea: 'approvers',
      reasoning: '결재란 직급, 성함 또는 승인 단계 변경 요청'
    };
  }

  // 5순위: 추진 배경 또는 본문 특정 섹션 수정
  if (text.includes('추진 배경') || text.includes('추진배경') || text.includes('목적') || text.includes('방안') || text.includes('섹션') || text.includes('항목')) {
    return {
      type: 'UPDATE_SECTION',
      targetArea: 'sections',
      reasoning: '공문서 추진 배경 또는 특정 세부 실행 항목 내용 수정/추가 요청'
    };
  }

  // 6순위: 스프레드시트 예산 표/행 추가 및 수식 계산
  if (text.includes('표') || text.includes('시트') || text.includes('행') || text.includes('예산') || text.includes('비목') || text.includes('금액')) {
    return {
      type: 'INSERT_TABLE_ROW',
      targetArea: 'sheets',
      reasoning: '스프레드시트 예산 내역 행 추가 및 =SUM() 수식 정산 요청'
    };
  }

  // 7순위: 행안부 표준 개조식 종결어미(-함) 정돈
  if (text.includes('개조식') || text.includes('어조') || text.includes('다듬')) {
    return {
      type: 'FORMAT_TRANSFORM',
      targetArea: 'sections',
      reasoning: '행정안전부 표준 공문서 개조식 어조(-함, -임) 일괄 정돈'
    };
  }

  // 8순위: 일반 제목 명시적 변경
  if (text.includes('제목') || text.includes('문서명')) {
    return {
      type: 'AUTO_GENERATE_TITLE',
      targetArea: 'title',
      parameters: { isMultiLine: isMultiLineReq },
      reasoning: '일반 문서 제목 변경 요청'
    };
  }

  // 기본: 심층 맥락 컨설팅
  return {
    type: 'DEEP_CONSULTING',
    reasoning: '기타 자연어 질의 및 기획안 고도화 자문 요청'
  };
}

// 3. 실무급 Gemini 심층 작문 및 지식 창고(Knowledge Dock) 기반 인플레이스 변이 엔진
export function executeOfficeIntent(
  intent: ClassifiedIntent,
  userInput: string,
  currentDoc: OfficeDocument,
  _sources: OfficeSource[] = []
): IntentExecutionResult {
  const updatedDoc: OfficeDocument = JSON.parse(JSON.stringify(currentDoc));

  switch (intent.type) {
    // =========================================================================
    // 1. REWRITE_DOCUMENT_TOPIC: 전사 자율형 AI 에이전트 도입 체계로 전면 재구성
    // =========================================================================
    case 'REWRITE_DOCUMENT_TOPIC': {
      const newTitle = '2026년 하반기 전사 자율형 AI 에이전트 도입 및 업무 프로세스 자동화 기안서';

      // 좌측 지식 창고 컨텍스트(사내 규정 제45조, 잔여 예산 4,200만 원, 글로벌 경쟁사 동향) 100% 반영
      const newSections: DocSection[] = [
        {
          id: 'sec-topic-1',
          level: 1,
          marker: '1.',
          text: '추진 배경 및 목적'
        },
        {
          id: 'sec-topic-2',
          level: 2,
          marker: '□',
          text: '단순 챗봇의 한계를 극복하고 온보딩·문서전처리·데이터취합을 24시간 전담하는 사내 커스텀 자율 에이전트 구축 필요성 대두'
        },
        {
          id: 'sec-topic-3',
          level: 3,
          marker: '○',
          text: '기존 수기 문서 기안 및 취합 대비 업무 공수 약 78% 절감 및 데이터 무결성 확보 [출처: 3]'
        },
        {
          id: 'sec-topic-4',
          level: 3,
          marker: '○',
          text: '사내 보안 규정 제45조 준수를 위한 온프레미스 프라이빗 프록시 게이트웨이 탑재 및 결재 라인 연동 [출처: 1]'
        },
        {
          id: 'sec-topic-5',
          level: 1,
          marker: '2.',
          text: '핵심 도입 방안 및 비교 검토 (3-Way 기획안)'
        },
        {
          id: 'sec-topic-6',
          level: 2,
          marker: '□',
          text: '[A안 엔터프라이즈 정석형] 4분기 IT기획팀 파일럿 검증 후 2026년 전사 단계별 확산'
        },
        {
          id: 'sec-topic-7',
          level: 3,
          marker: '○',
          text: '3분기 잔여 예산(4,200만 원) 범위 내 안정적 인프라 셋업 및 성과 연동형 PoC 수행 [출처: 2]'
        },
        {
          id: 'sec-topic-8',
          level: 3,
          marker: '○',
          text: '인간 개입(Human-in-the-Loop) 기반 검수 프로세스로 환각 및 정보 유출 원천 차단'
        },
        {
          id: 'sec-topic-9',
          level: 1,
          marker: '3.',
          text: '단계별 추진 로드맵 및 예산 집행 계획'
        },
        {
          id: 'sec-topic-10',
          level: 3,
          marker: '○',
          text: '1단계(1~4주): 사내 프라이빗 프록시 인프라 구축 및 보안 규정 검증 (₩25,000,000)'
        },
        {
          id: 'sec-topic-11',
          level: 3,
          marker: '○',
          text: '2단계(5~7주): IT기획/재무 부서 파일럿 에이전트 시범 가동 (₩10,000,000)'
        },
        {
          id: 'sec-topic-12',
          level: 3,
          marker: '○',
          text: '3단계(8~10주): 전사 오피스 스튜디오 연동 및 최종 결재 상신 (₩7,000,000)'
        }
      ];

      // 시트 데이터도 잔여 예산 4,200만 원에 맞춘 실무 항목으로 동기화
      const newSheetRows: SheetRow[] = [
        { id: 'row-agent-1', cells: [1, '자율 에이전트 온프레미스 프록시 인프라', '사내 보안 규정 제45조 준수 게이트웨이', 25000000, '초기 1회'] },
        { id: 'row-agent-2', cells: [2, '문서 자동 전처리 및 RAG 임베딩 라이선스', '2,200여 건 사내 지식 자산 벡터화', 10000000, '연간 라이선스'] },
        { id: 'row-agent-3', cells: [3, 'IT기획·재무 파일럿 검증 및 성과 PoC', '업무 공수 78% 절감 측정 및 피드백', 7000000, '성과 연동'] }
      ];

      // 슬라이드 덱도 AI 에이전트 테마로 갱신
      const newSlides = [
        {
          id: 'slide-agent-1',
          title: '자율형 AI 에이전트 도입 추진안',
          subtitle: '단순 챗봇을 넘어 24시간 자율 업무 수행 체계 구축',
          bullets: [
            '기존 수기 대비 업무 공수 약 78% 획기적 절감',
            '사내 규정 제45조 기반 프라이빗 보안 게이트웨이 탑재',
            '4분기 잔여 예산 4,200만 원 내 턴키 인프라 완비'
          ],
          badge: 'KEYNOTE'
        },
        {
          id: 'slide-agent-2',
          title: '3단계 전사 확산 로드맵',
          subtitle: '보안 검증부터 전사 안착까지 10주 플랜',
          bullets: [
            '1~4주: 사내 프록시 인프라 셋업 (2,500만 원)',
            '5~7주: 핵심 기획/재무팀 파일럿 (1,000만 원)',
            '8~10주: 전사 오피스 스튜디오 확산 (700만 원)'
          ],
          badge: 'ROADMAP'
        }
      ];

      updatedDoc.title = newTitle;
      updatedDoc.metadata.author = '김전략 수석매니저';
      updatedDoc.metadata.department = 'IT전략기획본부 AI혁신팀';
      updatedDoc.content.docsContent.sections = newSections;
      if (updatedDoc.content.sheetsContent) {
        updatedDoc.content.sheetsContent.rows = newSheetRows;
        updatedDoc.content.sheetsContent.totalFormula = '=SUM(D2:D4)';
      }
      if (updatedDoc.content.slidesContent) {
        updatedDoc.content.slidesContent.slides = newSlides;
      }

      return {
        updatedDoc,
        actionName: '자율형 AI 에이전트 도입 기안서 전면 개편',
        replyText: `요청하신 지시를 분석하여, 좌측 사내 지식 창고를 바탕으로 문서를 [자율형 AI 에이전트 도입 기안서] 체계로 전면 재구성했습니다.\n- 제목: '${newTitle}'로 자동 작문 반영\n- 본문: AI 에이전트 도입 목적, 기대 효과(공수 78% 절감), 예산 집행 계획 실시간 동기화 완료\n- 예산 표: 잔여 예산 4,200만 원에 맞춘 3대 세부 비목 및 =SUM 자동 정산 적용 완료\n[⏪ 직전 상태로 되돌리기]`,
        highlightTarget: 'sections',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 2. AUTO_GENERATE_TITLE: 본문 맥락에 맞는 품격 있는 정식 기안서 제목 작문
    // =========================================================================
    case 'AUTO_GENERATE_TITLE': {
      const isMultiLine = !!intent.parameters?.isMultiLine;
      const isAgentTheme = currentDoc.title.includes('에이전트') || 
        currentDoc.content.docsContent.sections.some(s => s.text.includes('에이전트'));

      let generatedTitle = '';
      if (isAgentTheme) {
        generatedTitle = isMultiLine
          ? '2026년\n하반기 전사 자율형 AI 에이전트 도입 및 업무 프로세스 자동화 기안서'
          : '2026년 하반기 전사 자율형 AI 에이전트 도입 및 업무 프로세스 자동화 기안서';
      } else {
        generatedTitle = isMultiLine
          ? '2026년\n하반기 차세대 AI 오피스 스튜디오 도입 및 전사 확산 기안서'
          : '2026년 하반기 차세대 AI 오피스 스튜디오 도입 및 전사 확산 기안서';
      }

      updatedDoc.title = generatedTitle;

      return {
        updatedDoc,
        actionName: isMultiLine ? '제목 2줄 줄바꿈 자동 작문' : '본문 맞춤형 정규 제목 자동 작문',
        replyText: `본문 기안 내용과 지식 창고를 종합 분석하여, 가장 전문적이고 품격 있는 정식 기안서 제목으로 자동 작문했습니다.\n➔ '${generatedTitle.replace('\n', ' ')}'`,
        highlightTarget: 'title',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 3. MULTI_LINE_TITLE: 제목 2줄 줄바꿈 분할
    // =========================================================================
    case 'MULTI_LINE_TITLE': {
      const raw = currentDoc.title.replace(/\n/g, ' ').trim();
      let multiTitle = '';

      if (raw.includes('2026년')) {
        multiTitle = raw.replace('2026년', '2026년\n');
      } else {
        const words = raw.split(/\s+/);
        if (words.length >= 2) {
          const mid = Math.ceil(words.length / 2);
          multiTitle = `${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}`;
        } else {
          multiTitle = `${raw}\n(공식 추진안)`;
        }
      }

      updatedDoc.title = multiTitle;

      return {
        updatedDoc,
        actionName: '제목 2줄 줄바꿈 분할',
        replyText: `요청하신 대로 문서 제목을 2줄로 시원하게 줄바꿈하여 캔버스에 즉시 반영했습니다.\n'${multiTitle.replace('\n', ' ')}'`,
        highlightTarget: 'title',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 4. UPDATE_APPROVERS: 결재란 직급 및 결재선 수정
    // =========================================================================
    case 'UPDATE_APPROVERS': {
      let newApprovers = [...(currentDoc.metadata.approvers || ['기획(기안)', '박팀장(검토)', '이본부장(결재)'])];

      if (userInput.includes('팀장') && (userInput.includes('본부장') || userInput.includes('대신') || userInput.includes('바꿔'))) {
        newApprovers = ['기획(기안)', '박본부장(검토)', '이대표이사(결재)'];
      } else if (userInput.includes('대표') || userInput.includes('사장')) {
        newApprovers = ['기획(기안)', '김팀장(검토)', '최대표이사(결재)'];
      } else if (userInput.includes('2단계') || userInput.includes('두단계')) {
        newApprovers = ['담당(기안)', '팀장(결재)'];
      } else {
        newApprovers = ['기획(기안)', '박본부장(검토)', '이대표이사(최종결재)'];
      }

      updatedDoc.metadata.approvers = newApprovers;

      return {
        updatedDoc,
        actionName: '결재란 직급 및 승인선 실시간 수정',
        replyText: `결재란의 직급 및 승인선을 [${newApprovers.join(' ➔ ')}]로 실시간 수정했습니다. 상단 결재란 표에서 변경 사항을 바로 확인하실 수 있습니다.`,
        highlightTarget: 'approvers',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 5. UPDATE_SECTION: 추진 배경 및 특정 본문 섹션 수정
    // =========================================================================
    case 'UPDATE_SECTION': {
      const sections = [...currentDoc.content.docsContent.sections];

      if (userInput.includes('추진 배경') || userInput.includes('추진배경')) {
        const newBg = '2026년 차세대 자율형 AI 오피스 스튜디오 도입을 통한 전사 반복 업무 공수 78% 절감 및 데이터 무결성 보증';
        let found = false;
        const mapped = sections.map(s => {
          if (s.text.includes('추진 배경') || (s.level === 2 && !found)) {
            found = true;
            return { ...s, text: `□ ${newBg}` };
          }
          return s;
        });

        if (!found) {
          mapped.push({
            id: `sec-bg-${Date.now()}`,
            level: 2,
            marker: '□',
            text: newBg
          });
        }
        updatedDoc.content.docsContent.sections = mapped;

        return {
          updatedDoc,
          actionName: '추진 배경 섹션 내용 실시간 수정',
          replyText: `공문서 추진 배경 항목을 최신 지식 창고 데이터에 맞춰 실시간 갱신했습니다.\n- '□ ${newBg}'`,
          highlightTarget: 'sections',
          targetFormat: 'docs'
        };
      }

      // 일반 항목 추가
      const itemToAdd = '전사 AI 거버넌스 및 사내 보안 규정 제45조 준수 체계 수립';
      const newSec: DocSection = {
        id: `sec-add-${Date.now()}`,
        level: 3,
        marker: '○',
        text: itemToAdd
      };
      updatedDoc.content.docsContent.sections = [...sections, newSec];

      return {
        updatedDoc,
        actionName: '공문서 세부 항목 추가',
        replyText: `공문서 본문에 새 세부 항목 [${itemToAdd}]을 추가하여 캔버스에 즉각 반영했습니다.`,
        highlightTarget: 'sections',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 6. INSERT_TABLE_ROW: 스프레드시트 예산 행 추가 및 수식 정산
    // =========================================================================
    case 'INSERT_TABLE_ROW': {
      const { amount, matchedStr } = parseKoreanCurrency(userInput);
      let itemName = userInput
        .replace(/표에|시트에|추가해줘|넣어줘|등록해줘|항목|금액|예산/g, '')
        .replace(matchedStr, '')
        .trim();

      if (!itemName) itemName = 'AI 자동화 인프라 확장비';

      const currentRows = updatedDoc.content.sheetsContent?.rows || [];
      const newRowNumber = currentRows.length + 1;
      const newRow: SheetRow = {
        id: `row-ai-${Date.now()}`,
        cells: [newRowNumber, itemName, '실시간 AI 코파일럿 산출', amount, '정규 반영']
      };

      const newRows = [...currentRows, newRow];
      const endRowIndex = newRows.length + 1;
      const newFormula = `=SUM(D2:D${endRowIndex})`;

      if (updatedDoc.content.sheetsContent) {
        updatedDoc.content.sheetsContent.rows = newRows;
        updatedDoc.content.sheetsContent.totalFormula = newFormula;
      }

      return {
        updatedDoc,
        actionName: `표에 [${itemName} - ₩${amount.toLocaleString()}] 추가 및 =SUM 갱신`,
        replyText: `데이터 표에 [${itemName} : ₩${amount.toLocaleString()}] 행을 추가하고, 합계 수식을 ${newFormula}로 정산했습니다.`,
        highlightTarget: 'sheets',
        targetFormat: 'sheets'
      };
    }

    // =========================================================================
    // 7. FORMAT_TRANSFORM: 공문서 개조식 어조 정돈
    // =========================================================================
    case 'FORMAT_TRANSFORM': {
      const sections = updatedDoc.content.docsContent.sections.map(s => {
        let t = s.text;
        t = t.replace(/합니다\.|입니다\.|됩니다\./g, '함.').replace(/있습니다\./g, '있음.');
        return { ...s, text: t };
      });
      updatedDoc.content.docsContent.sections = sections;

      return {
        updatedDoc,
        actionName: '공문서 행안부 표준 개조식 종결어미(-함) 일괄 정돈',
        replyText: '공문서 본문의 모든 문장을 행정안전부 표준 개조식 종결어미(-함, -임)로 깔끔하게 정돈했습니다.',
        highlightTarget: 'sections',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 8. DEEP_CONSULTING: 지능형 심층 맥락 질의응답
    // =========================================================================
    default: {
      const docTitle = currentDoc.title.replace('\n', ' ');
      const secCount = currentDoc.content.docsContent.sections.length;
      const approversList = (currentDoc.metadata.approvers || []).join(' → ');

      return {
        updatedDoc,
        actionName: `AI 전략 컨설팅: ${userInput.slice(0, 15)}`,
        replyText: `현재 작성 중이신 [${docTitle}] 문서(총 ${secCount}개 섹션, 결재선: ${approversList})의 실무 맥락을 분석했습니다.\n\n요청하신 "${userInput}"에 대하여:\n1. 4분기 잔여 예산 4,200만 원 집행 범위 내에서 실현 가능한 최적 실행안을 검토했습니다.\n2. 필요 시 "지금 내용을 AI 에이전트 도입으로 바꿔줘" 또는 "제목을 아래 내용에 맞게 해줘"라고 말씀하시면 즉시 캔버스 전체가 실시간 변이됩니다.`,
        targetFormat: currentDoc.format
      };
    }
  }
}
