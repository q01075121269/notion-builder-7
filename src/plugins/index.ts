// src/plugins/index.ts
// AI 플러그인 시스템 단일 진입점 및 기본 플러그인 자동 등록

import { pluginRegistry } from './registry';
import { GeminiPlugin } from './modules/geminiPlugin';
import { NapkinPlugin } from './modules/napkinPlugin';

// 기본 플러그인 등록
export function initializePlugins(): void {
  const gemini = new GeminiPlugin();
  const napkin = new NapkinPlugin();

  pluginRegistry.register(gemini);
  pluginRegistry.register(napkin);
  pluginRegistry.setDefaultPlugin('gemini');

  console.log('[Plugins] AI 모듈형 플러그인 시스템 초기화 완료 (Gemini, Napkin AI 탑재)');
}

// 자동 초기화 실행
initializePlugins();

export * from './types';
export * from './registry';
export * from './errorIsolation';
export * from './modules/geminiPlugin';
export * from './modules/napkinPlugin';
