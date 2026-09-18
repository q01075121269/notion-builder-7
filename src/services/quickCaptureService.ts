import type { 
  QuickCaptureAnalysisResult, 
  RoutedNotionTask 
} from '../types/quickCapture';
import { parseQuickTextLocally } from './quickCaptureLocalParser';
import type { CreatedNotionResource } from '../types/notion';
import { compressImageToJpeg } from './imageCompressor';

const ROUTING_SYSTEM_PROMPT = `
당신은 모바일 생산성 및 노션(Notion) 데이터베이스 자동 분류 라우팅 전문가입니다.
사용자가 음성이나 휘갈겨 쓴 메모로 전달한 자연어 텍스트를 정밀 분석하여, 맞춤법을 교정하고 맥락에 맞추어 1개 이상의 독립적인 노션 작업 항목(Multi-intent Tasks)으로 분할하세요.

[분류 가능한 6대 인텐트(Intent)]
1. schedule: 약속, 미팅, 진료, 마감일 등 특정 시간/날짜가 포함된 일정
2. expense: 식비, 쇼핑, 결제, 지출 등 금액과 소비 내역이 포함된 가계부
3. todo: 오늘 할 일, 체크리스트, 완료해야 할 행동
4. contact: 사람 이름, 회사, 전화번호, 이메일 등 인맥 정보
5. idea: 영감, 독서 인용구, 번뜩이는 생각, 기획 메모
6. general: 위 분류에 명확히 속하지 않는 일반 메모

[핵심 분할 규칙]
- 사용자가 "내일 오후 3시 치과 가고, 점심 식비 12,000원 썼어"라고 복합적으로 말하면:
  반드시 [일정] 작업 1개와 [가계부] 작업 1개로 명확히 분리하여 2개의 작업 배열로 반환하세요.
- 오늘 날짜 기준(2026-09-18)으로 "내일", "모레", "다음 주 화요일", "오후 3시" 등을 정확한 날짜/시간(YYYY-MM-DD 또는 YYYY-MM-DD HH:mm) 문자열로 변환하세요.

[응답 JSON 규격]
반드시 마크다운 따옴표 없이 순수한 유효 JSON 객체만 반환하세요:
{
  "rawInput": "사용자 원문",
  "correctedText": "맞춤법 및 문장이 매끄럽게 교정된 텍스트",
  "detectedType": "general_text",
  "tasks": [
    {
      "id": "task-1",
      "intent": "schedule",
      "targetDbHint": "일정/캘린더 DB",
      "title": "치과 진료 방문",
      "summary": "내일 오후 3시 치과 예약",
      "suggestedIcon": "🦷",
      "tags": ["건강", "예약"],
      "properties": {
        "이름": "치과 진료 방문",
        "일정": "2026-09-19 15:00",
        "상태": "시작 전",
        "분류": "일정"
      }
    },
    {
      "id": "task-2",
      "intent": "expense",
      "targetDbHint": "가계부/지출 DB",
      "title": "점심 식사",
      "summary": "점심 식비 12,000원 결제",
      "suggestedIcon": "🍱",
      "tags": ["식비", "지출"],
      "properties": {
        "상호명": "점심 식사",
        "이름": "점심 식사",
        "금액": 12000,
        "결제일": "2026-09-18",
        "분류": "식비",
        "상태": "결제 완료"
      }
    }
  ]
}
`;

