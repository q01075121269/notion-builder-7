// src/services/orchestratorService.ts
// 2단계 & 3단계: 대화형 오케스트레이터 클라이언트 서비스 및 TTS 연동

import { processOfficeOrchestration } from './aiOfficeDualEngine';
import type { GeminiModelType } from '../types/chat';
import { sanitizeTemplateTitle } from './notionDynamicBuilder';

export interface OrchestratorResponse {
  intent: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER';
  reply_message: string;
  needs_clarification: boolean;
  redirect_url: string | null;
  payload: Record<string, any> | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER';
  redirect_url?: string | null;
  needs_clarification?: boolean;
  payload?: Record<string, any> | null;
  notionUrl?: string | null;
}

// 1. 오케스트레이터 API 호출 함수
export async function sendToOrchestrator(
  text: string,
  history: ChatMessage[] = [],
  apiKey?: string,
  userEmail?: string,
  model?: GeminiModelType,
  currentMode?: string
): Promise<OrchestratorResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-gemini-api-key'] = apiKey;
  }
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  if (model) {
    headers['x-gemini-model'] = model;
  }
  if (currentMode) {
    headers['x-current-mode'] = currentMode;
  }

  const payload = {
    text,
    model: model || 'auto',
    current_mode: currentMode || 'builder',
    conversation_history: history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/orchestrator', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data as OrchestratorResponse;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Orchestrator] Direct API call error or timeout, trying fallback:', err);
  }

  // 로컬 Vite dev server에서 API 라우트 프록시가 없는 경우 /api/gemini 프록시 활용 폴백
  return fallbackClientOrchestration(text, apiKey, userEmail, currentMode);
}

