// src/plugins/errorIsolation.ts
// AI 플러그인 장애 격리 및 안전 실행기 (Circuit Breaker & Fallback)

import type { AIPluginRequest, AIPluginResponse, IAIPlugin } from './types';

export class PluginExecutionError extends Error {
  pluginId: string;
  cause?: unknown;

  constructor(pluginId: string, message: string, cause?: unknown) {
    super(`[${pluginId}] 실행 실패: ${message}`);
    this.name = 'PluginExecutionError';
    this.pluginId = pluginId;
    this.cause = cause;
  }
}

/**
 * 플러그인을 안전하게 호출하여 예외를 격리하고 시스템 다운을 방지합니다.
 */
export async function safeExecutePlugin(
  plugin: IAIPlugin,
  request: AIPluginRequest,
  timeoutMs = 30000
): Promise<AIPluginResponse> {
  const startTime = Date.now();

  try {
    // 1. 타임아웃 타이머와 플러그인 실행 경쟁 (Race)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`요청 시간 초과 (${timeoutMs / 1000}초)`)), timeoutMs)
    );

    const response = await Promise.race([
      plugin.execute(request),
      timeoutPromise
    ]);

    return {
      ...response,
      metadata: {
        ...response.metadata,
        latencyMs: Date.now() - startTime,
      }
    };
  } catch (error: any) {
    console.error(`[PluginIsolation] ${plugin.name}(${plugin.id}) 장애 격리 감지:`, error);

    // 2. 오류 발생 시 전체 시스템 중단 없이 안전한 폴백 응답 반환
    return {
      success: false,
      pluginId: plugin.id,
      errorMessage: error?.message || '알 수 없는 AI 플러그인 오류가 발생했습니다.',
      metadata: {
        latencyMs: Date.now() - startTime,
      }
    };
  }
}
