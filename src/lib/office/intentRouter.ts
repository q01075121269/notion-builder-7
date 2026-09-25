// src/lib/office/intentRouter.ts
// Jev형 지능형 의도 분류기(Intent Classifier) 및 Gemini 실무 공문서 작문 엔진

import type { OfficeDocument, OfficeSource, SheetRow } from '../../types/office';
import { generateDocumentRewrite, type CopilotGenerationResult } from '../../services/officeCopilotService';

export type OfficeIntentType =
  | 'REWRITE_DOCUMENT_TOPIC' // 특정 주제로 문서 전체 개편 (예: 스마트 시설 유지 관리, AI 에이전트 도입)
  | 'AUTO_GENERATE_TITLE'    // 본문 내용에 부합하는 전문적이고 타당한 정규 제목 자동 작문
  | 'MULTI_LINE_TITLE'       // 제목 줄바꿈(엔터/Multi-line) 적용
  | 'UPDATE_SECTION'         // 추진 배경, 도입 방안, 세부 항목 등 본문 수정
  | 'UPDATE_APPROVERS'       // 결재선(기안/검토/결재) 또는 기안자/부서 메타데이터 변경
  | 'INSERT_TABLE_ROW'       // 데이터 표(시트)에 새 행 추가 및 =SUM 수식 정산
  | 'FORMAT_TRANSFORM'       // 개조식 종결어미(-함, -임) 일괄 정돈 또는 포맷 변환
  | 'DEEP_CONSULTING';       // 심층 맥락 질문 및 기획안 고도화 자문

export interface ClassifiedIntent {
  type: OfficeIntentType;
  extractedTopic?: string;
  targetSection?: string;
  reasoning: string;
}

export type IntentExecutionResult = CopilotGenerationResult;

// 금액 파서 헬퍼: "120만 원", "50만원", "1500000원", "150만" 등 숫자로 변환
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

  return { amount: 15000000, matchedStr: '' };
};

// 1. Jev형 정밀 의도 분류기 (Intent Classifier)
export function classifyOfficeIntent(
  rawPrompt: string,
  _currentDoc: OfficeDocument
): ClassifiedIntent {
  const text = rawPrompt.trim();

  // A. 제목 관련 메타 지시 분석 (단순 문자열 취득이 아닌 '의도' 판별)
  const isAutoTitleKeywords = [
    '아래 내용에 맞게', '내용에 맞게', '적당하게', '적당한 제목', '어울리는 제목',
    '제목 추천', '제목 알아서', '제목 지어줘', '제목 자동 생성', '제목 정해줘',
    '제목 다시 지어', '제목 뽑아줘', '제목 변경해줘 내용에'
  ];
  const hasAutoTitleIntent = isAutoTitleKeywords.some(kw => text.includes(kw));

  // B. 특정 주제로 문서 전면 개편 지시 분석 (예: 스마트 시설 유지 관리, AI 에이전트 등)
  const isRewriteTopicKeywords = [
    '내용으로 바꿔', '내용으로 변경', '주제로 바꿔', '주제로 변경', '내용 바꿔',
    '내용 전면 개편', '내용으로 작성해', '스마트 시설', '유지 관리', '시설 관리',
    '에이전트 내용', '에이전트 도입', '기안으로 바꿔', '제안서로 바꿔', '보고서로 바꿔',
    '내용으로 해줘', '주제로 해줘'
  ];
  const hasRewriteTopicIntent = isRewriteTopicKeywords.some(kw => text.includes(kw));

  // 우선순위 1: 문서 전면 개편 지시 (스마트 시설 유지 관리, AI 에이전트 등)
  if (hasRewriteTopicIntent) {
    return {
      type: 'REWRITE_DOCUMENT_TOPIC',
      reasoning: '새로운 업무 주제를 바탕으로 기안서 제목과 본문 섹션 전체를 전면 재작성하는 지시'
    };
  }

  // 우선순위 2: 본문 맥락 기반 자동 제목 작문
  if (hasAutoTitleIntent) {
    return {
      type: 'AUTO_GENERATE_TITLE',
      reasoning: '본문 내용 및 사내 지식 소스를 심층 분석하여 최적의 공식 기안서 제목 자동 작문 요청'
    };
  }

  // C. 제목 줄바꿈 적용
  if (
    (text.includes('제목') && (text.includes('줄바꿈') || text.includes('2줄') || text.includes('두 줄') || text.includes('엔터'))) ||
    text.includes('\n')
  ) {
    return {
      type: 'MULTI_LINE_TITLE',
      reasoning: '가독성을 높이기 위한 다중 라인(Multi-line) 제목 줄바꿈 적용'
    };
  }

  // D. 표/시트 행 추가 및 수식 계산 지시
  if (
    (text.includes('표') || text.includes('시트') || text.includes('행') || text.includes('비용') || text.includes('예산')) &&
    (text.includes('추가') || text.includes('넣어') || text.includes('등록') || text.includes('반영')) &&
    (text.includes('만') || text.includes('원') || /\d+/.test(text))
  ) {
    return {
      type: 'INSERT_TABLE_ROW',
      reasoning: '스프레드시트 예산 비목 추가 및 =SUM 수식 자동 정산 지시'
    };
  }

  // E. 결재선 / 작성자 변경
  if (
    text.includes('결재선') || text.includes('결재자') || text.includes('기안자') ||
    text.includes('담당자') || text.includes('부서') || text.includes('이사님') ||
    text.includes('팀장님') || text.includes('본부장')
  ) {
    return {
      type: 'UPDATE_APPROVERS',
      reasoning: '공문서 결재선 및 기안 메타데이터 수정 지시'
    };
  }

  // F. 본문 특정 섹션 수정
  if (
    text.includes('배경') || text.includes('목적') || text.includes('방안') ||
    text.includes('섹션') || text.includes('항목') || text.includes('추진') ||
    text.includes('수정') || text.includes('보강') || text.includes('고쳐')
  ) {
    return {
      type: 'UPDATE_SECTION',
      reasoning: '공문서 특정 섹션 내용 수정 및 세부 조항 보강'
    };
  }

  // G. 표준 개조식(-함, -임) 종결어미 정돈
  if (
    text.includes('개조식') || text.includes('종결어미') || text.includes('말투') ||
    text.includes('정돈') || text.includes('어조') || text.includes('공문서체')
  ) {
    return {
      type: 'FORMAT_TRANSFORM',
      reasoning: '행정안전부 공문서 규격 개조식(-함, -임) 어조 일괄 정돈'
    };
  }

  // 기본: 심층 맥락 컨설팅 및 기획안 생성
  return {
    type: 'DEEP_CONSULTING',
    reasoning: '자연어 질의 및 기획안 고도화 요청'
  };
}