const VISION_SYSTEM_PROMPT = `
당신은 이미지 분석 및 OCR 정보 추출 전문가입니다.
사용자가 촬영하거나 업로드한 영수증, 명함, 도서/손글씨 메모 사진을 분석하여 알맞은 노션 데이터베이스 항목으로 변환하세요.

[이미지 유형별 추출 규칙]
1. 영수증 (receipt):
   - 상호명, 결제일시(YYYY-MM-DD), 결제 총금액(숫자), 품목 목록
   - intent: "expense", targetDbHint: "가계부/지출 DB", suggestedIcon: "🧾"
   - properties는 반드시 가계부 DB 규격에 맞춰 [상호명, 금액, 결제일, 분류, AI 메모]를 채우세요.
2. 명함 (business_card):
   - 이름, 회사명, 부서/직함, 전화번호/휴대폰, 이메일, 주소
   - intent: "contact", targetDbHint: "인맥/연락처 DB", suggestedIcon: "📇"
3. 도서 또는 손글씨 메모 (book_memo):
   - 핵심 인용 문장 또는 메모 본문, 도서명(추정 가능 시), 저자, 핵심 키워드
   - intent: "idea", targetDbHint: "독서/아이디어 DB", suggestedIcon: "📖"

[응답 JSON 규격]
순수 JSON 형식으로 응답하세요:
{
  "rawInput": "이미지 자동 인식 결과 요약",
  "correctedText": "정돈된 요약문",
  "detectedType": "receipt",
  "tasks": [
    {
      "id": "task-1",
      "intent": "expense",
      "targetDbHint": "가계부/지출 DB",
      "title": "스타벅스 강남점",
      "summary": "스타벅스 카페라떼 5,000원 결제",
      "suggestedIcon": "🧾",
      "tags": ["영수증", "식비"],
      "properties": {
        "상호명": "스타벅스 강남점",
        "이름": "스타벅스 강남점",
        "금액": 5000,
        "결제일": "2026-09-18",
        "분류": "식비",
        "상태": "결제 완료",
        "AI 메모": "카페라떼 1잔 5,000원 결제"
      }
    }
  ]
}
`;

/**
 * Gemini 모델 식별자 정규화:
 * 'models/gemini-3.6-flash' 처럼 접두사가 포함된 경우 'gemini-3.6-flash'로 정규화
 */
export function normalizeGeminiModel(model?: string): string {
  if (!model || typeof model !== 'string') return 'gemini-3.6-flash';
  const cleaned = model.replace(/^models\//, '').trim();
  return cleaned || 'gemini-3.6-flash';
}

// 텍스트 분석용 최신 모델 (종료된 1.5-flash, 2.0-flash 제외)
const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash'
];

/**
 * 프록시 및 Google API 직접 호출, 그리고 모델 404 발생 시 안전한 다단계 Fallback 실행 엔진
 */
