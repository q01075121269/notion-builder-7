// src/services/localTemplateFallback.ts
// 프롬프트 인텐트 기반 지능형 도메인별 노션 템플릿 생성기 (65줄 최적화)

import type { GeminiConversationResponse, NotionTemplate } from '../types/notion';
import { PRESET_TEMPLATES } from './presetTemplates';
import { DEVLAB_TEMPLATE, LIFE_HUB_TEMPLATE, createDynamicTemplate } from './fallbackTemplatesData';

export function generateLocalFallbackResponse(
  prompt: string,
  _currentTemplate: NotionTemplate | null
): GeminiConversationResponse {
  const p = prompt.trim().toLowerCase();

  // 1. 개발 랩 / 시스템 아키텍처 인텐트 감지
  if (/(?:개발\s*랩|개발|devlab|lab|연구실|아키텍처|엔지니어|스니펫|트러블|버그|프롬프트)/i.test(p)) {
    return {
      mode: 'CREATE_NEW',
      template: DEVLAB_TEMPLATE,
      explanation: '네! 요청하신 본 웹프로그램의 **[개발 랩(DevLab)]** 규격에 완벽히 호환되는 **고품질 맞춤형 템플릿**을 설계해 드렸습니다.\n\n' +
        '- **🔬 개발 랩 DB**: AI 프롬프트 실험, 테스트 케이스, 기술 스택 검증 및 Formula 2.0 진행률\n' +
        '- **🐞 트러블슈팅 일지 DB**: 시스템 버그, 원인 분석, 해결 솔루션 및 상태 관리\n' +
        '- **🚀 스프린트 백로그 DB**: 애자일 개발 태스크, D-Day 수식 및 마일스톤 추적\n\n' +
        '상단의 **[내 노션에 템플릿 생성하기]**를 클릭하시면 내 노션 워크스페이스에 즉시 만들어집니다!'
    };
  }

  // 2. 스타트업 / 애자일 스프린트 인텐트 감지
  if (/(?:스타트업|스프린트|애자일|사업|비즈니스|로드맵|startup)/i.test(p)) {
    return {
      mode: 'CREATE_NEW',
      template: PRESET_TEMPLATES.startup_sprint,
      explanation: '네! 스타트업 및 애자일 프로젝트 관리에 최적화된 **[스타트업 애자일 스프린트 & 로드맵]** 템플릿을 생성해 드렸습니다.'
    };
  }

  // 3. 대학생 / 학업 / 시험 과제 인텐트 감지
  if (/(?:대학|대학생|과제|시험|학기|공부|수강|학생|학습)/i.test(p)) {
    return {
      mode: 'CREATE_NEW',
      template: PRESET_TEMPLATES.college_student,
      explanation: '네! 대학 생활과 학기별 학업 관리에 최적화된 **[대학생 시험 & 과제 관리 올인원]** 템플릿을 생성해 드렸습니다.'
    };
  }

  // 4. 라이프 허브 / 일상 / 가계부 명시적 요청 감지
  if (/(?:라이프\s*허브|가계부|소비|지출|루틴|습관)/i.test(p)) {
    return {
      mode: 'CREATE_NEW',
      template: LIFE_HUB_TEMPLATE,
      explanation: '네! 모바일 1초 퀵 캡처와 연동되는 **[2026 라이프 허브 올인원 시스템]** 템플릿을 설계해 드렸습니다.'
    };
  }

  // 5. 그 외 자유 주제 프롬프트 -> 동적 맞춤형 템플릿 자동 구축
  const extractedKeyword = prompt
    .replace(/(?:노션|아키텍처|템플릿|만들어|생산|제작|해줘|해\s*주세요|부탁|맞는|수준높은|생성)/gi, '')
    .trim() || '스마트 프로젝트';

  const dynamicTpl = createDynamicTemplate(extractedKeyword);
  return {
    mode: 'CREATE_NEW',
    template: dynamicTpl,
    explanation: `네! 요청하신 **[${extractedKeyword}]** 목적에 맞춤 설계된 고성능 노션 템플릿을 즉시 생성해 드렸습니다. 언제든 추가 수정 사항을 말씀해 주세요!`
  };
}
