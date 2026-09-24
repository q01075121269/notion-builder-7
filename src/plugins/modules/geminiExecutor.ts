// src/plugins/modules/geminiExecutor.ts
// Gemini API 직접 통신 및 응답 처리기 (90초 타임아웃 & Co-Thinking 의도 분기 샌드박스)

import type { AIPluginRequest } from '../types';
import type { GeminiConversationResponse } from '../../types/notion';
import { MASTER_SYSTEM_PROMPT } from './geminiPrompts';

export async function executeGeminiCall(req: AIPluginRequest): Promise<GeminiConversationResponse> {
  const apiKey = (req.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '')).trim();
  if (!apiKey) {
    throw new Error("노아(NOA)를 구동하기 위한 Gemini API 키가 없습니다. 우측 상단 [설정]에서 API 키를 먼저 등록해 주세요.");
  }

  const modelParam = req.options?.model || (typeof window !== 'undefined' ? localStorage.getItem('selected_gemini_model') : null) || 'gemini-2.5-flash';
  let targetModel = modelParam.replace(/^models\//, '').trim() || 'gemini-2.5-flash';
  if (targetModel.includes('1.5') || targetModel.includes('1.0')) {
    targetModel = 'gemini-2.5-flash';
  }

  let promptText = `[사용자 요청]: "${req.prompt}"`;
  if (req.currentTemplate) {
    promptText += `\n\n[현재 템플릿 구조]:\n${JSON.stringify(req.currentTemplate, null, 2)}`;
  }

  const parts: any[] = [{ text: promptText }];
  req.attachedFiles?.filter(f => f.category === 'image' && f.base64).forEach(img => {
    parts.push({ inlineData: { mimeType: img.mimeType || 'image/png', data: img.base64 } });
  });

  const body = {
    model: targetModel,
    contents: [{ role: 'user', parts }],
    systemInstruction: { parts: [{ text: MASTER_SYSTEM_PROMPT }] },
    generationConfig: { temperature: 0.7, topP: 0.95 }
  };

  let userEmail = '';
  if (typeof window !== 'undefined') {
    try {
      const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
      userEmail = u.email || '';
    } catch {}
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-gemini-api-key': apiKey,
    ...(userEmail ? { 'x-user-email': userEmail } : {})
  };

  // 실존하는 최신 공식 모델 우선순위 체인 (요청모델 -> 3.8-flash -> 3.5-flash-lite -> 3.1-pro -> 2.5-flash)
  const candidateModels = Array.from(
    new Set([targetModel, 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'])
  );

  let lastErrMessage = '';

  for (const m of candidateModels) {
    // 90초 (90000ms) AbortController 타임아웃 설정으로 연산 지연 시 억울한 시간초과 원천 차단
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      // 1. 프록시 호출 (/api/gemini)
      let res = await fetch(`/api/gemini?model=${m}`, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(body),
        signal: controller.signal
      }).catch(() => null);

      // 2. 직접 호출 (프록시 우회)
      if (!res || !res.ok) {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        }).catch(() => null);
      }

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (rawText) {
          const parsed = parseGeminiOutput(rawText, req.prompt);
          return parsed;
        }
      } else if (res) {
        const errJson: any = await res.json().catch(() => ({}));
        if (errJson?.error) {
          lastErrMessage = typeof errJson.error === 'string' ? errJson.error : errJson.error.message;
        }
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn(`[GeminiExecutor] 모델 '${m}' 시도 실패:`, e);
      lastErrMessage = e.name === 'AbortError' ? '요청 시간이 90초를 초과하여 중단되었습니다.' : e.message;
    }
  }

  throw new Error(lastErrMessage || 'Gemini API 호출에 실패했습니다. 키 유효성 및 네트워크 상태를 확인해 주세요.');
}

/**
 * 명시적 템플릿 생성 키워드 검사 유틸
 */
function isExplicitCreateCommand(prompt: string): boolean {
  const explicitKeywords = ['만들어줘', '생성해줘', '빌드해줘', '만들어 주', '생성해 주', '만들어', '생성해', '작성해줘'];
  return explicitKeywords.some(k => prompt.includes(k));
}

function parseGeminiOutput(rawText: string, userPrompt: string): GeminiConversationResponse {
  const isCreateIntent = isExplicitCreateCommand(userPrompt);

  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    
    // 명시적인 제작 명령이 없는 경우, 일방적인 템플릿 즉시 생성을 금지하고 Co-Thinking 대화형 가이드로 전환
    if ((parsed.mode === 'CREATE_NEW' || parsed.mode === 'PATCH_UPDATE') && !isCreateIntent) {
      const explanation = parsed.explanation || '제안해 드리는 노션 템플릿 구조 기획안입니다.';
      const confirmSuffix = "\n\n위 구성으로 템플릿을 제작할까요? 원하시면 아래 '템플릿 생성하기'를 누르시거나 '만들어줘'라고 말씀해 주세요.";
      return {
        mode: 'CONVERSATION_GUIDE',
        explanation: explanation + confirmSuffix
      };
    }

    if (parsed.mode === 'CREATE_NEW' || parsed.mode === 'PATCH_UPDATE') {
      return parsed;
    }
  } catch {}

  // 일반 대화형 응답 시 확인 트리거 문구가 포함되었는지 검증 및 보완
  let guideText = rawText;
  if (!guideText.includes('템플릿을 제작할까요')) {
    guideText += "\n\n위 구성으로 템플릿을 제작할까요? 원하시면 아래 '템플릿 생성하기'를 누르시거나 '만들어줘'라고 말씀해 주세요.";
  }

  return { mode: 'CONVERSATION_GUIDE', explanation: guideText };
}