async function callGeminiGenerateContentWithFallback(
  requestBody: any,
  apiKey: string,
  preferredModel?: string
): Promise<QuickCaptureAnalysisResult> {
  const normalizedPreferred = normalizeGeminiModel(preferredModel);
  // 최신 안정 모델(gemini-3.6-flash)을 최우선으로 배치하고 선호 모델 및 대체 모델 체인 구성
  const candidateModels = Array.from(
    new Set([
      'gemini-3.6-flash',
      normalizedPreferred,
      ...FALLBACK_MODELS
    ])
  );

  let lastError: any = null;
  const attemptedModels = new Set<string>();

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    if (attemptedModels.has(currentModel)) continue;
    attemptedModels.add(currentModel);

    try {
      let res: Response | null = null;

      // 1단계: /api/gemini 프록시 우선 호출
      try {
        const proxyRes = await fetch(`/api/gemini?model=${currentModel}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': (apiKey || '').trim()
          },
          body: JSON.stringify(requestBody)
        });

        // 프록시 호출 성공 시
        if (proxyRes.ok) {
          res = proxyRes;
        } else {
          const errBodyText = await proxyRes.text().catch(() => '');

          // 구글 API 응답에서 "use models/gemini-X.X-flash" 추천 모델 자동 감지
          const recMatch = errBodyText.match(/use models\/([a-zA-Z0-9._-]+)/i);
          if (recMatch && recMatch[1]) {
            const recModel = recMatch[1].trim();
            if (!attemptedModels.has(recModel)) {
              candidateModels.splice(i + 1, 0, recModel);
            }
          }

          const isModelNotFound =
            proxyRes.status === 404 &&
            (errBodyText.includes('not found') ||
             errBodyText.includes('NOT_FOUND') ||
             errBodyText.includes('no longer available') ||
             errBodyText.includes('is not found for API version'));

          if (isModelNotFound && i < candidateModels.length - 1) {
            console.warn(
              `[QuickCapture] 모델 '${currentModel}' 지원 불가 확인. 다음 대체 모델('${candidateModels[i + 1]}')로 즉각 Fallback 합니다.`
            );
            continue;
          }

          throw new Error(`PROXY_FAILED_${proxyRes.status}_${errBodyText}`);
        }
      } catch (proxyErr: any) {
        if (proxyErr.message?.includes('401') || proxyErr.message?.includes('API Key')) {
          throw proxyErr;
        }

        // 2단계: 프록시 미지원 환경 대비 Google Gemini API 직접 호출
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;
        try {
          res = await fetch(directUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey.trim()
            },
            body: JSON.stringify(requestBody)
          });
        } catch (directNetErr: any) {
          console.warn(`[QuickCapture] Direct API 네트워크 실패 (${currentModel}):`, directNetErr);
          if (i < candidateModels.length - 1) {
            continue;
          }
          throw directNetErr;
        }
      }

      if (!res || !res.ok) {
        const errText = res ? await res.text().catch(() => '') : '응답 없음';
        const status = res ? res.status : 0;

        // 구글 API 추천 모델 추출
        const recMatch = errText.match(/use models\/([a-zA-Z0-9._-]+)/i);
        if (recMatch && recMatch[1]) {
          const recModel = recMatch[1].trim();
          if (!attemptedModels.has(recModel)) {
            candidateModels.splice(i + 1, 0, recModel);
          }
        }

        const isNotFound =
          status === 404 ||
          errText.includes('not found') ||
          errText.includes('is not found for API version') ||
          errText.includes('no longer available') ||
          errText.includes('NOT_FOUND');

        if (isNotFound && i < candidateModels.length - 1) {
          const nextModel = candidateModels[i + 1];
          console.warn(
            `[QuickCapture] 모델 '${currentModel}' 404/지원종료 감지. 대체 모델 '${nextModel}'로 Fallback 재시도합니다.`
          );
          lastError = new Error(`모델 '${currentModel}' 지원 종료: ${errText}`);
          continue;
        }

        throw new Error(`Gemini AI 분석 실패 (${status}): ${errText || '네트워크 오류'}`);
      }

      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error(`Gemini 모델(${currentModel})로부터 분석 결과를 수신하지 못했습니다.`);
      }

      try {
        return JSON.parse(rawJson);
      } catch {
        const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      lastError = err;

      if (
        err.message?.includes('401') ||
        err.message?.includes('403') ||
        err.message?.includes('API_KEY_INVALID') ||
        err.message?.includes('API Key')
      ) {
        throw err;
      }

      if (i < candidateModels.length - 1) {
        const nextModel = candidateModels[i + 1];
        console.warn(
          `[QuickCapture] 모델 '${currentModel}' 오류(${err.message}). 다음 모델 '${nextModel}'로 자동 Fallback 시도합니다.`
        );
        continue;
      }
    }
  }

  throw lastError || new Error('모든 Gemini 모델 Fallback 시도에 실패했습니다.');
}

/**
 * 1. 텍스트/음성 멀티 인텐트 분석 (Gemini 프록시 & Fallback 호출)
 */
export async function analyzeAndRouteQuickText(
  text: string,
  apiKey: string,
  preferredModel?: string
): Promise<QuickCaptureAnalysisResult> {
  if (!text || !text.trim()) {
    throw new Error('분석할 텍스트 내용이 비어 있습니다.');
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `다음 음성/메모 내용을 분석하고 다중 작업으로 분할하세요:\n"${text}"` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: ROUTING_SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  try {
    return await callGeminiGenerateContentWithFallback(requestBody, apiKey, preferredModel);
  } catch (err: any) {
    console.warn('[QuickCapture] Gemini API 통신 불가/과부하 감지 -> 즉각 로컬 지능형 파서로 안전 전환:', err);
    return parseQuickTextLocally(text);
  }
}

/**
 * 비전 OCR 전용 호출 함수 (레거시 모델 폴백 없이 오직 gemini-3.6-flash 단일 엔드포인트만 사용)
 */
async function callGeminiSingleVisionModel(
  requestBody: any,
  apiKey: string
): Promise<QuickCaptureAnalysisResult> {
  const VISION_MODEL = 'gemini-3.6-flash';
  let res: Response | null = null;
  let lastErrorText = '';

  // 1단계: /api/gemini 프록시 호출
  try {
    const proxyRes = await fetch(`/api/gemini?model=${VISION_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': (apiKey || '').trim()
      },
      body: JSON.stringify(requestBody)
    });

    if (proxyRes.ok) {
      res = proxyRes;
    } else {
      lastErrorText = await proxyRes.text().catch(() => '');
      if (proxyRes.status === 429) {
        throw new Error('Google AI 요청 한도(429 Too Many Requests)를 초과했습니다. 1~2분 후 다시 시도해 주세요.');
      }
    }
  } catch (proxyErr: any) {
    if (proxyErr.message?.includes('429') || proxyErr.message?.includes('401') || proxyErr.message?.includes('API Key')) {
      throw proxyErr;
    }
  }

  // 2단계: Direct Google API 호출
  if (!res) {
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey.trim()}`;
    res = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(requestBody)
    });
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text().catch(() => '') : lastErrorText;
    const status = res ? res.status : 0;
    if (status === 429) {
      throw new Error('Google AI 비전 한도(429)를 초과했습니다. 잠시 대기 후 다시 시도해 주세요.');
    }
    throw new Error(`비전 OCR 분석 실패 (${status}): ${errText || '네트워크 오류'}`);
  }

  const data = await res.json();
  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    throw new Error('Gemini Vision 모델로부터 분석 결과를 수신하지 못했습니다.');
  }

  try {
    return JSON.parse(rawJson);
  } catch {
    const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

/**
 * 2. 이미지 멀티모달 Vision OCR 분석 (오직 gemini-3.6-flash 단일 엔드포인트 & 클라이언트 압축 보장)
 */
export async function analyzeImageWithGeminiVision(
  base64DataUrl: string,
  apiKey: string
): Promise<QuickCaptureAnalysisResult> {
  // 브라우저 Canvas를 통해 최대 1024px, JPEG 0.8로 압축하여 429 토큰 폭증 방어
  const compressedDataUrl = await compressImageToJpeg(base64DataUrl, 1024, 0.8).catch(() => base64DataUrl);
  const [header, base64Data] = compressedDataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: '이 영수증/명함/이미지를 정밀 분석하여 가계부(상호명, 금액, 결제일) 또는 해당 노션 DB 규격 JSON으로 추출하세요.'
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: VISION_SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  return await callGeminiSingleVisionModel(requestBody, apiKey);
}

function parseExpenseAmount(val: any, fallbackText = ''): number {
  if (typeof val === 'number') return val;
  if (val) {
    const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
    if (!isNaN(num) && num > 0) return num;
  }
  if (fallbackText) {
    const match = fallbackText.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)\s*(?:원|만원|krw)/i) ||
                  fallbackText.replace(/,/g, '').match(/([0-9]{3,})/);
    if (match && match[1]) {
      const parsed = Number(match[1]);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/**
 * 3. 분할된 각 작업을 사용자의 노션 워크스페이스에 즉시 생성
 */
export async function dispatchRoutedTasksToNotion(
  tasks: RoutedNotionTask[],
  notionApiKey: string,
  resource: CreatedNotionResource | null
): Promise<{ successCount: number; pageUrls: string[]; errors: string[] }> {
  // 모바일 Haptic 진동 피드백
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 50, 70]);
    } catch {
      // ignore
    }
  }

  if (!notionApiKey || !resource || (!resource.pageId && (!resource.databases || resource.databases.length === 0))) {
    return {
      successCount: 0,
      pageUrls: [],
      errors: ['노션 워크스페이스 연동 정보가 없습니다. 상단에서 노션을 먼저 연동해 주세요.']
    };
  }

  const headers = {
    'Authorization': `Bearer ${notionApiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  const pageUrls: string[] = [];
  const errors: string[] = [];
  let successCount = 0;

  for (const task of tasks) {
    // 1. 사용자 선택 DB 및 마스터 DB 조회
    const userSelectedDbId = typeof window !== 'undefined' ? localStorage.getItem('selected_notion_db_id') : null;
    const userSelectedExpenseDbId = typeof window !== 'undefined' ? localStorage.getItem('selected_expense_db_id') : null;
    const masterLifeDbId = typeof window !== 'undefined' ? localStorage.getItem('master_life_hub_db_id') : null;
    const masterExpenseDbId = typeof window !== 'undefined' ? localStorage.getItem('master_expense_db_id') : null;
    const hasDatabases = Boolean(resource.databases && resource.databases.length > 0);

    // 지출/결제/금액 포함 여부 정밀 판정
    const rawCombinedText = `${task.title} ${task.summary || ''} ${JSON.stringify(task.properties || {})}`;
    const isExpenseTask =
      task.intent === 'expense' ||
      Boolean(task.properties?.['금액']) ||
      Boolean(task.properties?.['상호명']) ||
      /(?:지출|결제|금액|원|영수증|소비|식비|쇼핑|구입|구매)/.test(rawCombinedText);

    let targetDbId: string | null = null;
    let isExpenseDb = false;

    if (isExpenseTask) {
      // 1순위: 지정된 가계부 DB 또는 마스터 가계부 DB
      if (userSelectedExpenseDbId) {
        targetDbId = userSelectedExpenseDbId;
        isExpenseDb = true;
      } else if (masterExpenseDbId) {
        targetDbId = masterExpenseDbId;
        isExpenseDb = true;
      } else if (hasDatabases) {
        // 워크스페이스 내 가계부 DB 자동 탐색
        const autoExpenseDb = resource.databases.find(d => {
          const n = d.name.toLowerCase();
          return n.includes('가계부') || n.includes('지출') || n.includes('비용') || n.includes('소비');
        });
        if (autoExpenseDb) {
          targetDbId = autoExpenseDb.id;
          isExpenseDb = true;
        }
      }

      // 가계부 DB가 없거나 미연동된 상태인 경우 -> 라이프 허브(일정표)로 안전 폴백
      if (!targetDbId) {
        targetDbId = userSelectedDbId || masterLifeDbId || (hasDatabases ? resource.databases[0].id : null);
        isExpenseDb = false;
      }
    } else {
      // 일반 일정/할 일/아이디어 등
      targetDbId = userSelectedDbId || masterLifeDbId || null;
      if (!targetDbId && hasDatabases) {
        const matchedDb = resource.databases.find(d => {
          const name = d.name.toLowerCase();
          if (task.intent === 'schedule') return name.includes('라이프') || name.includes('일정') || name.includes('달력') || name.includes('캘린더');
          if (task.intent === 'todo') return name.includes('할 일') || name.includes('태스크');
          return name.includes('라이프') || name.includes('일정');
        }) || resource.databases[0];
        if (matchedDb) targetDbId = matchedDb.id;
      }
    }

    const matchedDbInfo = resource.databases?.find(d => d.id === targetDbId);
    const isMasterLifeHub = targetDbId === masterLifeDbId || Boolean(matchedDbInfo?.name.includes('라이프'));
    const isDatabaseMode = Boolean(targetDbId);
    let pagePayload: Record<string, any>;

    if (isDatabaseMode && targetDbId) {
      const payloadProperties: Record<string, any> = {};

      if (isExpenseDb) {
        // ▶ [가계부 DB 규격 전송] (상호명, 금액, 결제일, 분류, AI 메모)
        const amount = parseExpenseAmount(task.properties?.['금액'], rawCombinedText);
        const titleText = task.properties?.['상호명'] || task.properties?.['이름'] || task.title || '지출 내역';
        const dateRaw = task.properties?.['결제일'] || task.properties?.['날짜'] || task.properties?.['일정'] || new Date().toISOString().split('T')[0];

        payloadProperties['상호명'] = { title: [{ type: 'text', text: { content: titleText } }] };
        payloadProperties['이름'] = { title: [{ type: 'text', text: { content: titleText } }] };
        if (amount > 0) {
          payloadProperties['금액'] = { number: amount };
        }
        payloadProperties['결제일'] = { date: { start: String(dateRaw).split(' ')[0] } };
        payloadProperties['날짜'] = { date: { start: String(dateRaw).split(' ')[0] } };
        payloadProperties['분류'] = { select: { name: task.properties?.['분류'] || '식비' } };
        payloadProperties['AI 메모'] = { rich_text: [{ type: 'text', text: { content: task.summary || task.title } }] };
      } else if (isExpenseTask) {
        // ▶ [가계부 DB 미연동 시 안전 합산] 라이프 허브 표의 'AI 메모' 및 '분류' 속성에 [지출: OO원] 형태로 기록
        const amount = parseExpenseAmount(task.properties?.['금액'], rawCombinedText);
        const formattedAmount = amount > 0 ? `${amount.toLocaleString()}원` : '금액 미상';
        const memoContent = `[지출: ${formattedAmount}] ${task.summary || task.title}`;
        const dateRaw = task.properties?.['일정'] || task.properties?.['날짜'] || task.properties?.['결제일'] || new Date().toISOString().split('T')[0];

        payloadProperties['이름'] = { title: [{ type: 'text', text: { content: task.title } }] };
        payloadProperties['title'] = { title: [{ type: 'text', text: { content: task.title } }] };
        payloadProperties['일정'] = { date: { start: String(dateRaw).split(' ')[0] } };
        payloadProperties['날짜'] = { date: { start: String(dateRaw).split(' ')[0] } };
        payloadProperties['분류'] = { select: { name: '지출' } };
        payloadProperties['AI 메모'] = { rich_text: [{ type: 'text', text: { content: memoContent } }] };
      } else if (isMasterLifeHub) {
        // ▶ [마스터 라이프 허브 DB 일정/할일/아이디어 전송]
        payloadProperties['이름'] = { title: [{ type: 'text', text: { content: task.title } }] };
        const dateRaw = task.properties?.['일정'] || task.properties?.['날짜'] || task.properties?.['date'];
        if (dateRaw) {
          payloadProperties['일정'] = { date: { start: String(dateRaw).split(' ')[0] } };
        }

        const statusRaw = String(task.properties?.['상태'] || task.properties?.['status'] || '').trim();
        if (statusRaw === '진행 중' || statusRaw === '완료') {
          payloadProperties['상태'] = { status: { name: statusRaw } };
        }

        const intentMap: Record<string, string> = {
          schedule: '일정',
          todo: '할 일',
          idea: '아이디어',
          expense: '지출'
        };
        const category = intentMap[task.intent] || '메모';
        payloadProperties['분류'] = { select: { name: category } };

        if (task.summary || task.title) {
          payloadProperties['AI 메모'] = {
            rich_text: [{ type: 'text', text: { content: task.summary || task.title } }]
          };
        }
      } else {
        // ▶ [일반 기존 DB 범용 매핑]
        payloadProperties['title'] = { title: [{ type: 'text', text: { content: task.title } }] };
        payloadProperties['이름'] = { title: [{ type: 'text', text: { content: task.title } }] };
        if (task.properties) {
          Object.entries(task.properties).forEach(([key, val]) => {
            if (key === '이름' || key === 'title') return;
            const strVal = String(val).trim();
            if (key.includes('일정') || key.includes('날짜') || key.includes('date') || key.includes('결제일')) {
              payloadProperties[key] = { date: { start: strVal.split(' ')[0] } };
            } else if (key.includes('금액') || typeof val === 'number') {
              const num = Number(strVal.replace(/[^0-9.-]+/g, ''));
              if (!isNaN(num)) payloadProperties[key] = { number: num };
            } else if (key.includes('상태') || key.includes('status')) {
              if (['진행 중', '완료', 'In progress', 'Done'].includes(strVal)) {
                payloadProperties[key] = { status: { name: strVal } };
              }
            } else {
              payloadProperties[key] = { rich_text: [{ type: 'text', text: { content: strVal } }] };
            }
          });
        }
      }

      pagePayload = {
        parent: { database_id: targetDbId },
        icon: { type: 'emoji', emoji: task.suggestedIcon || '⚡' },
        properties: payloadProperties,
        children: [
          {
            object: 'block',
            type: 'callout',
            callout: {
              rich_text: [{ type: 'text', text: { content: `⚡ 1초 퀵 캡처 자동 등록: ${task.summary || task.title}` } }],
              icon: { type: 'emoji', emoji: task.suggestedIcon || '⚡' },
              color: 'gray_background'
            }
          }
        ]
      };
    } else {
      // ▶ 모드 B: 일반 페이지(Page) 하위 생성 (properties에는 title만 전달, 정보는 children 본문에 콜아웃/To-do로 구성)
      const parentPageId = resource.pageId || targetDbId || '';
      const detailLines: string[] = [];

      if (task.intent) {
        const intentLabels: Record<string, string> = {
          schedule: '📅 일정/캘린더',
          todo: '✅ 할 일/태스크',
          expense: '💰 지출/가계부',
          idea: '💡 아이디어/메모',
          contact: '👤 연락처/인맥'
        };
        detailLines.push(`• 분류: ${intentLabels[task.intent] || task.intent}`);
      }

      if (task.properties) {
        Object.entries(task.properties).forEach(([key, val]) => {
          if (key !== '이름' && key !== 'title') {
            detailLines.push(`• ${key}: ${val}`);
          }
        });
      }

      const childrenBlocks: any[] = [
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [{ type: 'text', text: { content: `⚡ 1초 퀵 캡처 자동 기록: ${task.summary || task.title}` } }],
            icon: { type: 'emoji', emoji: task.suggestedIcon || '⚡' },
            color: 'gray_background'
          }
        },
        {
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: task.title } }],
            checked: task.properties?.['상태'] === '완료' || task.properties?.['status'] === '완료'
          }
        }
      ];

      if (detailLines.length > 0) {
        childrenBlocks.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [{ type: 'text', text: { content: `📌 세부 메타 정보\n${detailLines.join('\n')}` } }],
            icon: { type: 'emoji', emoji: '📋' },
            color: 'blue_background'
          }
        });
      }

      pagePayload = {
        parent: { page_id: parentPageId },
        icon: { type: 'emoji', emoji: task.suggestedIcon || '⚡' },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: task.title } }]
          }
        },
        children: childrenBlocks
      };
    }

    try {
      let res = await fetch('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify(pagePayload)
      });

      // 404 NOT_FOUND 감지 시 Next.js / Vercel 쿼리 엔드포인트로 즉시 2차 재시도
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/notion?path=v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify(pagePayload)
        });
      }

      // 400 VALIDATION_ERROR (status/option 불일치) 감지 시 상태 속성 생략 후 즉시 자동 재시도
      if (!res.ok && res.status === 400 && pagePayload.properties) {
        const errJsonClone = await res.clone().json().catch(() => ({}));
        const errMsg = (errJsonClone.message || '').toLowerCase();
        if (errMsg.includes('status') || errMsg.includes('option') || errMsg.includes('상태')) {
          delete pagePayload.properties['상태'];
          delete pagePayload.properties['status'];
          res = await fetch('/api/notion/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify(pagePayload)
          });
        }
      }

      if (res.ok) {
        const pageData = await res.json();
        successCount++;
        if (pageData.url) pageUrls.push(pageData.url);
      } else {
        const errJson = await res.json().catch(() => ({}));
        errors.push(`[${task.title}] 노션 전송 실패 (${res.status}): ${errJson.message || '데이터베이스 속성 규격 불일치'}`);
      }
    } catch (e: any) {
      errors.push(`[${task.title}] 통신 에러: ${e.message || '네트워크 연결 실패'}`);
    }
  }

  return { successCount, pageUrls, errors };
}
