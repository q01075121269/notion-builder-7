// src/plugins/modules/geminiPlugin.ts
// Google Gemini AI 전용 모듈 플러그인 (표준 인터페이스 준수)

import type { IAIPlugin, AIPluginRequest, AIPluginResponse, PluginCapability } from '../types';
import { executeGeminiCall } from './geminiExecutor';

export class GeminiPlugin implements IAIPlugin {
  readonly id = 'gemini';
  readonly name = 'Google Gemini AI';
  readonly version = '1.5.0';
  readonly capabilities: PluginCapability[] = [
    'TEMPLATE_BUILD',
    'CONVERSATION',
    'DOCUMENT_PARSING'
  ];

  validateConfig(apiKey?: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  async execute(request: AIPluginRequest): Promise<AIPluginResponse> {
    if (!this.validateConfig(request.apiKey)) {
      throw new Error('Gemini API 키가 설정되지 않았습니다. 상단 설정에서 API 키를 입력해 주세요.');
    }

    try {
      const result = await executeGeminiCall(request);
      return {
        success: true,
        pluginId: this.id,
        result,
        metadata: {
          modelName: request.options?.model || 'gemini-3.6-flash',
        }
      };
    } catch (err: any) {
      throw new Error(`Gemini 통신 오류: ${err?.message || '알 수 없는 오류'}`);
    }
  }
}
