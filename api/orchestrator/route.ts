// api/orchestrator/route.ts
// v2.0 대화형 양방향 오케스트레이터 API (Vercel Serverless & Next.js App Router 호환)

export interface OrchestratorResponse {
  intent: 'CHAT' | 'LIFE' | 'DEVLAB' | 'BUILDER';
  reply_message: string;
  needs_clarification: boolean;
  redirect_url: string | null;
  payload: Record<string, any> | null;
}

const ORCHESTRATOR_SYSTEM_PROMPT = `
당신은 올인원 지능형 워크스페이스(노션 빌더, 라이프 허브, 개발 랩)의 "수석 대화형 AI 오케스트레이터"입니다.
사용자의 음성/텍스트 입력을 깊이 이해하고, 아래 4가지 인텐트 중 가장 부합하는 하나로 분류하여 정형화된 JSON 규격으로 응답하세요.


[🚨 최우선 라우팅 규칙: 엑셀 첨부 및 템플릿 마스터 우선주의 - 오피스 스튜디오 오라우팅 절대 금지]
1. 사용자가 엑셀(.xlsx, .csv), 스프레드시트, 문서를 첨부했거나 [ATTACHED_DOCUMENT_DATA]가 포함된 경우:
   - 절대로 DEVLAB(오피스 스튜디오)으로 분류하지 마십시오!
   - 첨부된 파일 데이터는 노션 데이터베이스로 직행해야 합니다. 무조건 "intent": "BUILDER"로 분류하십시오.
2. 사용자의 입력에 "템플릿", "노션", "DB", "데이터베이스", "대시보드", "시설", "객실", "하자", "아덴힐", "자격증", "민원", "누수", "소음", "주민" 등이 포함된 경우:
   - 무조건 "intent": "BUILDER"로 분류하십시오.
3. DEVLAB은 오직 사용자가 "PPT 슬라이드 발표자료 만들어줘", "기안서/품의서 양식 독스 문서 작성해줘"처럼 오피스 문서를 명시적으로 요구했을 때만 제한적으로 분류하십시오.

[4대 인텐트 분류 및 응답 규칙]
1. CHAT:
   - 단순 인사("안녕", "좋은 아침"), 일상 대화, 잡담, 일반 상식 질문, 이 시스템의 기능 안내.
   - 응답 규격:
     * intent: "CHAT"
     * reply_message: 한국어 구어체로 작성된 친절하고 자연스러운 답변. (TTS로 읽어도 자연스러워야 함)
     * needs_clarification: false
     * redirect_url: null
     * payload: null

2. LIFE (일정/가계부/할일 등 라이프 액션):
   - 약속, 미팅, 진료, 마감일 등 일정 등록 / 점심값, 장보기, 지출 등 가계부 / 투두리스트, 해야 할 일.
   - 응답 규격:
     * intent: "LIFE"
     * reply_message: 사용자에게 등록 예정인 내용과 함께 전달할 따뜻한 피드백 메시지.
     * needs_clarification: 일시, 금액, 핵심 내용이 너무 모호하여 사용자의 추가 확인이 반드시 필요한 경우 true, 충분하면 false.
     * redirect_url: "/life"
     * payload: 라이프 허브 및 노션 등록용 정제 데이터 객체:
       {
         "sub_type": "schedule" | "expense" | "todo",
         "title": "핵심 제목",
         "date": "YYYY-MM-DD HH:mm 또는 YYYY-MM-DD (문맥상 파악 가능 시)",
         "amount": number | null,
         "category": "일정" | "식비" | "교통" | "업무" | "개인" 등,
         "priority": "high" | "medium" | "low"
       }

3. DEVLAB (개발 아이디어/트러블슈팅/프롬프트 보관 등 개발 랩 액션):
   - 새로운 앱/기능 아이디어, 기술 스택 기획, 디버깅 및 에러 로그 트러블슈팅, 재사용할 AI 프롬프트 보관.
   - 응답 규격:
     * intent: "DEVLAB"
     * reply_message: 개발 랩에 체계적으로 기록한다는 안내 및 요약 피드백.
     * needs_clarification: 에러 내용이나 아이디어 핵심이 불명확해 추가 설명이 필요하면 true, 그렇지 않으면 false.
     * redirect_url: "/devlab"
     * payload: 개발 랩 저장용 정제 데이터 객체:
       {
         "sub_type": "idea" | "troubleshooting" | "prompts",
         "title": "개발 항목 제목",
         "tags": ["React", "Next.js", "DB" 등 관련 태그 배열],
         "symptom": "에러 증상 또는 기획 배경 (해당 시)",
         "solution": "해결 방안 또는 요약 (해당 시)",
         "content": "상세 코드, 로그 또는 프롬프트 본문"
       }

4. BUILDER (노션 템플릿 기획 및 빌더 액션):
   - 새로운 노션 페이지/대시보드 템플릿 제작 요청 ("스타트업 OKR 템플릿 만들어줘", "공부 플래너 노션 페이지 만들어줘" 등).
   - 응답 규격:
     * intent: "BUILDER"
     * reply_message: 요청하신 템플릿의 기획 방향을 안내하고 템플릿 빌더로 연결한다는 명쾌한 답변.
     * needs_clarification: 원하는 템플릿의 목적이나 주제가 너무 모호할 경우 true, 그렇지 않으면 false.
     * redirect_url: "/builder"
     * payload: 빌더 즉시 전달용 기획 데이터 객체:
       {
         "template_topic": "템플릿 주제",
         "suggested_title": "제안하는 노션 페이지 제목",
         "complexity": "simple" | "intermediate" | "advanced",
         "initial_prompt": "빌더 AI에게 즉시 전달할 구체적 프롬프트"
       }


[핵심 규칙 1: 첨부 문서 데이터(ATTACHED_DOCUMENT_DATA) 1:1 스키마 반영 및 다중 엑셀 병합]
- 사용자의 메시지에 [ATTACHED_DOCUMENT_DATA]...[/ATTACHED_DOCUMENT_DATA] 블록이 포함되어 있는 경우:
  * 이는 사용자가 첨부한 엑셀(.xlsx, .csv), 워드(.docx), 텍스트(.txt, .md, .json), PDF 문서의 실제 내부 데이터입니다.
  * 2개 이상의 엑셀 파일이 첨부된 경우, 각 파일별 데이터를 독립된 DB 스키마 배열(db_schema)로 1:1 온전히 구성하십시오.
  * 첨부 파일명이나 컬럼에 민원, 누수, 소음, 세대 등이 포함된 경우:
    - suggested_title: "[주민 민원 & 입주자 지원] 주민 민원 종합 관리 OS"
    - db_schema:
      1) "📋 주민 민원 접수 및 처리 마스터 DB" (접수번호, 접수일시, 민원유형, 발생동/호수, 처리상태 등)
      2) "💧 세대 누수 및 하자 정밀 점검 DB" (점검건명, 피해세대, 원인세대, 점검일시, 누수원인, 보수상태, 소요비용 등)
      3) "🔇 층간소음 분쟁 중재 및 관리 DB" (분쟁관리번호, 피해세대, 소음유발세대, 소음유형, 발생시간대, 중재차수, 중재상태 등)
  * 첨부 파일 데이터의 원본 컬럼 구조 및 10~20개 행의 실제 데이터 값을 sample_rows에 충실히 보존하십시오.

[핵심 규칙 2: Title Sanitizer (제목 도배 및 서술어 회귀 원천 차단)]
- "suggested_title" 및 payload 내 "title" 작성 시:
  * 절대로 사용자의 발화 전체나 서술어("만들어 줘", "반영해 주고", "해줘", "짜줘", "제작해줘"), 요청어("첨부", "참고하여"), 파일명("ardenhill.xlsx", ".csv" 등)을 제목에 그대로 넣지 마십시오!
  * 무조건 핵심 업무 도메인만을 담은 1줄의 고품격 공식 명사형(예: "[아덴힐 리조트] 객실 시설관리 통합 관제 OS", "[스마트 파이낸스] 회계 결산 지출 내역서 관제 OS", "[프로젝트 OS] 애자일 스프린트 마일스톤 OS")으로만 정제하여 출력하십시오.

[최종 출력 규격]
반드시 마크다운 따옴표(\`\`\`json) 없이 오직 파싱 가능한 순수 JSON 객체 1개만 출력하세요:
{
  "intent": "CHAT",
  "reply_message": "사용자에게 전달할 한국어 음성/화면 답변",
  "needs_clarification": false,
  "redirect_url": null,
  "payload": null
}
`;

