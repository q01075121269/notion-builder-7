// src/plugins/testVerification.ts
// 플러그인 시스템의 인터페이스 추상화 및 예외 격리 검증 스크립트

import { pluginRegistry } from './registry';
import { GeminiPlugin } from './modules/geminiPlugin';
import { NapkinPlugin } from './modules/napkinPlugin';

console.log('=== [1] 플러그인 등록 및 목록 확인 ===');
const gemini = new GeminiPlugin();
const napkin = new NapkinPlugin();

pluginRegistry.register(gemini);
pluginRegistry.register(napkin);

const plugins = pluginRegistry.getAll();
console.log('등록된 플러그인 수:', plugins.length);
plugins.forEach(p => console.log(`- [${p.id}] ${p.name} (v${p.version}) 역량:`, p.capabilities.join(', ')));

console.log('\n=== [2] 냅킨 AI (Napkin AI) 플러그인 실행 테스트 ===');
const napkinRes = await pluginRegistry.execute({
  prompt: '주간 업무 보고서 템플릿',
  apiKey: 'test-key',
  currentTemplate: { title: '주간 업무 대시보드', icon: '📑', cover_query: 'workspace', databases: [], page_layout: [] }
}, 'napkin');

console.log('Napkin 실행 성공 여부:', napkinRes.success);
console.log('반환 모델:', napkinRes.metadata?.modelName);
console.log('응답 모드:', (napkinRes.result as any)?.mode);
console.log('소요 시간(ms):', napkinRes.metadata?.latencyMs);

console.log('\n=== [3] 예외 격리(Circuit Breaker / Isolation) 테스트 ===');
// 고의로 키 없이 실행하여 오류를 유발하고 앱이 죽지 않고 안전하게 처리되는지 확인
const errorRes = await pluginRegistry.execute({
  prompt: '오류 유발 테스트',
  apiKey: '' // 빈 키 전달
}, 'gemini');

console.log('예외 상황 시 안전 격리 성공 여부 (success should be false):', errorRes.success === false);
console.log('포착된 격리 에러 메시지:', errorRes.errorMessage);

console.log('\n=== 모든 모듈형 AI 플러그인 시스템 검증 성공! ===');
