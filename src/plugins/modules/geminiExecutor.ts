// src/plugins/modules/geminiExecutor.ts
// Gemini API 직접 통신 및 응답 처리기 (65줄 최적화)

import type { AIPluginRequest } from '../types';
import type { GeminiConversationResponse } from '../../types/notion';
import { MASTER_SYSTEM_PROMPT } from './geminiPrompts';
import { generateLocalFallbackResponse } from '../../services/localTemplateFallback';

export async function executeGeminiCall(req: AIPluginRequest): Promise<GeminiConversationResponse> {
  const apiKey = (req.apiKey || '').trim();
  const model = req.options?.model || 'gemini-2.5-flash';
  const targetModel = model.replace(/^models\//, '').trim();

  let promptText = `[사용자 요청]: "${req.prompt}"`;
  if (req.currentTemplate) {
    promptText += `\n\n[현재 템플릿 구조]:\n${JSON.stringify(req.currentTemplate, null, 2)}`;
  }

  const parts: any[] = [{ text: promptText }];
  req.attachedFiles?.filter(f => f.category === 'image' && f.base64).forEach(img => {
    parts.push({ inlineData: { mimeType: img.mimeType || 'image/png', data: img.base64 } });
  });

  const body = {
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

  // 실존하는 안정적인 공식 모델 우선순위 체인 (요청모델 -> 2.5-flash -> 2.0-flash -> 1.5-flash -> 1.5-pro)
  const candidateModels = Array.from(
    new Set([targetModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])
  );

  for (const m of candidateModels) {
    try {
      // 1. 프록시 호출 (/api/gemini)
      let res = await fetch(`/api/gemini?model=${m}`, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(body)
      }).catch(() => null);

      // 2. 직접 호출 (프록시 우회)
      if (!res || !res.ok) {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (rawText) {
          const parsed = parseGeminiOutput(rawText);
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[GeminiExecutor] 모델 '${m}' 시도 실패:`, e);
    }
  }

  console.warn('[GeminiExecutor] 모든 Gemini 모델 통신 실패 -> Fail-Fast & Honest 정책에 따라 정직한 안내 메시지 반환');
  return generateLocalFallbackResponse(req.prompt, req.currentTemplate || null);
}

function parseGeminiOutput(rawText: string): GeminiConversationResponse {
  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.mode === 'CREATE_NEW' || parsed.mode === 'PATCH_UPDATE') return parsed;
  } catch {}
  return { mode: 'CONVERSATION_GUIDE', explanation: rawText };
}