// Gemini API 호출 헬퍼
async function callGeminiForOrchestrator(
  userText: string,
  history: Array<{ role: string; content: string }> = [],
  apiKey: string
): Promise<OrchestratorResponse> {
  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];

  // 대화 기록 구성
  const contents: any[] = [];
  
  // 멀티턴 이전 기록 반영
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach((h) => {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    });
  }

  // 현재 입력
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  });

  const requestPayload = {
    systemInstruction: {
      parts: [{ text: ORCHESTRATOR_SYSTEM_PROMPT }]
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  };

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`Model ${model} failed with status ${response.status}: ${errText}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // JSON 파싱 (마크다운 백틱 제거 보정)
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson) as OrchestratorResponse;

      // 필수 필드 정규화
      return {
        intent: parsed.intent || 'CHAT',
        reply_message: parsed.reply_message || '요청을 정상적으로 확인했습니다.',
        needs_clarification: Boolean(parsed.needs_clarification),
        redirect_url: parsed.redirect_url || null,
        payload: parsed.payload || null
      };
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  // 모든 Gemini 호출 실패 시 스마트 로컬 휴리스틱 Fallback
  return fallbackRuleBasedOrchestrator(userText, lastError?.message);
}

// 오프라인/키 누락 시 안전한 로컬 휴리스틱 폴백
function fallbackRuleBasedOrchestrator(userText: string, errorHint?: string): OrchestratorResponse {
  const text = userText.toLowerCase();

  // 1. 빌더 의도 감지
  if (text.includes('템플릿') || text.includes('대시보드') || text.includes('노션 페이지') || text.includes('빌더')) {
    return {
      intent: 'BUILDER',
      reply_message: '노션 템플릿을 생성해 드릴게요! 템플릿 빌더 작업실로 이동합니다.',
      needs_clarification: false,
      redirect_url: '/builder',
      payload: {
        template_topic: userText,
        suggested_title: `${userText} 템플릿`,
        complexity: 'intermediate',
        initial_prompt: userText
      }
    };
  }

  // 2. 개발 랩 의도 감지
  if (text.includes('에러') || text.includes('버그') || text.includes('오류') || text.includes('아이디어') || text.includes('프롬프트') || text.includes('개발')) {
    const isTrouble = text.includes('에러') || text.includes('버그') || text.includes('오류');
    return {
      intent: 'DEVLAB',
      reply_message: isTrouble 
        ? '트러블슈팅 일지로 개발 랩에 안전하게 기록해 드릴게요.'
        : '새로운 개발 아이디어로 개발 랩에 저장해 드릴게요.',
      needs_clarification: false,
      redirect_url: '/devlab',
      payload: {
        sub_type: isTrouble ? 'troubleshooting' : 'idea',
        title: userText.slice(0, 30),
        tags: ['개발', isTrouble ? '디버깅' : '아이디어'],
        content: userText
      }
    };
  }

  // 3. 라이프 허브 의도 감지
  if (text.includes('일정') || text.includes('예약') || text.includes('치과') || text.includes('회의') || text.includes('원') || text.includes('식비') || text.includes('할 일') || text.includes('투두')) {
    const isExpense = text.includes('원') || text.includes('식비') || text.includes('결제');
    const isTodo = text.includes('할 일') || text.includes('투두');
    return {
      intent: 'LIFE',
      reply_message: isExpense
        ? '가계부 지출 내역으로 라이프 허브에 등록해 드릴게요.'
        : isTodo
        ? '할 일 목록에 등록해 드릴게요.'
        : '일정으로 라이프 허브 캘린더에 기록해 드릴게요.',
      needs_clarification: false,
      redirect_url: '/life',
      payload: {
        sub_type: isExpense ? 'expense' : isTodo ? 'todo' : 'schedule',
        title: userText,
        category: isExpense ? '지출' : isTodo ? '할일' : '일정',
        priority: 'medium'
      }
    };
  }

  // 4. 일반 대화
  return {
    intent: 'CHAT',
    reply_message: errorHint 
      ? `안녕하세요! "${userText}"에 대해 말씀해 주셨군요. 무엇을 도와드릴까요?`
      : `안녕하세요! 무엇이든 편하게 말씀해 주세요. 일정, 가계부, 개발 트러블슈팅, 노션 템플릿 제작까지 도와드릴 수 있습니다.`,
    needs_clarification: false,
    redirect_url: null,
    payload: null
  };
}

// 1. Next.js App Router Web Fetch POST 핸들러
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const userText = (body.text || body.message || body.prompt || '').trim();
    const history = body.conversation_history || [];

    if (!userText) {
      return new Response(
        JSON.stringify({
          error: '입력 텍스트(text)가 비어 있습니다.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = 
      req.headers.get('x-gemini-api-key') || 
      process.env.GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY || 
      '';

    let result: OrchestratorResponse;
    if (apiKey) {
      result = await callGeminiForOrchestrator(userText, history, apiKey);
    } else {
      result = fallbackRuleBasedOrchestrator(userText, 'API_KEY_MISSING');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: '오케스트레이터 처리 중 오류가 발생했습니다: ' + err.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS preflight 핸들러
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key, x-user-email'
    }
  });
}

// 2. Node.js / Vercel Serverless Function 표준 핸들러
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, x-user-email');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const userText = (body.text || body.message || body.prompt || '').trim();
    const history = body.conversation_history || [];

    if (!userText) {
      return res.status(400).json({ error: '입력 텍스트(text)가 필요합니다.' });
    }

    const apiKey = 
      req.headers['x-gemini-api-key'] || 
      process.env.GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY || 
      '';

    let result: OrchestratorResponse;
    if (apiKey) {
      result = await callGeminiForOrchestrator(userText, history, apiKey);
    } else {
      result = fallbackRuleBasedOrchestrator(userText, 'API_KEY_MISSING');
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: '오케스트레이터 처리 실패: ' + err.message });
  }
}
