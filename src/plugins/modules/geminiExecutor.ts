// src/plugins/modules/geminiExecutor.ts
// Gemini API 직접 통신 및 응답 처리기 (65줄 최적화)

import type { AIPluginRequest } from '../types';
import type { GeminiConversationResponse } from '../../types/notion';
import { MASTER_SYSTEM_PROMPT } from './geminiPrompts';
import { generateLocalFallbackResponse } from '../../services/localTemplateFallback';

export async function executeGeminiCall(req: AIPluginRequest): Promise<GeminiConversationResponse> {
  const apiKey = (req.apiKey || '').trim();
  const model = req.options?.model || 'gemini-3.6-flash';
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

  let res = await fetch(`/api/gemini?model=${targetModel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
    body: JSON.stringify(body)
  }).catch(() => null);

  if (!res || !res.ok) {
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    res = await fetch(directUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    if (res.status === 429 || errorText.includes('quota') || errorText.includes('exceeded') || res.status >= 500) {
      console.warn('[GeminiExecutor] 429 Quota 초과 감지 -> 로컬 스마트 템플릿 엔진으로 안전 전환');
      return generateLocalFallbackResponse(req.prompt, req.currentTemplate || null);
    }
    throw new Error(`API 호출 실패 (${res.status}): ${errorText.slice(0, 100)}`);
  }

  try {
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return parseGeminiOutput(rawText);
  } catch {
    return generateLocalFallbackResponse(req.prompt, req.currentTemplate || null);
  }
}

function parseGeminiOutput(rawText: string): GeminiConversationResponse {
  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.mode === 'CREATE_NEW' || parsed.mode === 'PATCH_UPDATE') return parsed;
  } catch {}
  return { mode: 'CONVERSATION_GUIDE', explanation: rawText };
}
