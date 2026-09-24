// src/services/lifeHubAutoTriageRouter.ts
// 라이프 Hub 1초 퀵 인박스 노아(NOA) 인텔리전스 멀티모달 자동 분류(Auto-Triage) 라우터
// 4대 마스터 DB (Tasks & Habits, Life Log, Resources & Inbox, Projects) 자동 분기 적재 파이프라인

import type {
  ProjectArea,
  TaskType,
  TaskPriority,
  LifeLogCategory,
  ProjectItem,
  TaskHabitItem,
  ResourceInboxItem,
  LifeLogItem
} from '../types/lifeHub';
import type { GeminiModelType } from '../types/chat';

export type TriageDestination = 'tasks' | 'lifeLogs' | 'resources' | 'projects';

export interface TriageResult {
  destination: TriageDestination;
  confidence: number;
  explanation: string;
  itemTitle: string;
  taskData?: Omit<TaskHabitItem, 'id'>;
  logData?: Omit<LifeLogItem, 'id'>;
  resourceData?: Omit<ResourceInboxItem, 'id'>;
  projectData?: Omit<ProjectItem, 'id'>;
}

/**
 * 한국어 자연어 날짜 및 시간 추출 유틸리티 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm)
 */
function extractDueDateFromText(text: string, baseDate = new Date()): string {
  const clean = text.trim();
  const now = new Date(baseDate);
  let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // 1. "M월 D일" 매칭
  const mdMatch = clean.match(/(?:(\d{4})[-./년\s]+)?(\d{1,2})[-./월\s]+(\d{1,2})일?/);
  if (mdMatch) {
    const y = mdMatch[1] ? parseInt(mdMatch[1], 10) : now.getFullYear();
    const m = parseInt(mdMatch[2], 10) - 1;
    const d = parseInt(mdMatch[3], 10);
    targetDate = new Date(y, m, d);
  } else if (clean.includes('내일')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (clean.includes('모레')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (clean.includes('글피')) {
    targetDate.setDate(targetDate.getDate() + 3);
  } else if (clean.match(/(\d+)\s*일\s*(?:뒤|후)/)) {
    const offset = parseInt(clean.match(/(\d+)\s*일\s*(?:뒤|후)/)![1], 10);
    targetDate.setDate(targetDate.getDate() + offset);
  } else if (clean.includes('오늘')) {
    // 오늘 유지
  } else {
    // 날짜 언급 없을 시 오늘을 기본 마감일로 설정
  }

  // 시간 매칭 (오후 2시, 14시 등)
  let timeStr = '';
  const timeMatch = clean.match(/(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (timeMatch) {
    const isPm = timeMatch[1] === '오후';
    let hour = parseInt(timeMatch[2], 10);
    if (isPm && hour < 12) hour += 12;
    if (!isPm && timeMatch[1] === '오전' && hour === 12) hour = 0;
    const min = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    timeStr = ` ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}${timeStr}`;
}

/**
 * 텍스트에서 금액 숫자 추출
 */
function extractAmountFromText(text: string): number | null {
  // 1. "12,000원", "12000원"
  const wonMatch = text.match(/([0-9,]+)\s*원/);
  if (wonMatch) {
    const num = parseInt(wonMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  // 2. "12만원", "5.5만원"
  const manWonMatch = text.match(/([0-9.]+)\s*만\s*원/);
  if (manWonMatch) {
    const floatVal = parseFloat(manWonMatch[1]);
    if (!isNaN(floatVal)) return Math.round(floatVal * 10000);
  }
  // 3. 결제/비용/지출 키워드와 함께 등장하는 일반 숫자
  const generalNumMatch = text.match(/(?:결제|지출|식사|구매|비용|가격|금액)\D*([0-9,]{3,})/);
  if (generalNumMatch) {
    const num = parseInt(generalNumMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

/**
 * 1. 로컬 지능형 자동 분류 (Zero-Latency Fast-Path)
 * 네트워크 지연 없이 낙관적 업데이트(Optimistic Update)로 즉각 반영
 */
export function triageQuickCaptureLocally(rawText: string): TriageResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. [URL 링크 / 자료 감지] ➔ Resources & Inbox DB
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlMatch = text.match(urlRegex);
  if (urlMatch || lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('www.')) {
    const detectedUrl = urlMatch ? urlMatch[0] : text;
    let title = text.replace(urlRegex, '').trim();
    if (!title) {
      try {
        const u = new URL(detectedUrl.startsWith('http') ? detectedUrl : `https://${detectedUrl}`);
        title = `${u.hostname} 웹 스크랩 자료`;
      } catch {
        title = '웹 북마크 자료';
      }
    }

    return {
      destination: 'resources',
      confidence: 0.95,
      explanation: '웹 URL 링크가 감지되어 Resources & Inbox DB로 북마크 저장되었습니다.',
      itemTitle: title,
      resourceData: {
        title,
        type: '북마크',
        sourceUrl: detectedUrl,
        summary: `자동 수집된 웹 아티클/자료 (${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})`,
        status: '인박스',
        tags: ['웹북마크', '자동수집']
      }
    };
  }

  // 2. [비용 / 지출 감지] ➔ Life Log DB (스마트 재정)
  const amount = extractAmountFromText(text);
  const expenseKeywords = /(결제|지출|식비|점심|저녁|아침|커피|카페|영수증|밥값|마트|배달|주유|택시|구독|환불|쇼핑|구매|식사)/;
  if (amount !== null || expenseKeywords.test(text)) {
    let category: LifeLogCategory = '식비';
    if (/마트|쇼핑|옷|구매|선물|쿠팡|네이버페이/.test(text)) {
      category = '쇼핑';
    } else if (/월세|관리비|보험|통신비|구독|넷플릭스|유튜브|적금|전기세/.test(text)) {
      category = '고정지출';
    } else if (/운동|헬스|PT|필라테스|수영/.test(text)) {
      category = '운동';
    } else if (/수면|잠|취침/.test(text)) {
      category = '수면';
    }

    let cleanTitle = text
      .replace(/([0-9,]+)\s*원/g, '')
      .replace(/([0-9.]+)\s*만\s*원/g, '')
      .replace(/(결제|지출|기록|작성|넣어줘|해줘)/g, '')
      .trim();
    if (!cleanTitle) cleanTitle = `${category} 지출`;

    return {
      destination: 'lifeLogs',
      confidence: 0.92,
      explanation: `지출 금액(${amount ? amount.toLocaleString() + '원' : '비용'}) 및 ${category} 카테고리가 감지되어 Life Log에 자동 기록되었습니다.`,
      itemTitle: cleanTitle,
      logData: {
        title: cleanTitle,
        category,
        amount: amount || 0,
        date: extractDueDateFromText(text),
        note: `1초 퀵 인박스 영수증 자동 파싱: ${text}`
      }
    };
  }

  // 3. [기한 있는 거대 목표 / 신규 프로젝트 초안 감지] ➔ Projects DB
  const projectKeywords = /(프로젝트|신규\s*사업|런칭|론칭|출시|시스템\s*구축|대규모\s*개편|분기\s*목표|okr|전략\s*수립)/;
  if (projectKeywords.test(text)) {
    let area: ProjectArea = '커리어';
    if (/재테크|부동산|주식|투자|청약|연금/.test(text)) {
      area = '재테크';
    } else if (/건강|다이어트|운동|바디프로필|마라톤/.test(text)) {
      area = '건강';
    } else if (/라이프|독서|여행|취미|이사/.test(text)) {
      area = '라이프';
    }

    return {
      destination: 'projects',
      confidence: 0.88,
      explanation: `'${area}' 영역의 핵심 목표 프로젝트로 감지되어 Projects DB 초안으로 등록되었습니다.`,
      itemTitle: text,
      projectData: {
        title: text,
        area,
        targetDate: extractDueDateFromText(text).split(' ')[0],
        status: '기획',
        taskIds: [],
        resourceIds: [],
        description: `1초 퀵 인박스를 통해 생성된 목표 프로젝트 초안`
      }
    };
  }

  // 4. [과제 / 실행 과제 / 할 일 감지] ➔ Tasks & Habits DB
  const taskKeywords = /(회의|미팅|준비|보고|제출|발송|이메일|작성|연락|전화|예약|검토|진행|완료|수정|배포|개발|세무|마감|할일|투두)/;
  const isTimeOrSchedule = /(오늘|내일|모레|오전|오후|\d+시|\d+일|월요일|화요일|수요일|목요일|금요일|토요일|일요일)/.test(text);

  if (taskKeywords.test(text) || isTimeOrSchedule) {
    let priority: TaskPriority = '⚡ P1';
    if (/긴급|급함|오늘까지|p0|ASAP|즉시|필수|서둘러/.test(lower)) {
      priority = '🔥 P0';
    } else if (/천천히|여유|다음주|p2|나중에|참고/.test(lower)) {
      priority = '☕ P2';
    }

    let duration = '30m';
    if (/1시간|60분/.test(text)) duration = '1h';
    else if (/2시간/.test(text)) duration = '2h';
    else if (/10분|15분|가볍게/.test(text)) duration = '15m';

    const type: TaskType = /루틴|스트레칭|기상|독서|일기|명상/.test(text) ? '모닝루틴' : '할일';

    return {
      destination: 'tasks',
      confidence: 0.90,
      explanation: `실행 과제로 감지되어 마감일시 및 [${priority}] 우선순위가 자동 매핑되었습니다.`,
      itemTitle: text,
      taskData: {
        title: text,
        type,
        dueDate: extractDueDateFromText(text),
        priority,
        completed: false,
        duration,
        notes: `1초 퀵 인박스 지능형 할 일 라우팅`
      }
    };
  }

  // 5. 기본 Fallback: 일반 빠른 메모 / 지식 ➔ Resources & Inbox DB
  return {
    destination: 'resources',
    confidence: 0.75,
    explanation: '아이디어/빠른 메모로 감지되어 Resources & Inbox DB에 안전하게 보관되었습니다.',
    itemTitle: text,
    resourceData: {
      title: text,
      type: '빠른메모',
      summary: `1초 퀵 인박스 캡처 (${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})`,
      status: '인박스',
      tags: ['빠른메모']
    }
  };
}

/**
 * 2. 노아(NOA/Gemini) 구조화 출력(Structured Output) 비동기 정밀 분류
 */
export async function triageQuickCaptureWithAI(
  rawText: string,
  apiKey?: string,
  model: GeminiModelType = 'gemini-3.8-flash'
): Promise<TriageResult> {
  const localResult = triageQuickCaptureLocally(rawText);

  // API 키가 없거나 텍스트가 매우 짧은 경우 즉시 로컬 결과 리턴
  if (!apiKey || rawText.trim().length < 3) {
    return localResult;
  }

  const prompt = `
당신은 최고의 1초 퀵 인박스 분류 AI 에이전트 '노아(NOA)'입니다.
사용자가 입력한 자연어 텍스트를 분석하여, 다음 4대 마스터 DB 중 가장 적합한 1곳으로 완벽히 분류하세요:
1. "tasks": 일상 할 일, 업무 과제, 모닝 루틴, 일정 약속 (우선순위 P0~P2, 소요시간 15m/30m/1h/2h, 마감일 자동 추정)
2. "lifeLogs": 지출/비용, 식비, 쇼핑, 고정지출, 운동, 수면 로깅 (금액 숫자 파싱)
3. "resources": 웹 북마크(URL 링크), 빠른 메모, 지식 아티클, 문서
4. "projects": 1~3개월 단위의 기한 있는 거대 목표 프로젝트

입력 텍스트: "${rawText.replace(/"/g, '\\"')}"
현재 기준 일시: ${new Date().toISOString()}

반드시 아래 JSON 포맷으로만 응답하세요(코드블록 없이 순수 JSON):
{
  "destination": "tasks" | "lifeLogs" | "resources" | "projects",
  "confidence": 0.95,
  "explanation": "분류 이유 간략히 1문장",
  "itemTitle": "정제된 제목",
  "task": {
    "type": "할일" | "모닝루틴",
    "dueDate": "YYYY-MM-DD 또는 YYYY-MM-DD HH:mm",
    "priority": "🔥 P0" | "⚡ P1" | "☕ P2",
    "duration": "30m"
  },
  "lifeLog": {
    "category": "식비" | "쇼핑" | "고정지출" | "운동" | "수면",
    "amount": 12000,
    "date": "YYYY-MM-DD"
  },
  "resource": {
    "type": "빠른메모" | "북마크" | "문서" | "영수증",
    "sourceUrl": "URL 또는 빈 문자열",
    "summary": "간단 요약"
  },
  "project": {
    "area": "커리어" | "재테크" | "건강" | "라이프",
    "targetDate": "YYYY-MM-DD",
    "status": "기획"
  }
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      return localResult;
    }

    const data = await response.json();
    const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawAiText) return localResult;

    const parsed = JSON.parse(rawAiText.trim());
    const dest: TriageDestination = parsed.destination || localResult.destination;

    if (dest === 'tasks' && parsed.task) {
      return {
        destination: 'tasks',
        confidence: parsed.confidence || 0.95,
        explanation: parsed.explanation || localResult.explanation,
        itemTitle: parsed.itemTitle || rawText,
        taskData: {
          title: parsed.itemTitle || rawText,
          type: parsed.task.type === '모닝루틴' ? '모닝루틴' : '할일',
          dueDate: parsed.task.dueDate || localResult.taskData?.dueDate || new Date().toISOString().split('T')[0],
          priority: parsed.task.priority || '⚡ P1',
          completed: false,
          duration: parsed.task.duration || '30m',
          notes: 'NOA AI 인텔리전스 자동 분류'
        }
      };
    } else if (dest === 'lifeLogs' && parsed.lifeLog) {
      return {
        destination: 'lifeLogs',
        confidence: parsed.confidence || 0.95,
        explanation: parsed.explanation || localResult.explanation,
        itemTitle: parsed.itemTitle || rawText,
        logData: {
          title: parsed.itemTitle || rawText,
          category: parsed.lifeLog.category || '식비',
          amount: typeof parsed.lifeLog.amount === 'number' ? parsed.lifeLog.amount : (localResult.logData?.amount || 0),
          date: parsed.lifeLog.date || new Date().toISOString().split('T')[0],
          note: `NOA AI 지출 기록: ${rawText}`
        }
      };
    } else if (dest === 'projects' && parsed.project) {
      return {
        destination: 'projects',
        confidence: parsed.confidence || 0.95,
        explanation: parsed.explanation || localResult.explanation,
        itemTitle: parsed.itemTitle || rawText,
        projectData: {
          title: parsed.itemTitle || rawText,
          area: parsed.project.area || '커리어',
          targetDate: parsed.project.targetDate || new Date().toISOString().split('T')[0],
          status: '기획',
          taskIds: [],
          resourceIds: [],
          description: `NOA AI 프로젝트 자동 분류`
        }
      };
    } else if (parsed.resource) {
      return {
        destination: 'resources',
        confidence: parsed.confidence || 0.95,
        explanation: parsed.explanation || localResult.explanation,
        itemTitle: parsed.itemTitle || rawText,
        resourceData: {
          title: parsed.itemTitle || rawText,
          type: parsed.resource.type || '빠른메모',
          sourceUrl: parsed.resource.sourceUrl || undefined,
          summary: parsed.resource.summary || rawText,
          status: '인박스',
          tags: ['AI자동분류']
        }
      };
    }

    return localResult;
  } catch (err) {
    console.warn('[triageQuickCaptureWithAI] AI triage fallback to local:', err);
    return localResult;
  }
}
