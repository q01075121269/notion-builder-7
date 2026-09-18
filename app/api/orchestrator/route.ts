// app/api/orchestrator/route.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NOTION ARCHITECT v2.0 — Gemini Function Calling 마스터 오케스트레이터
//  Next.js App Router Web API (Edge/Node 양용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  5대 Function Calling 도구:
//   ① route_template_forge  — 상용급 다중 DB 스키마 + Formulas 2.0 + Value-Add
//   ② route_life_hub        — SCHEDULE / TODO / FINANCE / EMAIL 분류 추출
//   ③ route_dev_lab         — 코드 스니펫 / 트러블슈팅 / 아이디어 기록
//   ④ diagnose_system_error — 알려진 버그 패턴 진단 + 안티그래비티 수정 프롬프트
//   ⑤ general_chat          — 친절하고 위트 있는 비서 페르소나 응답

import {
  KNOWN_BUG_PATTERNS,
  GEMINI_SYSTEM_DIRECTIVES,
  COMMERCIAL_TEMPLATE_MECHANISMS,
} from '../../../src/lib/system_spec';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

export interface OrchestratorResponse {
  intent: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER' | 'ERROR_DIAGNOSIS';
  tool_called: string;
  reply_message: string;
  needs_clarification: boolean;
  redirect_url: string | null;
  payload: Record<string, unknown> | null;
  /** diagnose_system_error 전용: 안티그래비티 조치 프롬프트 */
  antigravity_fix_prompt?: string | null;
  /** route_template_forge 전용: 상용 템플릿 대비 Value-Add 목록 */
  value_add?: string[] | null;
}

export interface TemplateForgePayload {
  template_topic: string;
  suggested_title: string;
  complexity: 'simple' | 'intermediate' | 'advanced';
  initial_prompt: string;
  db_schema: DbSchema[];
  formulas: FormulaSpec[];
  methodology: string;
  value_add: string[];
}

export interface DbSchema {
  db_name: string;
  icon: string;
  properties: PropertySpec[];
  relations?: string[];
}

export interface PropertySpec {
  name: string;
  type: string;
  options?: string[];
  formula?: string;
}

export interface FormulaSpec {
  name: string;
  formula: string;
  use_case: string;
}

export interface LifeHubPayload {
  sub_domain: 'SCHEDULE' | 'TODO' | 'FINANCE' | 'EMAIL';
  action: 'create' | 'update' | 'delete' | 'list';
  title: string;
  date?: string;
  amount?: number;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  urgency?: 'urgent' | 'important' | 'info';
  merchant?: string;
  payment_method?: string;
  memo?: string;
  deadline?: string;
  body_text?: string;
}

export interface DevLabPayload {
  sub_type: 'idea' | 'troubleshooting' | 'snippet' | 'prompt';
  title: string;
  tech_stack: string[];
  tags: string[];
  code_content?: string;
  symptom?: string;
  solution?: string;
  content: string;
}

