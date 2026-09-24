// src/services/orchestratorService.ts
// 2단계 & 3단계: 대화형 오케스트레이터 클라이언트 서비스 및 TTS 연동

import type { GeminiModelType } from '../types/chat';
import type { FileContextItem } from '../types/fileAttachment';

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

export interface AttachedImageData {
  mimeType: string;
  data: string; // Base64 문자열
  name?: string;
}

// 1. 오케스트레이터 API 호출 함수
export async function sendToOrchestrator(
  text: string,
  history: ChatMessage[] = [],
  apiKey?: string,
  userEmail?: string,
  model?: GeminiModelType,
  currentMode?: string,
  fileContextList?: FileContextItem[],
  thinking?: boolean,
  images?: AttachedImageData[],
  currentTemplate?: any
): Promise<OrchestratorResponse> {
  const geminiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '');
  const notionKey = typeof window !== 'undefined' ? localStorage.getItem('notion_api_key') || '' : '';
  const isThinking = thinking !== undefined 
    ? thinking 
    : (typeof window !== 'undefined' ? localStorage.getItem('gemini_thinking_enabled') === 'true' : false);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-gemini-api-key': geminiKey,
    'x-notion-api-key': notionKey,
  };

  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  if (model) {
    headers['x-gemini-model'] = model;
  }
  if (currentMode) {
    headers['x-current-mode'] = currentMode;
  }

  // 다중 첨부 파일(fileContextList) 페이로드 명확히 조립 (최우선 context 주입)
  let enrichedText = text;
  if (fileContextList && fileContextList.length > 0) {
    const multiFileBlocks = fileContextList.map(fc => {
      let contentStr = fc.textContent || fc.parsedContent || '';
      if (fc.sheets && fc.sheets.length > 0) {
        contentStr += '\n' + fc.sheets.map(s => s.markdownTable).join('\n\n');
      }
      return `사용자가 첨부한 문서 원본 내용:\n[ATTACHED_DOCUMENT_DATA]\n파일명: ${fc.fileName}\n확장자: ${fc.extension}\n카테고리: ${fc.category}\n본문 텍스트:\n${contentStr}\n[/ATTACHED_DOCUMENT_DATA]`;
    }).join('\n\n');
    
    if (!enrichedText.includes('[ATTACHED_DOCUMENT_DATA]')) {
      enrichedText = `${multiFileBlocks}\n\n${text}`;
    }
  }

  const firstImageBase64 = images && images.length > 0 ? images[0].data : null;
  const payload = {
    prompt: enrichedText,
    text: enrichedText,
    image: firstImageBase64,
    images: images || [],
    currentTemplate: currentTemplate || null,
    current_template: currentTemplate || null,
    model: model || 'gemini-2.5-flash',
    thinking: isThinking,
    current_mode: currentMode || 'builder',
    file_context_list: fileContextList,
    conversation_history: history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  let response: Response | null = null;
  try {
    response = await fetch('/api/orchestrator', {
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
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    console.warn('[Orchestrator] /api/orchestrator request failed, engaging direct Gemini vision pipeline:', fetchErr?.message);
  }

  // 404 Not Found 또는 서버리스 라우트 단절 시: 브라우저 직접 Gemini Vision 파이프로 자동 전환 (Failover)
  console.info('[Orchestrator] Activating resilient direct Gemini Vision pipeline (HTTP: ' + (response?.status || 'offline') + ')');
  return await callDirectGeminiVisionOrchestrator(payload, geminiKey);
}

// 1-1. 클라이언트 직접 Gemini Vision 멀티모달 파이프라인 (404 방어용 고가용성 엔진)
async function callDirectGeminiVisionOrchestrator(
  payload: any,
  apiKey: string
): Promise<OrchestratorResponse> {
  const reqModel = payload.model || 'gemini-2.5-flash';
  const candidateModels = Array.from(
    new Set([reqModel.replace(/^models\//, '').trim(), 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro'])
  );

  const systemPrompt = `당신은 올인원 지능형 워크스페이스(노션 빌더)의 "수석 대화형 AI 오케스트레이터"입니다.
사용자의 지시사항, 화면 캡처 이미지(Vision), 첨부 문서를 정밀 분석하여 노션 템플릿 스키마를 갱신하고 결과를 순수 JSON으로 반환하십시오.

[응답 JSON 규격]
{
  "intent": "BUILDER" | "CHAT" | "LIFE" | "DEVLAB",
  "reply_message": "사용자에게 전달할 명확하고 친절한 설명 (한국어 구어체)",
  "needs_clarification": false,
  "redirect_url": null,
  "payload": {
    "template_topic": "템플릿 주제",
    "suggested_title": "노션 페이지 제목",
    "db_schema": [
      {
        "name": "DB 이름",
        "icon": "📋",
        "description": "DB 설명",
        "properties": [
          { "id": "prop-1", "name": "이름", "type": "title" },
          { "id": "prop-2", "name": "상태", "type": "status" }
        ],
        "sample_rows": []
      }
    ],
    "formulas": [],
    "value_add": []
  }
}

[핵심 규칙 - Vision 시각 분석 및 캔버스 스키마 수정]
1. 사용자가 화면 캡처, 표 이미지 등을 첨부했거나 캔버스 스키마 수정을 요청한 경우:
   - "intent": "BUILDER"로 설정하고, 현재 캔버스 템플릿의 databases 스키마를 정밀 분석하여 사용자가 의도한 수정사항(아이콘 변경, 컬럼 추가/삭제, 명칭/타입 변경, 수식 보정 등)을 완벽히 반영한 갱신된 "db_schema"를 payload에 반드시 포함하십시오.
2. 사용자가 "타임라인(간트 차트)" 등 노션 API 외부 생성이 제한된 뷰를 요청한 경우:
   - 절대로 오류를 반환하거나 거절하지 마십시오!
   - 데이터베이스 스키마에 "일정(date)", "기간(date)", "진행 상태(status)" 속성을 100% 무손실 설계하십시오.
   - reply_message에 다음과 같이 정중하고 당당하게 대안을 안내하십시오:
     "웹 프로그램 캔버스에서는 타임라인 뷰를 즉시 추가·확인하실 수 있으며, 노션으로 내보낼 때는 일정/상태 속성이 100% 무손실 저장되고 상단에 '1초 만에 타임라인 뷰를 켜는 가이드'가 동봉됩니다."
3. 일반 대화인 경우:
   - "intent": "CHAT", "reply_message": "답변", "payload": null 로 응답하십시오.`;

  // 멀티모달 parts 조립
  const userParts: any[] = [];
  const rawImages = payload.images || (payload.image ? [{ mimeType: 'image/png', data: payload.image }] : []);
  for (const img of rawImages) {
    if (img && img.data) {
      userParts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: img.data.replace(/^data:image\/[^;]+;base64,/, '')
        }
      });
    }
  }

  let enrichedPrompt = payload.prompt || payload.text || '';
  const curT = payload.currentTemplate || payload.current_template;
  if (curT) {
    enrichedPrompt = `[CURRENT_CANVAS_TEMPLATE_CONTEXT]\n제목: ${curT.title}\nDB목록:\n${JSON.stringify(curT.databases?.map((d: any) => ({ name: d.name, properties: d.properties })) || [], null, 2)}\n[/CURRENT_CANVAS_TEMPLATE_CONTEXT]\n\n${enrichedPrompt}`;
  }
  userParts.push({ text: enrichedPrompt || '현재 캔버스 스키마를 분석하고 최적화해줘.' });

  const contents: any[] = [];
  if (Array.isArray(payload.conversation_history) && payload.conversation_history.length > 0) {
    payload.conversation_history.slice(-4).forEach((h: any) => {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    });
  }
  contents.push({ role: 'user', parts: userParts });

  const requestBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  };

  let lastErr = null;
  for (const m of candidateModels) {
    try {
      // 1. /api/gemini 프록시 먼저 시도
      let gRes = await fetch(`/api/gemini?model=${m}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      // 2. 만약 프록시 실패 시 Google Generative Language API 직접 호출
      if (!gRes.ok && apiKey) {
        gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      }

      if (!gRes.ok) {
        const errText = await gRes.text();
        lastErr = new Error(`Gemini ${m} failed (${gRes.status}): ${errText}`);
        continue;
      }

      const data = await gRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        intent: parsed.intent || 'BUILDER',
        reply_message: parsed.reply_message || '스키마 분석 및 수정이 완료되었습니다.',
        needs_clarification: Boolean(parsed.needs_clarification),
        redirect_url: parsed.redirect_url || null,
        payload: parsed.payload || null
      };
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }

  throw new Error(`Gemini 직접 호출 실패: ${lastErr?.message || '모든 모델 응답 없음'}`);
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