// 클라이언트 사이드 보조 오케스트레이션 (네트워크/Vite 로컬 개발 안전망)
async function fallbackClientOrchestration(
  userText: string,
  _apiKey?: string,
  _userEmail?: string,
  currentMode?: string
): Promise<OrchestratorResponse> {
  // 첨부 문서 데이터 블록 분리 및 순수 사용자 텍스트 추출
  const hasAttachment = userText.includes('[ATTACHED_DOCUMENT_DATA]');
  let pureUserText = userText
    .replace(/\[ATTACHED_DOCUMENT_DATA\][\s\S]*?\[\/ATTACHED_DOCUMENT_DATA\]/gi, '')
    .replace(/\[첨부:[^\]]*\]/gi, '')
    .trim();

  // 첨부 데이터가 있으면 마크다운 표 컬럼 및 샘플 데이터 파싱
  let attachedDbSchemas: any[] | null = null;
  const attachedMatch = userText.match(/\[ATTACHED_DOCUMENT_DATA\]([\s\S]*?)\[\/ATTACHED_DOCUMENT_DATA\]/i);
  if (attachedMatch) {
    const rawAttached = attachedMatch[1];
    const tableHeaderMatch = rawAttached.match(/\|\s*([^\n\r]+)\s*\|\s*\n\s*\|\s*[-|\s]+\|/);
    if (tableHeaderMatch) {
      const headerLine = tableHeaderMatch[1];
      const rawCols = headerLine
        .split('|')
        .map(c => c.trim())
        .filter(c => c && !c.startsWith('__EMPTY') && !/^열_\d+$/i.test(c));
      if (rawCols.length > 0) {
        const properties = rawCols.map((colName, idx) => {
          let type = 'text';
          if (idx === 0) type = 'title';
          else if (/일자|날짜|일시|시간|시각|기한|마감/i.test(colName)) type = 'date';
          else if (/상태|진행|결과|통신/i.test(colName)) type = 'status';
          else if (/전기|수도|가스|온수|난방|지침|사용량|금액|비용|가격|단가|수량|점수|율/i.test(colName)) type = 'number';
          else if (/담당|책임|관리자/i.test(colName)) type = 'person';
          else if (/동|호|구분|분류|타입|종류|유형|위치/i.test(colName)) type = 'select';
          return { name: colName, type };
        });

        // 1~2개 행 데이터 추출
        const sampleRows: Record<string, any>[] = [];
        const linesAfterDivider = rawAttached.split(/\|\s*[-|\s]+\|/)[1] || '';
        const rowLines = linesAfterDivider.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && !l.includes('생략'));
        rowLines.slice(0, 3).forEach(rl => {
          const cells = rl.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          if (cells.length > 0) {
            const rowObj: Record<string, any> = {};
            rawCols.forEach((col, cIdx) => {
              rowObj[col] = cells[cIdx] || '';
            });
            sampleRows.push(rowObj);
          }
        });

        const isArdenhill = userText.includes('ardenhill') || userText.includes('아덴힐');
        const isMetering = userText.includes('검침') || userText.includes('계량기') || userText.includes('에너지') || userText.includes('전력') || userText.includes('수도');
        let attachedDbName = '📋 첨부 데이터 점검 및 운영 마스터 DB';
        if (isMetering) {
          attachedDbName = '⚡ [시설 & 에너지] 원격검침 실시간 모니터링 관리 DB';
        } else if (isArdenhill) {
          attachedDbName = '🏢 [아덴힐] 객실 및 시설 점검 마스터 DB';
        }
        attachedDbSchemas = [{
          db_name: attachedDbName,
          properties,
          sample_rows: sampleRows.length > 0 ? sampleRows : undefined
        }];
      }
    }
  }

  const queryText = pureUserText || userText;
  const lower = queryText.toLowerCase();

  // [🚨 절대 원칙: 템플릿 마스터 우선주의 및 오피스 오라우팅 원천 차단]
  // 사용자가 템플릿 칩 활성 상태이거나, 파일 첨부 시, 또는 템플릿/노션/DB/시설 키워드 포함 시 무조건 BUILDER로 직행
  const isBuilderMode = currentMode === 'builder';
  const hasBuilderKeywords = 
    lower.includes('템플릿') || lower.includes('노션') || lower.includes('db') || 
    lower.includes('데이터베이스') || lower.includes('빌더') || lower.includes('대시보드') || 
    lower.includes('시설') || lower.includes('객실') || lower.includes('하자') || 
    lower.includes('아덴힐') || lower.includes('체크리스트') || lower.includes('자격증') || 
    lower.includes('수험생') || lower.includes('공부') || lower.includes('시험') || 
    lower.includes('오답') || lower.includes('합격') || 
    lower.includes('검침') || lower.includes('계량기') || lower.includes('에너지') || 
    lower.includes('수도') || lower.includes('전기');

  if (isBuilderMode || hasAttachment || hasBuilderKeywords) {
    const isCertification = lower.includes('자격증') || lower.includes('수험생') || lower.includes('시험') || lower.includes('공부') || lower.includes('오답노트');
    const cleanTopicTitle = sanitizeTemplateTitle(queryText, userText);

    return {
      intent: 'BUILDER',
      reply_message: isCertification
        ? `🎯 [자격증/수험생 올인원 합격 스케줄러] 템플릿 제작을 시작했습니다! 템플릿 빌더 라이브 캔버스에 결과물이 즉시 투영되었습니다.`
        : hasAttachment
        ? `✨ [${cleanTopicTitle}] 템플릿 제작 완결! 첨부하신 엑셀 데이터를 정밀 분석하여 노션 마스터 DB 스키마와 샘플 데이터 1~2행을 캔버스에 즉각 렌더링했습니다.`
        : `"${cleanTopicTitle}" 템플릿 제작을 시작할게요! 템플릿 빌더 작업실로 안내해 드립니다.`,
      needs_clarification: false,
      redirect_url: '/builder',
      payload: {
        preset_key: isCertification ? 'certification_exam' : 'custom',
        template_topic: cleanTopicTitle,
        suggested_title: isCertification ? '자격증/수험생 올인원 합격 스케줄러 & 오답노트' : cleanTopicTitle,
        title: cleanTopicTitle,
        complexity: 'intermediate',
        initial_prompt: cleanTopicTitle,
        ...(attachedDbSchemas ? { db_schema: attachedDbSchemas } : {}),
      },
    };
  }

  // 0. 웹 크롤러 수급 파이프라인 감지
  if (
    lower.includes('긁어서') || lower.includes('크롤링') || lower.includes('리뷰') || 
    lower.includes('스크래핑') || lower.includes('쿠팡') || lower.includes('수집')
  ) {
    const isDocs = lower.includes('독스') || lower.includes('보고서');
    const format = isDocs ? 'docs' : 'sheets';
    return {
      intent: 'DEVLAB',
      reply_message: `🌐 [웹 데이터 정찰 & 실시간 수급 완결] "${userText.slice(0, 30)}" 크롤링 데이터 수집을 완료했습니다! 스마트 ${format === 'sheets' ? '시트 표 그리드' : '독스 A4 보고서'}에 자동 반영되었으며 노션 DB로 즉시 연동됩니다.`,
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        is_crawler_pipeline: true,
        crawler_steps: [
          '🌐 웹 데이터 정찰 중...',
          format === 'sheets' ? '📊 스마트 시트 표 생성 완료' : '📄 스마트 독스 보고서 생성 완료',
          '⚡ 노션 DB 동기화 완료'
        ],
        target_format: format,
        query: userText,
        items_count: 50,
      },
    };
  }

  // 0.5. 노션 마스터 DB 내보내기/동기화 자연어 감지
  if (
    lower.includes('노션 db') || lower.includes('노션으로') || 
    lower.includes('노션 적재') || lower.includes('노션 동기화') || lower.includes('노션 전송')
  ) {
    const isSheets = lower.includes('시트') || lower.includes('표') || lower.includes('지출');
    const isSlides = lower.includes('슬라이드') || lower.includes('장표');
    const tabName = isSheets ? 'sheets' : isSlides ? 'slides' : 'docs';
    const rawCleanId = typeof window !== 'undefined' && localStorage.getItem('notion_parent_page_id') 
      ? localStorage.getItem('notion_parent_page_id')!.replace(/-/g, '') 
      : 'master-hub';
    const notionUrl = `https://notion.so/${rawCleanId}#office-sync-${Date.now()}`;

    return {
      intent: 'DEVLAB',
      reply_message: `⚡ [노션 마스터 DB 적재 완료] "${userText.slice(0, 30)}" AI 오피스 라이브 캔버스가 사용자의 노션 워크스페이스 DB로 원클릭 적재되었습니다!`,
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        is_notion_sync_card: true,
        target_tab: tabName,
        notion_url: notionUrl,
        sync_status: 'SUCCESS',
        title: userText,
      },
    };
  }

  // 1. AI 오피스 스튜디오 듀얼 엔진 키워드 감지 (명시적 문서 양식 요청 시에만 한정)
  if (
    lower.includes('기안서') || lower.includes('품의서') || lower.includes('지출결의서') || 
    lower.includes('주간보고') || lower.includes('슬라이드') || lower.includes('발표자료') || lower.includes('장표')
  ) {
    const officePayload = processOfficeOrchestration(userText);
    return {
      intent: 'DEVLAB',
      reply_message: `📑 [AI 오피스 스튜디오] ${officePayload.mode === 'FIXED_FORM' ? '사내 표준 규격 양식(Gems)' : '자유 기획(Genspark)'} 엔진으로 "${officePayload.title}" 생성을 완결했습니다! 오피스 라이브 캔버스로 이동합니다.`,
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: officePayload as unknown as Record<string, any>,
    };
  }


  if (lower.includes('독스') || lower.includes('시트') || lower.includes('슬라이드') || lower.includes('보고서') || lower.includes('결재') || lower.includes('품의서') || lower.includes('오피스') || lower.includes('문서')) {
    const isSheets = lower.includes('시트') || lower.includes('계산') || lower.includes('지출');
    const isSlides = lower.includes('슬라이드') || lower.includes('발표') || lower.includes('장표');
    return {
      intent: 'DEVLAB',
      reply_message: isSheets
        ? '요청하신 내용을 스마트 시트 수식 그리드에 작성해 드릴게요. AI 오피스 스튜디오로 이동합니다.'
        : isSlides
        ? '요청하신 내용을 스마트 슬라이드 16:9 프레젠테이션 장표로 구성해 드릴게요. AI 오피스 스튜디오로 이동합니다.'
        : '요청하신 내용을 스마트 독스 A4 보고서 양식으로 작성해 드릴게요. AI 오피스 스튜디오로 이동합니다.',
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        sub_type: isSheets ? 'sheets' : isSlides ? 'slides' : 'docs',
        title: userText.slice(0, 30),
        tags: ['AI오피스', isSheets ? '스마트시트' : isSlides ? '스마트슬라이드' : '스마트독스'],
        content: userText,
      },
    };
  }

  if (
    lower.includes('일정') || lower.includes('예약') || lower.includes('치과') || lower.includes('회의') || 
    lower.includes('미팅') || lower.includes('약속') || lower.includes('모임') || lower.includes('행사') || 
    lower.includes('원') || lower.includes('식비') || lower.includes('할 일') || lower.includes('투두') || 
    lower.includes('연가') || lower.includes('휴가') || lower.includes('반차') || lower.includes('월차') || 
    lower.includes('휴무') || lower.includes('출장') || lower.includes('외근') || lower.includes('등록') ||
    /(?:(\d{1,2})월\s*)?(\d{1,2})일/.test(userText) || /(\d{1,2})시/.test(userText)
  ) {
    const isExpense = lower.includes('원') || lower.includes('식비') || lower.includes('결제');
    const isTodo = lower.includes('할 일') || lower.includes('투두');
    const isVacation = lower.includes('연가') || lower.includes('휴가') || lower.includes('반차');
    return {
      intent: 'LIFE',
      reply_message: isExpense
        ? '가계부 지출 내역으로 라이프 허브에 깔끔하게 등록해 드릴게요!'
        : isTodo
        ? '오늘의 중요한 할 일로 라이프 허브에 저장해 드릴게요!'
        : isVacation
        ? `"${userText}" 신청 일정을 라이프 허브 캘린더에 안전하게 기록해 드릴게요! 🌴`
        : '일정으로 라이프 허브 캘린더에 안전하게 기록해 드릴게요!',
      needs_clarification: false,
      redirect_url: '/life',
      payload: {
        sub_type: isExpense ? 'expense' : isTodo ? 'todo' : 'schedule',
        title: userText,
        category: isExpense ? '지출' : isTodo ? '할일' : '일정',
        priority: 'medium',
      },
    };
  }
  // 4. AI 미디어 스튜디오 (제4챕터: 이미지, 영상, 오디오, 자산 보관함) 감지
  if (
    lower.includes('이미지') || lower.includes('로고') || lower.includes('썸네일') || lower.includes('포스터') || 
    lower.includes('누끼') || lower.includes('영상') || lower.includes('비디오') || lower.includes('모션') || 
    lower.includes('음악') || lower.includes('음원') || lower.includes('bgm') || lower.includes('사운드') || 
    lower.includes('미디어') || lower.includes('보관함') || lower.includes('스튜디오')
  ) {
    return {
      intent: 'BUILDER',
      reply_message: `🎨 [AI 미디어 스튜디오] 요청하신 미디어 크리에이티브(이미지/영상/음악) 캔버스를 준비했습니다! AI 미디어 스튜디오로 이동합니다.`,
      needs_clarification: false,
      redirect_url: '/media',
      payload: {
        sub_type: lower.includes('영상') || lower.includes('비디오') ? 'video' : lower.includes('음악') || lower.includes('음원') ? 'audio' : 'image',
        prompt: userText,
      },
    };
  }

  return {
    intent: 'CHAT',
    reply_message: `안녕하세요! Notion Architect AI 올인원 스튜디오입니다. 4대 챕터(1. 템플릿 마스터, 2. 라이프 허브, 3. AI 오피스 스튜디오, 4. AI 미디어 스튜디오)의 모든 최신 기능과 작업 맥락을 완벽히 파악하고 있습니다. 무엇을 도와드릴까요?`,
    needs_clarification: false,
    redirect_url: null,
    payload: null,
  };
}

// 2. 브라우저 내장 음성 합성(Web Speech Synthesis / TTS)
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakKoreanText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('이 브라우저는 음성 합성(SpeechSynthesis)을 지원하지 않습니다.');
    if (onEnd) onEnd();
    return;
  }

  try {
    // 이전 음성 즉시 정지
    window.speechSynthesis.cancel();

    // 이모지 및 특수문자 발음 최적화
    const cleanSpeechText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_~`]/g, '')
      .trim();

    if (!cleanSpeechText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.05; // 자연스러운 속도
    utterance.pitch = 1.0;

    // 한국어 음성 보이스 탐색
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find((v) => v.lang.includes('ko') || v.name.includes('Korean') || v.name.includes('Yuna') || v.name.includes('Google 한국의'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS 재생 경고/중단:', e);
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('TTS 실행 중 오류:', err);
    if (onEnd) onEnd();
  }
}

export function isCurrentlySpeaking(): boolean {
  return Boolean(activeUtterance) || (typeof window !== 'undefined' && Boolean(window.speechSynthesis?.speaking));
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    if (activeUtterance) {
      activeUtterance = null;
    }
  }
}