export interface ErrorDiagnosisPayload {
  matched_bug_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'unknown';
  affected_components: string[];
  root_cause_analysis: string;
  fix_pattern: string[];
  antigravity_prompt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Function Calling 도구 선언 (5종)
// ─────────────────────────────────────────────────────────────────────────────

const FUNCTION_DECLARATIONS = [
  {
    name: 'route_template_forge',
    description:
      '사용자가 노션 템플릿/대시보드/DB 설계를 요청할 때 호출. ' +
      '단순 텍스트 응답이 아닌, 2~4개 다중 관계형 DB 스키마와 속성(Properties), ' +
      'Formulas 2.0 수식, 그리고 시중 템플릿 대비 차별화 포인트(Value-Add)를 포함한 고품질 구조화 데이터를 반환.',
    parameters: {
      type: 'OBJECT',
      properties: {
        template_topic: { type: 'STRING', description: '템플릿 주제 (예: 독서노트, 프로젝트 관리, CRM)' },
        suggested_title: { type: 'STRING', description: '제안하는 노션 페이지 제목' },
        complexity: {
          type: 'STRING',
          enum: ['simple', 'intermediate', 'advanced'],
          description: '템플릿 복잡도',
        },
        initial_prompt: { type: 'STRING', description: '빌더 AI에게 즉시 전달할 구체적 프롬프트' },
        methodology: {
          type: 'STRING',
          description: '적용할 방법론: PARA / GTD / OKR / NONE 중 하나',
        },
        db_schema: {
          type: 'ARRAY',
          description: '2~4개 다중 관계형 DB 스키마 배열',
          items: {
            type: 'OBJECT',
            properties: {
              db_name: { type: 'STRING' },
              icon: { type: 'STRING', description: '대표 이모지' },
              properties: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    type: {
                      type: 'STRING',
                      description:
                        'title | rich_text | number | select | multi_select | date | checkbox | formula | relation | rollup | status | url',
                    },
                    options: { type: 'ARRAY', items: { type: 'STRING' } },
                    formula: { type: 'STRING', description: 'Formulas 2.0 수식 문자열' },
                  },
                  required: ['name', 'type'],
                },
              },
              relations: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: '연결할 다른 DB 이름 목록',
              },
            },
            required: ['db_name', 'icon', 'properties'],
          },
        },
        formulas: {
          type: 'ARRAY',
          description: '포함할 Formulas 2.0 수식 목록 (최소 2개)',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              formula: { type: 'STRING', description: '실제 Notion Formulas 2.0 수식 문자열' },
              use_case: { type: 'STRING' },
            },
            required: ['name', 'formula', 'use_case'],
          },
        },
        value_add: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '시중 무료/단순 템플릿 대비 추가된 고도화 기능 목록 (최소 3개)',
        },
      },
      required: [
        'template_topic',
        'suggested_title',
        'complexity',
        'initial_prompt',
        'methodology',
        'db_schema',
        'formulas',
        'value_add',
      ],
    },
  },

  {
    name: 'route_life_hub',
    description:
      '일정(약속/회의/진료), 할일(투두/마감), 지출(가계부/식비), 이메일 요약 등 ' +
      '라이프 관련 요청 시 호출. sub_domain, action, 상세 payload를 구조화하여 반환.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sub_domain: {
          type: 'STRING',
          enum: ['SCHEDULE', 'TODO', 'FINANCE', 'EMAIL'],
          description: 'SCHEDULE=일정, TODO=할일, FINANCE=지출, EMAIL=이메일',
        },
        action: {
          type: 'STRING',
          enum: ['create', 'update', 'delete', 'list'],
          description: '수행할 작업 유형',
        },
        title: { type: 'STRING', description: '항목의 핵심 제목' },
        date: { type: 'STRING', description: '날짜/시간 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm)' },
        amount: { type: 'NUMBER', description: '금액 (원 단위, FINANCE 전용)' },
        category: {
          type: 'STRING',
          description: '카테고리: 식비|교통|주거/구독|문화/여가|쇼핑|의료/건강|기타 (FINANCE), 업무|개인|건강|학습 (SCHEDULE)',
        },
        priority: {
          type: 'STRING',
          enum: ['high', 'medium', 'low'],
          description: '우선순위 (TODO 전용)',
        },
        urgency: {
          type: 'STRING',
          enum: ['urgent', 'important', 'info'],
          description: '긴급도 (EMAIL 전용)',
        },
        merchant: { type: 'STRING', description: '가맹점/상호명 (FINANCE 전용)' },
        payment_method: {
          type: 'STRING',
          enum: ['신용카드', '체크카드', '현금', '계좌이체', '간편결제'],
          description: '결제 수단 (FINANCE 전용)',
        },
        memo: { type: 'STRING', description: '추가 메모' },
        deadline: { type: 'STRING', description: 'D-Day 기준 마감일 (TODO 전용)' },
        body_text: { type: 'STRING', description: '이메일 본문 요약 (EMAIL 전용)' },
        reply_message: { type: 'STRING', description: '사용자에게 전달할 확인 메시지' },
      },
      required: ['sub_domain', 'action', 'title', 'reply_message'],
    },
  },

  {
    name: 'route_dev_lab',
    description:
      '개발 아이디어, 코드 스니펫, 트러블슈팅(에러/버그/오류), AI 프롬프트 보관 등 ' +
      '개발 관련 요청 시 호출. tech_stack, code_content, tags 등을 추출하여 반환.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sub_type: {
          type: 'STRING',
          enum: ['idea', 'troubleshooting', 'snippet', 'prompt'],
          description: 'idea=아이디어, troubleshooting=트러블슈팅, snippet=코드스니펫, prompt=AI프롬프트',
        },
        title: { type: 'STRING', description: '개발 항목 제목' },
        tech_stack: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '관련 기술 스택 (예: React, TypeScript, Next.js)',
        },
        tags: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '검색용 태그 배열',
        },
        code_content: { type: 'STRING', description: '코드 스니펫 본문 (snippet 전용)' },
        symptom: { type: 'STRING', description: '에러 증상 또는 기획 배경' },
        solution: { type: 'STRING', description: '해결 방안 또는 요약' },
        content: { type: 'STRING', description: '상세 내용 전문' },
        reply_message: { type: 'STRING', description: '사용자에게 전달할 확인 메시지' },
      },
      required: ['sub_type', 'title', 'tech_stack', 'tags', 'content', 'reply_message'],
    },
  },

  {
    name: 'diagnose_system_error',
    description:
      '사용자가 Notion Architect 자체의 버그/UI 오류/기능 이상을 언급할 때 호출. ' +
      'system_spec 지식 베이스를 참조해 원인을 분석하고, ' +
      '안티그래비티 IDE에 즉시 입력 가능한 정밀 수정 프롬프트를 생성.',
    parameters: {
      type: 'OBJECT',
      properties: {
        matched_bug_id: {
          type: 'STRING',
          description: '일치하는 BUG-001~BUG-005 ID (없으면 null)',
        },
        severity: {
          type: 'STRING',
          enum: ['low', 'medium', 'high', 'unknown'],
        },
        affected_components: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '영향받는 파일/컴포넌트 이름 배열',
        },
        root_cause_analysis: {
          type: 'STRING',
          description: '원인 분석 한국어 설명 (파일명/함수명/클래스명 단위)',
        },
        fix_pattern: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '수정 방법 단계별 목록',
        },
        antigravity_prompt: {
          type: 'STRING',
          description: '안티그래비티 IDE에 즉시 붙여넣을 수 있는 정밀 수정 프롬프트 전문',
        },
        reply_message: {
          type: 'STRING',
          description: '사용자에게 전달할 진단 결과 요약 메시지',
        },
      },
      required: [
        'severity',
        'affected_components',
        'root_cause_analysis',
        'fix_pattern',
        'antigravity_prompt',
        'reply_message',
      ],
    },
  },

  {
    name: 'general_chat',
    description:
      '위 4가지 도구에 해당하지 않는 일반 대화, 인사, 시스템 안내, 위로/격려 등 ' +
      '자연스러운 비서 페르소나 응답이 필요할 때 호출.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reply_message: {
          type: 'STRING',
          description:
            '한국어 구어체의 친절하고 위트 있는 비서 응답 (TTS로 읽어도 자연스러운 문장)',
        },
        suggested_actions: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '사용자에게 추천할 다음 행동 3가지 (선택적)',
        },
      },
      required: ['reply_message'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 시스템 프롬프트 — system_spec 지식 주입
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const knownBugSummary = KNOWN_BUG_PATTERNS.map(
    (b) => `  [${b.id}] ${b.name} (${b.severity}, ${b.status})`
  ).join('\n');

  const mechanismNames = Object.values(COMMERCIAL_TEMPLATE_MECHANISMS)
    .map((m) => `  - ${m.name}`)
    .join('\n');

  return `당신은 Notion Architect v2.0의 "수석 지능형 오케스트레이터 AI"입니다.
사용자의 음성/텍스트 입력을 분석하여 반드시 아래 5개 도구(Function) 중 가장 적합한 하나를 호출하세요.
절대 일반 텍스트로 응답하지 마세요. 반드시 Function Calling으로만 응답하세요.

[시스템 지식 베이스 — 항시 참조]
• 프로젝트: Notion Architect (React+Vite+TypeScript, Vercel Serverless, Gemini 3.6 Flash, Notion API)
• 4대 탭: 홈/대화형, 노션빌더, 라이프허브, 개발랩

[템플릿 설계 원칙 — route_template_forge 호출 시 반드시 적용]
${mechanismNames}
• 맥락 자동 확장: 단일 발화라도 최소 2~4개 DB를 관계형으로 확장
• Formulas 2.0 강제: progress(), dateBetween(), if/and/or 수식 최소 2개 포함
• 방법론 자동 선택: PARA/GTD/OKR 중 맥락에 맞는 것 자동 적용
• Value-Add 역제안: 시중 단순 템플릿 대비 추가 기능 3개 이상 명시

[알려진 버그 패턴 — diagnose_system_error 호출 시 참조]
${knownBugSummary}

[도구 선택 기준]
• 노션 템플릿/대시보드/DB 설계 요청 → route_template_forge
• 일정/할일/지출/이메일 요청 → route_life_hub
• 개발 코드/에러/아이디어/프롬프트 요청 → route_dev_lab
• 이 시스템(Notion Architect) 자체 버그/UI 오류 언급 → diagnose_system_error
• 그 외 인사/일상 대화/시스템 안내 → general_chat

${GEMINI_SYSTEM_DIRECTIVES.templateMasterDirective}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Function Calling API 호출
// ─────────────────────────────────────────────────────────────────────────────

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

async function callGeminiWithFunctions(
  userText: string,
  history: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<OrchestratorResponse> {
  const contents: unknown[] = [];

  // 멀티턴 대화 기록 (최근 6턴)
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach((h) => {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    });
  }
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const requestBody = {
    systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
    contents,
    tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    toolConfig: { functionCallingConfig: { mode: 'ANY' } }, // 반드시 Function 호출
    generationConfig: { temperature: 0.2 },
  };

  let lastError: string = 'Unknown error';

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000), // 25초 타임아웃
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `[${model}] HTTP ${res.status}: ${errText.slice(0, 200)}`;

        // 404 / NOT_FOUND → 다음 모델로 폴백
        if (res.status === 404 || errText.includes('NOT_FOUND') || errText.includes('no longer available')) {
          console.warn(`[Orchestrator] Model '${model}' not available, trying next...`);
          continue;
        }
        // 401 인증 실패는 즉시 에러 반환 (모델 전환 무의미)
        if (res.status === 401) {
          return buildErrorFallback('Gemini API 키가 유효하지 않습니다. 설정을 확인해주세요.');
        }
        continue;
      }

      const data = await res.json();
      return parseFunctionCallResponse(data, userText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `[${model}] ${msg}`;
      if (msg.includes('TimeoutError') || msg.includes('AbortError')) {
        console.warn(`[Orchestrator] Model '${model}' timed out, trying next...`);
        continue;
      }
      continue;
    }
  }

  // 모든 Gemini 모델 실패 → 스마트 로컬 휴리스틱 폴백
  console.error('[Orchestrator] All Gemini models failed:', lastError);
  return localHeuristicFallback(userText);
}

// ─────────────────────────────────────────────────────────────────────────────
// Function Call 응답 파싱
// ─────────────────────────────────────────────────────────────────────────────

function parseFunctionCallResponse(data: Record<string, unknown>, userText: string): OrchestratorResponse {
  try {
    const candidate = (data?.candidates as unknown[])?.[0] as Record<string, unknown> | undefined;
    const parts = ((candidate?.content as Record<string, unknown>)?.parts as unknown[]) ?? [];

    // Function Call 파트 탐색
    const fnPart = parts.find(
      (p) => (p as Record<string, unknown>).functionCall !== undefined
    ) as Record<string, unknown> | undefined;

    if (!fnPart?.functionCall) {
      // 텍스트 응답만 반환된 경우 → 일반 대화로 처리
      const textPart = parts.find(
        (p) => typeof (p as Record<string, unknown>).text === 'string'
      ) as Record<string, unknown> | undefined;
      const textContent = (textPart?.text as string) ?? '네, 말씀 잘 들었습니다. 무엇이든 도와드릴게요!';
      return {
        intent: 'CHAT',
        tool_called: 'general_chat',
        reply_message: textContent,
        needs_clarification: false,
        redirect_url: null,
        payload: null,
      };
    }

    const fnCall = fnPart.functionCall as Record<string, unknown>;
    const toolName = fnCall.name as string;
    const args = (fnCall.args as Record<string, unknown>) ?? {};

    return mapToolResultToResponse(toolName, args, userText);
  } catch (err) {
    console.error('[Orchestrator] parseFunctionCallResponse error:', err);
    return localHeuristicFallback(userText);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 도구 결과 → OrchestratorResponse 매핑
// ─────────────────────────────────────────────────────────────────────────────

function mapToolResultToResponse(
  toolName: string,
  args: Record<string, unknown>,
  userText: string
): OrchestratorResponse {
  switch (toolName) {
    case 'route_template_forge': {
      const valueAdd = (args.value_add as string[]) ?? [];
      const dbSchema = (args.db_schema as unknown[]) ?? [];
      return {
        intent: 'BUILDER',
        tool_called: 'route_template_forge',
        reply_message:
          (args.initial_prompt as string) ||
          `📐 "${args.template_topic}"에 대해 ${dbSchema.length}개 관계형 DB로 구성된 상용급 템플릿을 설계했습니다! ` +
          `기존 단순 템플릿 대비 ${valueAdd.slice(0, 2).join(', ')} 등 ${valueAdd.length}가지 고도화 기능이 포함됩니다. ` +
          `노션 빌더 작업실로 이동합니다.`,
        needs_clarification: false,
        redirect_url: '/builder',
        value_add: valueAdd,
        payload: {
          template_topic: args.template_topic ?? userText,
          suggested_title: args.suggested_title ?? `${userText} 템플릿`,
          complexity: args.complexity ?? 'intermediate',
          initial_prompt: args.initial_prompt ?? userText,
          methodology: args.methodology ?? 'NONE',
          db_schema: args.db_schema ?? [],
          formulas: args.formulas ?? [],
          value_add: valueAdd,
        },
      };
    }

    case 'route_life_hub': {
      const subDomain = (args.sub_domain as string) ?? 'SCHEDULE';
      const subLabelMap: Record<string, string> = {
        SCHEDULE: '일정',
        TODO: '할일',
        FINANCE: '지출',
        EMAIL: '이메일',
      };
      return {
        intent: 'LIFE',
        tool_called: 'route_life_hub',
        reply_message:
          (args.reply_message as string) ||
          `✅ "${args.title}" ${subLabelMap[subDomain] ?? '항목'}을 라이프 허브에 등록했습니다.`,
        needs_clarification: false,
        redirect_url: '/life',
        payload: {
          sub_domain: subDomain,
          action: args.action ?? 'create',
          title: args.title ?? userText,
          date: args.date,
          amount: args.amount,
          category: args.category,
          priority: args.priority ?? 'medium',
          urgency: args.urgency,
          merchant: args.merchant,
          payment_method: args.payment_method,
          memo: args.memo,
          deadline: args.deadline,
          body_text: args.body_text,
        },
      };
    }

    case 'route_dev_lab': {
      const subTypeLabel: Record<string, string> = {
        idea: '아이디어',
        troubleshooting: '트러블슈팅',
        snippet: '코드 스니펫',
        prompt: 'AI 프롬프트',
      };
      const sub = (args.sub_type as string) ?? 'idea';
      return {
        intent: 'DEVLAB',
        tool_called: 'route_dev_lab',
        reply_message:
          (args.reply_message as string) ||
          `⚗️ "${args.title}" ${subTypeLabel[sub] ?? '항목'}을 개발 랩에 체계적으로 기록했습니다.`,
        needs_clarification: false,
        redirect_url: '/devlab',
        payload: {
          sub_type: sub,
          title: args.title ?? userText,
          tech_stack: args.tech_stack ?? [],
          tags: args.tags ?? [],
          code_content: args.code_content,
          symptom: args.symptom,
          solution: args.solution,
          content: args.content ?? userText,
        },
      };
    }

    case 'diagnose_system_error': {
      // 알려진 버그 패턴 자동 매칭 보강
      const matchedId = (args.matched_bug_id as string) ?? null;
      const knownBug = matchedId
        ? KNOWN_BUG_PATTERNS.find((b) => b.id === matchedId)
        : null;

      const fixPattern = (args.fix_pattern as string[]) ??
        (knownBug ? [...knownBug.fixPattern] : []);

      const antigravityPrompt = (args.antigravity_prompt as string) || buildAntigravityPrompt(args, knownBug);

      return {
        intent: 'ERROR_DIAGNOSIS',
        tool_called: 'diagnose_system_error',
        reply_message:
          (args.reply_message as string) ||
          `🔍 시스템 진단 결과: ${args.root_cause_analysis}`,
        needs_clarification: false,
        redirect_url: null,
        antigravity_fix_prompt: antigravityPrompt,
        payload: {
          matched_bug_id: matchedId,
          severity: args.severity ?? 'unknown',
          affected_components: args.affected_components ?? [],
          root_cause_analysis: args.root_cause_analysis ?? '원인 분석 중...',
          fix_pattern: fixPattern,
          antigravity_prompt: antigravityPrompt,
          known_bug_status: knownBug?.status ?? null,
        },
      };
    }

    case 'general_chat':
    default: {
      return {
        intent: 'CHAT',
        tool_called: 'general_chat',
        reply_message:
          (args.reply_message as string) ||
          '안녕하세요! 일정, 가계부, 개발 트러블슈팅, 노션 템플릿 설계까지 무엇이든 도와드릴게요. 😊',
        needs_clarification: false,
        redirect_url: null,
        payload: {
          suggested_actions: args.suggested_actions ?? [
            '노션 템플릿 만들기',
            '오늘 지출 기록하기',
            '개발 아이디어 저장하기',
          ],
        },
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 안티그래비티 수정 프롬프트 자동 조립
// ─────────────────────────────────────────────────────────────────────────────

function buildAntigravityPrompt(
  args: Record<string, unknown>,
  knownBug: (typeof KNOWN_BUG_PATTERNS)[number] | undefined
): string {
  const components = (args.affected_components as string[] | undefined) ?? [];
  const fixSteps = (args.fix_pattern as string[] | undefined) ?? [];

  const lines = [
    `[Step X: ${args.root_cause_analysis ?? '시스템 오류 수정'}]`,
    '',
    '**현상:**',
    ...(knownBug ? [`• ${knownBug.symptom}`] : ['• ' + (args.root_cause_analysis ?? '오류 발생')]),
    '',
    '**영향 컴포넌트:**',
    ...components.map((c) => `• ${c}`),
    '',
    '**수정 지시:**',
    ...fixSteps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '**검증 단계:**',
    '1. npm run build 실행 → TypeScript 에러 0개 확인',
    '2. isCompact=true 조건에서 UI 렌더링 확인',
    '3. git commit -m "fix(컴포넌트명): 수정 내용 요약"',
    '4. git push origin main',
  ];

  if (knownBug) {
    lines.push('', `**참고:** ${knownBug.id} (${knownBug.status})`);
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 오프라인/API 키 없음 → 스마트 로컬 휴리스틱 폴백
// ─────────────────────────────────────────────────────────────────────────────

function localHeuristicFallback(userText: string): OrchestratorResponse {
  const lower = userText.toLowerCase();

  // 버그/오류 키워드 → 시스템 진단 우선
  if (
    lower.includes('안 보여') ||
    lower.includes('박스 넘') ||
    lower.includes('오버플로') ||
    lower.includes('깨져') ||
    lower.includes('안 됨') ||
    lower.includes('이상해') ||
    lower.includes('버그') ||
    lower.includes('오류')
  ) {
    const matchedBug = KNOWN_BUG_PATTERNS.find((b) =>
      b.fixPattern.some((fp) => lower.includes(fp.slice(0, 6)))
    );
    return {
      intent: 'ERROR_DIAGNOSIS',
      tool_called: 'diagnose_system_error',
      reply_message: `🔍 시스템 진단을 실행했습니다. ${matchedBug ? `"${matchedBug.name}"와 유사한 패턴이 감지되었습니다.` : '증상을 상세히 알려주시면 정밀 분석해 드릴게요.'}`,
      needs_clarification: !matchedBug,
      redirect_url: null,
      antigravity_fix_prompt: matchedBug
        ? buildAntigravityPrompt(
            {
              root_cause_analysis: matchedBug.name,
              affected_components: [...matchedBug.affectedComponents],
              fix_pattern: [...matchedBug.fixPattern],
            },
            matchedBug
          )
        : null,
      payload: matchedBug
        ? {
            matched_bug_id: matchedBug.id,
            severity: matchedBug.severity,
            affected_components: [...matchedBug.affectedComponents],
            root_cause_analysis: matchedBug.symptom,
            fix_pattern: [...matchedBug.fixPattern],
          }
        : null,
    };
  }

  // 템플릿/빌더 키워드
  if (
    lower.includes('템플릿') ||
    lower.includes('대시보드') ||
    lower.includes('노션 페이지') ||
    lower.includes('빌더') ||
    lower.includes('db 만들') ||
    lower.includes('데이터베이스 만들')
  ) {
    return {
      intent: 'BUILDER',
      tool_called: 'route_template_forge',
      reply_message: `📐 "${userText}" 템플릿을 상용급 다중 DB 구조로 설계해 드릴게요! 노션 빌더 작업실로 이동합니다.`,
      needs_clarification: false,
      redirect_url: '/builder',
      value_add: [
        '다중 관계형 DB (Relation + Rollup)',
        'Formulas 2.0 수식 자동 삽입',
        '방법론 기반 구조 (PARA/GTD/OKR)',
      ],
      payload: {
        template_topic: userText,
        suggested_title: `${userText} 템플릿`,
        complexity: 'intermediate',
        initial_prompt: userText,
        methodology: 'PARA',
        db_schema: [],
        formulas: [],
        value_add: ['다중 관계형 DB', 'Formulas 2.0', '방법론 기반 구조'],
      },
    };
  }

  // 개발 랩 키워드
  if (
    lower.includes('에러') ||
    lower.includes('코드') ||
    lower.includes('개발') ||
    lower.includes('아이디어') ||
    lower.includes('프롬프트') ||
    lower.includes('스니펫')
  ) {
    const isTrouble =
      lower.includes('에러') || lower.includes('오류') || lower.includes('안됨');
    return {
      intent: 'DEVLAB',
      tool_called: 'route_dev_lab',
      reply_message: isTrouble
        ? `⚗️ 트러블슈팅 일지로 개발 랩에 안전하게 기록해 드릴게요.`
        : `⚗️ 새로운 개발 아이디어를 개발 랩에 저장해 드릴게요.`,
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        sub_type: isTrouble ? 'troubleshooting' : 'idea',
        title: userText.slice(0, 40),
        tech_stack: [],
        tags: ['개발', isTrouble ? '디버깅' : '아이디어'],
        content: userText,
      },
    };
  }

  // 라이프 허브 키워드
  if (
    lower.includes('일정') ||
    lower.includes('예약') ||
    lower.includes('회의') ||
    lower.includes('치과') ||
    lower.includes('원') ||
    lower.includes('식비') ||
    lower.includes('결제') ||
    lower.includes('할 일') ||
    lower.includes('투두') ||
    lower.includes('연가') ||
    lower.includes('휴가')
  ) {
    const isFinance =
      lower.includes('원') || lower.includes('식비') || lower.includes('결제');
    const isTodo = lower.includes('할 일') || lower.includes('투두');
    const subDomain = isFinance ? 'FINANCE' : isTodo ? 'TODO' : 'SCHEDULE';
    const label = isFinance ? '지출' : isTodo ? '할일' : '일정';
    return {
      intent: 'LIFE',
      tool_called: 'route_life_hub',
      reply_message: `✅ "${userText}" ${label}을 라이프 허브에 등록했습니다!`,
      needs_clarification: false,
      redirect_url: '/life',
      payload: {
        sub_domain: subDomain,
        action: 'create',
        title: userText,
        category: isFinance ? '식비' : isTodo ? '업무' : '일정',
        priority: 'medium',
      },
    };
  }

  // 기본 일반 대화
  return {
    intent: 'CHAT',
    tool_called: 'general_chat',
    reply_message:
      '안녕하세요! 일정/가계부 등록, 개발 트러블슈팅, 노션 템플릿 설계, 시스템 버그 진단까지 무엇이든 도와드릴게요. 😊',
    needs_clarification: false,
    redirect_url: null,
    payload: {
      suggested_actions: [
        '노션 독서노트 템플릿 만들기',
        '오늘 점심 식비 기록하기',
        '개발 아이디어 개발 랩에 저장하기',
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 에러 폴백 응답 생성
// ─────────────────────────────────────────────────────────────────────────────

function buildErrorFallback(message: string): OrchestratorResponse {
  return {
    intent: 'CHAT',
    tool_called: 'general_chat',
    reply_message: message,
    needs_clarification: false,
    redirect_url: null,
    payload: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Next.js App Router 핸들러
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key, x-user-email',
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const userText = String(body.text || body.message || body.prompt || '').trim();

    if (!userText) {
      return new Response(
        JSON.stringify({ error: '입력 텍스트(text)가 비어 있습니다.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const history: Array<{ role: string; content: string }> =
      Array.isArray(body.conversation_history) ? body.conversation_history : [];

    const apiKey =
      req.headers.get('x-gemini-api-key') ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    const result = apiKey
      ? await callGeminiWithFunctions(userText, history, apiKey)
      : localHeuristicFallback(userText);

    return new Response(JSON.stringify(result), { status: 200, headers: CORS_HEADERS });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Orchestrator POST] Unexpected error:', msg);
    return new Response(
      JSON.stringify({
        error: '오케스트레이터 처리 중 오류가 발생했습니다: ' + msg,
        fallback: buildErrorFallback('일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'),
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vercel Node.js Serverless 핸들러 (하위 호환)
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: {
  method: string;
  headers: Record<string, string>;
  body: unknown;
}, res: {
  setHeader(key: string, val: string): void;
  status(code: number): { json(data: unknown): void; end(): void };
}): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, x-user-email');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const userText = String(body.text || body.message || body.prompt || '').trim();

    if (!userText) return res.status(400).json({ error: '입력 텍스트가 필요합니다.' });

    const history: Array<{ role: string; content: string }> =
      Array.isArray(body.conversation_history) ? body.conversation_history : [];

    const apiKey =
      req.headers['x-gemini-api-key'] ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    const result = apiKey
      ? await callGeminiWithFunctions(userText, history, apiKey)
      : localHeuristicFallback(userText);

    return res.status(200).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: '오케스트레이터 처리 실패: ' + msg });
  }
}