// 2. 실무급 Gemini 심층 작문 및 지식 창고 기반 인플레이스 변이 실행
export async function executeOfficeIntent(
  intent: ClassifiedIntent,
  userInput: string,
  currentDoc: OfficeDocument,
  sources: OfficeSource[] = []
): Promise<IntentExecutionResult> {
  const updatedDoc: OfficeDocument = JSON.parse(JSON.stringify(currentDoc));

  switch (intent.type) {
    // =========================================================================
    // 1. REWRITE_DOCUMENT_TOPIC & AUTO_GENERATE_TITLE: 실제 Gemini API 연동 재작문
    // =========================================================================
    case 'REWRITE_DOCUMENT_TOPIC':
    case 'AUTO_GENERATE_TITLE': {
      return await generateDocumentRewrite(userInput, currentDoc, sources);
    }

    // =========================================================================
    // 2. MULTI_LINE_TITLE: 제목 줄바꿈(Multi-line) 가독성 서식 적용
    // =========================================================================
    case 'MULTI_LINE_TITLE': {
      let baseTitle = currentDoc.title.replace(/\n/g, ' ').trim();
      let multiLineTitle = baseTitle;

      if (baseTitle.includes('도입 및')) {
        multiLineTitle = baseTitle.replace('도입 및', '도입 및\n');
      } else if (baseTitle.includes('솔루션')) {
        multiLineTitle = baseTitle.replace('솔루션', '솔루션\n');
      } else if (baseTitle.includes('기안서')) {
        multiLineTitle = baseTitle.replace('기안서', '\n기안서');
      } else {
        const words = baseTitle.split(' ');
        if (words.length >= 4) {
          const mid = Math.ceil(words.length / 2);
          multiLineTitle = words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
        }
      }

      updatedDoc.title = multiLineTitle;
      return {
        updatedDoc,
        actionName: '공문서 제목 줄바꿈 서식 적용',
        replyText: `제목을 가독성 높은 다중 라인으로 서식화했습니다:\n"${multiLineTitle.replace('\n', ' ↵ ')}"`,
        highlightTarget: 'title',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 3. UPDATE_APPROVERS: 결재선 및 메타데이터 수정
    // =========================================================================
    case 'UPDATE_APPROVERS': {
      const currentApprovers = [...(currentDoc.metadata.approvers || ['기안자(기안)', '팀장(검토)', '본부장(결재)'])];

      if (userInput.includes('이사') && !currentApprovers.some(a => a.includes('이사'))) {
        currentApprovers.push('최이사(최종승인)');
      }
      if (userInput.includes('대표') && !currentApprovers.some(a => a.includes('대표'))) {
        currentApprovers.push('대표이사(승인)');
      }

      updatedDoc.metadata.approvers = currentApprovers;

      return {
        updatedDoc,
        actionName: '결재선 메타데이터 갱신',
        replyText: `결재 라인을 [${currentApprovers.join(' → ')}] 체계로 갱신하여 캔버스 상단 결재란에 동기화했습니다.`,
        highlightTarget: 'metadata',
        targetFormat: 'docs'
      };
    }

    // =========================================================================
    // 4. UPDATE_SECTION: 본문 섹션 실시간 Gemini 재작문 및 수정
    // =========================================================================
    case 'UPDATE_SECTION': {
      return await generateDocumentRewrite(userInput, currentDoc, sources);
    }

    // =========================================================================
    // 5. INSERT_TABLE_ROW: 스프레드시트 예산 행 추가 및 수식 정산
    // =========================================================================
    case 'INSERT_TABLE_ROW': {
      const { amount, matchedStr } = parseKoreanCurrency(userInput);
      let itemName = userInput
        .replace(/표에|시트에|추가해줘|넣어줘|등록해줘|항목|금액|예산/g, '')
        .replace(matchedStr, '')
        .trim();

      if (!itemName) itemName = '솔루션 유지관리 및 인프라 비용';

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
    // 6. FORMAT_TRANSFORM: 공문서 개조식 어조 정돈
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
    // 7. DEEP_CONSULTING: 실제 Gemini 지능형 재작문 및 자문
    // =========================================================================
    default: {
      return await generateDocumentRewrite(userInput, currentDoc, sources);
    }
  }
}
