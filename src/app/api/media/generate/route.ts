// src/app/api/media/generate/route.ts
// 제4챕터 AI 미디어 랩 - 백엔드 Gemini 인텐트 분류 게이트웨이 & 무지성 실사 마스터 생성 완전 차단 파이프라인

export interface MediaGenerationRequest {
  userPrompt: string;
  history?: Array<{ role: string; content: string }>;
  activeSubject?: string;
  activeTitle?: string;
  currentContext?: {
    lastSubject?: string;
    lastBackground?: string;
  };
  aspectRatio?: '16:9' | '9:16' | '1:1';
  apiKey?: string;
}

export interface MediaGenerationResponse {
  success: boolean;
  intent: 'CHAT' | 'GENERATE';
  shouldGenerate: boolean;
  mode?: 'CREATE' | 'REPLACE_BG' | 'REPLACE_SUBJECT' | 'REFINE';
  imageUrl?: string;
  vpoPrompt?: string;
  displayTitle?: string;
  activeSubject?: string;
  noaResponse: string;
  version?: number;
}

interface IntentGateResult {
  intent: 'CHAT' | 'GENERATE';
  replyText: string;
  shouldGenerate: boolean;
  visualPrompt: string | null;
  displayTitle: string | null;
}

/**
 * 명시적 생성 거부 및 항의 발화 감지
 */
function isProtestOrNegative(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  return (
    p.includes('달라는 게 아니고') ||
    p.includes('달라는게 아니고') ||
    p.includes('달라는 게 아니') ||
    p.includes('달라는게 아니') ||
    p.includes('그리지 마') ||
    p.includes('그리지마') ||
    p.includes('생성하지 마') ||
    p.includes('생성하지마') ||
    p.includes('만들지 마') ||
    p.includes('만들지마') ||
    p.includes('아니라고') ||
    p.includes('그림 말고') ||
    p.includes('이미지 말고') ||
    p.includes('사진 말고') ||
    p.includes('영상 말고') ||
    p.includes('누가 그리래') ||
    p.includes('누가 만들래') ||
    p.includes('왜 자꾸') ||
    p.includes('그림 아니야') ||
    p.includes('이미지 아니야') ||
    p.includes('안 그린다고') ||
    p.includes('그만 그려') ||
    p.includes('그만 만들어')
  );
}

/**
 * 일상 질문, 날씨, 상식, 기능 문의 감지
 */
function isChatOrQuestion(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  if (isProtestOrNegative(prompt)) return true;

  const infoKeywords = [
    '날씨', '기온', '비 와', '비와', '눈 와', '눈와', '우산', '더워', '추워',
    '몇 시', '몇시', '며칠', '오늘 날짜', '무슨 요일', '식사', '배고파',
    '누구', '뭐해', '뭐야', '뭘 할 수', '기능', '도움말', '사용법', '어떻게',
    '설명해', '알려줘', '안녕', '반가워', '노아', 'noa', '버그', '에러', '왜'
  ];

  const hasInfoKeyword = infoKeywords.some((kw) => p.includes(kw));
  const isCreationCommand = p.includes('만들어줘') || p.includes('생성해줘') || p.includes('그려줘') || p.includes('작곡해줘');

  if (isCreationCommand) return false;
  return hasInfoKeyword || p.endsWith('?') || p.endsWith('??');
}

/**
 * 로컬 휴리스틱 인텐트 분류기 (Gemini 오프라인/키 부재 시 0ms 안전망)
 */
function classifyIntentLocally(prompt: string): IntentGateResult {
  const trimmed = prompt.trim();
  const p = trimmed.toLowerCase();

  if (isProtestOrNegative(p)) {
    return {
      intent: 'CHAT',
      replyText: '대단히 죄송합니다! 의도치 않게 이미지를 생성하여 불편을 드렸습니다. 🙇‍♂️\n명시적인 제작 요청("~만들어줘")이 있기 전까지는 어떤 이미지도 생성하지 않고 대화에만 집중하겠습니다.',
      shouldGenerate: false,
      visualPrompt: null,
      displayTitle: null
    };
  }

  if (p.includes('날씨') || p.includes('기온') || p.includes('비 와') || p.includes('눈 와')) {
    return {
      intent: 'CHAT',
      replyText: '제가 실시간 기상청 위성 센서에 직접 접속할 수는 없지만, 원하시는 날씨 무드(예: 비 내리는 서울 밤거리, 맑은 제주도 해변)의 미디어는 언제든 연출해 드릴 수 있습니다! 🌦️ 정확한 오늘 날씨는 기상청 앱에서 확인해 주세요.',
      shouldGenerate: false,
      visualPrompt: null,
      displayTitle: null
    };
  }

  if (isChatOrQuestion(p)) {
    return {
      intent: 'CHAT',
      replyText: `안녕하세요! 저는 AI 미디어 랩의 총괄 디렉터 **노아(NOA)**입니다. 🎬\n궁금하신 점이 있다면 편하게 질문해 주시고, 비주얼이나 영상을 제작하고 싶으실 땐 원하시는 장면을 "~만들어줘"라고 말씀해 주세요!`,
      shouldGenerate: false,
      visualPrompt: null,
      displayTitle: null
    };
  }

  // 실제 비주얼 생성 요청인 경우
  return {
    intent: 'GENERATE',
    replyText: `요청하신 [${trimmed.slice(0, 30)}] 비주얼을 FLUX 8K 실사 엔진으로 정밀 렌더링합니다.`,
    shouldGenerate: true,
    visualPrompt: null,
    displayTitle: trimmed.slice(0, 30)
  };
}

/**
 * 백엔드 Gemini 인텐트 분류 게이트웨이 (Strict Intent Router)
 */
async function classifyIntentWithGemini(
  userPrompt: string,
  history?: Array<{ role: string; content: string }>,
  apiKeyParam?: string
): Promise<IntentGateResult> {
  const apiKey =
    apiKeyParam ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY : '') ||
    (typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? (globalThis as any).localStorage?.getItem('gemini_api_key') || ''
      : '');

  if (!apiKey) {
    return classifyIntentLocally(userPrompt);
  }

  const systemInstruction = `당신은 AI 미디어 랩의 총괄 크리에이티브 디렉터 "노아(NOA)"의 인텐트 게이트웨이입니다.
사용자의 대화 맥락과 현재 발화를 분석하여 다음 JSON 스키마로만 엄격하게 응답하십시오.

[응답 JSON 스키마]
{
  "intent": "CHAT" | "GENERATE",
  "replyText": string,
  "shouldGenerate": boolean,
  "visualPrompt": string | null,
  "displayTitle": string | null
}

[분류 원칙]
1. intent: "CHAT" (shouldGenerate: false)
   - 인사, 날씨 질문, 일상 대화, 일반 상식/지식 질문 ("오늘 날씨 어때?", "비 와?", "너 누구야?", "몇 시야?")
   - 미디어 랩 사용법 및 기능 문의 ("어떻게 쓰는 거야?", "기능 알려줘")
   - 항의, 거부, 취소 ("이미지 그려 달라는 게 아니고", "그림 그리지 마", "왜 자꾸 그려", "취소해", "그만해")
   - replyText: 총괄 PD 노아로서 친절하고 지적인 한국어 구어체 답변. 날씨 질문이면 재치 있는 기상 안내, 항의면 즉각적인 정중한 사과 및 요청 수용.
   - visualPrompt: null
   - displayTitle: null

2. intent: "GENERATE" (shouldGenerate: true)
   - 캐릭터, 인물, 풍경, 썸네일, 사진, 오브젝트, 영상 씬 등 실제 비주얼의 창작이나 구체적 묘사/수정을 요청하는 발화.
   - replyText: 어떤 컨셉으로 비주얼을 렌더링하는지 전문적인 노아의 디렉팅 멘트.
   - visualPrompt: FLUX 8K 렌더링용 고품질 영문 디퓨전 프롬프트 (8k, photorealistic, cinematic lighting 포함).
   - displayTitle: 생성할 이미지의 깔끔한 한글 타이틀 (절대로 '실사 마스터' 같은 군더더기 어구를 붙이지 말 것).`;

  const conversationContext = (history || [])
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'User' : 'Noa'}: ${m.content}`)
    .join('\n');

  const userQuery = conversationContext
    ? `[이전 대화 맥락]\n${conversationContext}\n\n[현재 사용자 발화]\n${userPrompt}`
    : `[현재 사용자 발화]\n${userPrompt}`;

  const requestPayload = {
    contents: [{ role: 'user', parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

  for (const model of candidateModels) {
    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) continue;

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson) as IntentGateResult;

      if (parsed && (parsed.intent === 'CHAT' || parsed.intent === 'GENERATE')) {
        return {
          intent: parsed.intent,
          replyText: parsed.replyText || '네, 말씀해 주신 내용을 확인했습니다.',
          shouldGenerate: Boolean(parsed.shouldGenerate),
          visualPrompt: parsed.visualPrompt || null,
          displayTitle: parsed.displayTitle || null
        };
      }
    } catch (_) {
      continue;
    }
  }

  return classifyIntentLocally(userPrompt);
}

/**
 * 한국어 수식어 및 뉘앙스 정제기 (영문 토큰화)
 */
function normalizeModifiers(prompt: string): {
  torsoTokens: string;
  hairFaceTokens: string;
  actionPropsTokens: string;
  moodEnvironmentTokens: string;
  detectedRefinements: string[];
} {
  const p = prompt.toLowerCase();
  const detectedRefinements: string[] = [];

  let torsoTokens = '';
  if (p.includes('탈의') || p.includes('벗고') || p.includes('벗은') || p.includes('상의') || p.includes('맨몸') || p.includes('근육')) {
    torsoTokens = 'weathered muscular rugged torso, bare-chested mountain laborer, battle-hardened physique, highly defined sinewy muscle anatomy';
    detectedRefinements.push('근육질 체형');
  }

  let hairFaceTokens = '';
  if (p.includes('터프') || p.includes('거친') || p.includes('헝클') || p.includes('덥수룩') || p.includes('야성')) {
    hairFaceTokens = 'wild unkempt long silver hair, intense gaze, rugged windblown beard, weathered masculine facial wrinkles';
    detectedRefinements.push('야성미 넘치는 은발·수염');
  }

  let actionPropsTokens = '';
  if (p.includes('큰 나무') || p.includes('큰 도끼') || p.includes('고목') || p.includes('거대')) {
    actionPropsTokens = 'swinging a massive heavy battle-axe with both hands into a giant ancient oak tree log, dynamic wood chunks flying in midair';
    detectedRefinements.push('거대한 도끼와 고목');
  } else if (p.includes('장작') || p.includes('도끼')) {
    actionPropsTokens = 'chopping a large wood log with an iron woodcutter axe, flying wood splinters';
  }

  let moodEnvironmentTokens = '';
  if (p.includes('판타지') || p.includes('영화') || p.includes('다크') || p.includes('웅장') || p.includes('시네마')) {
    moodEnvironmentTokens = 'epic dark fantasy cinematic atmosphere, volumetric mist and moody fog, dramatic rim lighting, mystical mountain forest';
    detectedRefinements.push('다크 판타지 시네마틱 무드');
  }

  return { torsoTokens, hairFaceTokens, actionPropsTokens, moodEnvironmentTokens, detectedRefinements };
}

/**
 * 주어 락 분석 헬퍼
 */
function analyzeContextAndSubject(
  prompt: string,
  inheritedSubject?: string,
  history?: Array<{ role: string; content: string }>
): {
  mode: 'CREATE' | 'REPLACE_BG' | 'REPLACE_SUBJECT' | 'REFINE';
  subject: string;
  activeSubjectKey: string;
} {
  const p = prompt.toLowerCase();

  const hasHistorySubject = history?.some((h) =>
    h.content.includes('70대') || h.content.includes('노인') || h.content.includes('할아버지') || h.content.includes('장작')
  );

  const isFeedback = p.includes('위') || p.includes('상의') || p.includes('머리') || p.includes('도끼') || p.includes('수정') || p.includes('바꿔') || p.includes('더 ');

  if ((inheritedSubject || hasHistorySubject) && isFeedback && !p.includes('완전 다른') && !p.includes('새로')) {
    const baseSubject = inheritedSubject || '70-year-old rugged muscular Korean woodsman with unkempt white hair and beard';
    return {
      mode: 'REFINE',
      subject: baseSubject,
      activeSubjectKey: '70-year-old rugged muscular Korean woodsman with unkempt white hair and beard'
    };
  }

  const isBgSwap = p.includes('배경') || p.includes('바닷가') || p.includes('해변') || p.includes('사막') || p.includes('설산');
  if (isBgSwap && (inheritedSubject || hasHistorySubject)) {
    return {
      mode: 'REPLACE_BG',
      subject: inheritedSubject || '70-year-old robust Korean woodsman with white beard',
      activeSubjectKey: inheritedSubject || '70-year-old robust Korean woodsman with white beard'
    };
  }

  let subject = '';
  let activeSubjectKey = '';

  if (p.includes('70대') || p.includes('노인') || p.includes('할아버지') || p.includes('장작')) {
    subject = 'A robust energetic 70-year-old Korean grandfather with thick white beard and white hair';
    activeSubjectKey = '70-year-old Korean grandfather';
  } else if (p.includes('금발') || p.includes('소녀') || p.includes('아이')) {
    subject = 'An adorable 6-year-old cute little girl with wavy golden blonde hair and innocent sparkling eyes';
    activeSubjectKey = '6-year-old cute blonde girl';
  } else if (p.includes('패션') || p.includes('디렉터') || p.includes('단발')) {
    subject = 'A chic 30-year-old Korean woman fashion director with black bob haircut, wearing a bespoke trench coat';
    activeSubjectKey = '30-year-old Korean woman fashion director';
  } else if (p.includes('ceo') || p.includes('대표')) {
    subject = 'A distinguished global executive corporate CEO in a tailored dark bespoke suit';
    activeSubjectKey = 'global executive CEO';
  } else {
    subject = inheritedSubject || `A photorealistic subject representing ${prompt.slice(0, 30)}`;
    activeSubjectKey = subject;
  }

  return { mode: 'CREATE', subject, activeSubjectKey };
}

/**
 * 시맨틱 미디어 데이터 합성 메인 함수 (Gemini 게이트웨이 탑재)
 */
export async function generateMediaData(
  userPrompt: string,
  history?: Array<{ role: string; content: string }>,
  activeSubject?: string,
  activeTitle?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  apiKeyParam?: string
): Promise<MediaGenerationResponse> {
  // 1. 최상단 Gemini 인텐트 분류 게이트웨이 실행
  const gateResult = await classifyIntentWithGemini(userPrompt, history, apiKeyParam);

  // CHAT 판정 시: 이미지 생성 완전 차단 및 지능형 텍스트 Q&A 즉결 반환!
  if (!gateResult.shouldGenerate || gateResult.intent === 'CHAT') {
    return {
      success: true,
      intent: 'CHAT',
      shouldGenerate: false,
      noaResponse: gateResult.replyText
    };
  }

  // 2. GENERATE 판정 시: 비주얼 렌더링 파이프라인 가동
  const { mode, subject, activeSubjectKey } = analyzeContextAndSubject(userPrompt, activeSubject, history);
  const modifiers = normalizeModifiers(userPrompt);

  let vpoPrompt = gateResult.visualPrompt;
  if (!vpoPrompt) {
    const promptParts: string[] = [subject];
    if (modifiers.torsoTokens) promptParts.push(modifiers.torsoTokens);
    if (modifiers.hairFaceTokens) promptParts.push(modifiers.hairFaceTokens);
    if (modifiers.actionPropsTokens) {
      promptParts.push(modifiers.actionPropsTokens);
    } else if (userPrompt.includes('장작') || userPrompt.includes('도끼') || mode === 'REFINE') {
      promptParts.push('swinging a heavy battle axe chopping wood with dynamic wood fragments');
    }

    if (modifiers.moodEnvironmentTokens) {
      promptParts.push(modifiers.moodEnvironmentTokens);
    } else if (userPrompt.includes('바다') || userPrompt.includes('해변')) {
      promptParts.push('on a sunny ocean beach with turquoise waves crashing, golden sandy shore');
    } else {
      promptParts.push('deep in an alpine mountain pine forest with scattered wooden logs, atmospheric volumetric daylight');
    }

    promptParts.push(
      'Hasselblad H6D-100c medium format, 80mm prime lens f/1.8, Rembrandt cinematic lighting, hyperrealistic 8k, photorealistic masterpiece, highly detailed skin texture, micro pores, volumetric depth of field, no watermark'
    );
    vpoPrompt = promptParts.join(', ');
  }

  // 해상도 도출
  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1024;
    height = 1024;
  }

  const seed = Math.floor(Math.random() * 9000000) + 1000000;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(vpoPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

  // 타이틀 산출: ❌ "실사 마스터" 영구 삭제, 정제된 제목만 부여
  let displayTitle = gateResult.displayTitle || activeTitle || userPrompt.slice(0, 30).trim();
  displayTitle = displayTitle.replace(/\s*실사\s*마스터/g, '').trim();

  const noaResponse = gateResult.replyText || `요청하신 [${displayTitle}] 비주얼을 FLUX 8K 실사 엔진으로 정밀 렌더링하여 캔버스에 안착했습니다.`;

  return {
    success: true,
    intent: 'GENERATE',
    shouldGenerate: true,
    mode,
    imageUrl,
    vpoPrompt,
    displayTitle,
    activeSubject: activeSubjectKey,
    noaResponse
  };
}

/**
 * Next.js / Web Standards POST Handler
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as MediaGenerationRequest;
    const activeSub = body.activeSubject || body.currentContext?.lastSubject;
    const apiKey = req.headers.get('x-gemini-api-key') || body.apiKey;

    const result = await generateMediaData(
      body.userPrompt,
      body.history,
      activeSub,
      body.activeTitle,
      body.aspectRatio,
      apiKey || undefined
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
