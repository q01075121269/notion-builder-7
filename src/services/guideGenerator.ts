import type { NotionTemplate } from '../types/notion';
import type { GeminiModelType } from '../types/chat';
import type { BeginnerGuide, GuideAudience } from '../types/guide';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// 전문 용어 순화 가이드라인
export const GLOSSARY_MAPPING = [
  { tech: '관계형 데이터베이스(Relation)', simple: '서로 연결된 정보 주머니' },
  { tech: '롤업(Rollup)', simple: '연결된 주머니에서 내용 쏙 가져오기' },
  { tech: '날짜 필터(Filter)', simple: '오늘 할 일만 쏙 골라보기' },
  { tech: '속성(Property)', simple: '정보 항목 (날짜, 상태, 메모)' },
  { tech: '수식(Formula)', simple: '자동 계산 마법' },
  { tech: '데이터베이스 뷰(View)', simple: '달력 모양 / 표 모양으로 바꿔보기' }
];

// 기본 프리셋 가이드 (API 키가 없거나 네트워크 오류 시 안전하게 즉시 표시)
export const DEFAULT_GUIDES: Record<string, BeginnerGuide> = {
  college_student: {
    id: 'guide-college',
    templateTitle: '대학생 올인원 학기 플래너',
    targetAudience: 'general',
    headline: '누구나 3분 만에 마스터하는 나만의 대학 생활 스마트 비서 🎓',
    summary: [
      '강의 시간표와 주차별 과제 마감일을 잊지 않고 한눈에 챙길 수 있습니다.',
      '시험 D-Day 카운트다운을 보며 벼락치기 없는 여유로운 학기를 보냅니다.',
      '과제를 끝낼 때마다 [완료]를 누르면 실시간 달성률이 자동으로 올라갑니다.'
    ],
    firstDaySteps: [
      {
        stepNumber: 1,
        title: '이번 학기 시간표 채우기',
        description: '강의 시간표 표에서 [+ 새로 만들기]를 눌러 수업명과 강의실을 적어보세요.',
        icon: '📌',
        actionExample: '예: [월/수 10:30] 경영학원론 - 302호',
        calloutBadge: '가장 쉬운 시작'
      },
      {
        stepNumber: 2,
        title: '가장 가까운 과제 마감일 등록하기',
        description: '과제 목록에 첫 과제 제목을 적고, 달력 아이콘을 눌러 제출 날짜를 선택합니다.',
        icon: '📅',
        actionExample: '예: 마케팅 기획서 초안 제출 (10월 15일 마감)',
        calloutBadge: '자동 D-Day 계산'
      },
      {
        stepNumber: 3,
        title: '과제 완료하고 체크 버튼 톡 누르기',
        description: '과제를 제출한 후 [상태]를 [완료]로 바꿔보세요. 기분 좋은 성취감을 느낄 수 있습니다.',
        icon: '✅',
        actionExample: '진행 중 ➡️ 완료 (초록색 뱃지로 변신!)',
        calloutBadge: '뿌듯한 성취감'
      }
    ],
    calendarGuide: {
      title: '달력(캘린더) 화면에서 편안하게 모아보기',
      description: '상단의 [달력 모양] 탭을 누르면 모든 수업 과제와 시험 일정이 한 달 달력 위에 예쁘게 펼쳐집니다.',
      steps: [
        '과제 목록 상단의 [달력 보기] 탭을 클릭합니다.',
        '날짜 칸을 더블 클릭하면 그날의 새 일정을 바로 추가할 수 있습니다.',
        '마감일이 연기되었다면 일정을 마우스로 쓱 끌어서 다른 날짜로 옮겨보세요.'
      ],
      proTip: '노션 캘린더 앱(Notion Calendar)을 함께 쓰시면 스마트폰 구글 캘린더와도 자동으로 겹쳐서 볼 수 있습니다.'
    },
    faqs: [
      {
        question: '실수로 글이나 카드를 지워버렸어요! 어떡하죠?',
        answer: '당황하지 마세요! 키보드에서 [Ctrl + Z] (맥은 Cmd + Z)를 누르면 방금 지운 내용이 마법처럼 되살아납니다. 또는 노션 좌측 하단의 [휴지통]을 열면 언제든 복원할 수 있습니다.',
        tip: '되돌리기 단축키: Ctrl + Z'
      },
      {
        question: '스마트폰에서도 컴퓨터랑 똑같이 볼 수 있나요?',
        answer: '네! 스마트폰에 노션 앱을 설치하고 로그인하시면, 컴퓨터에서 작성한 모든 일정과 과제가 1초 만에 그대로 동기화됩니다.',
        tip: '앱스토어나 플레이스토어에서 Notion 검색 후 설치'
      }
    ],
    mermaidFlowchart: `graph LR
    A[📝 새 과제 등록] --> B[📅 마감일 지정]
    B --> C[📊 캘린더에 자동 표시]
    C --> D[✅ 완료 체크]
    D --> E[🏆 학점 A+ 달성!]`,
    cheerMessage: '처음에는 딱 1개 과제만 적어보세요. 익숙해지면 가장 든든한 학업 파트너가 됩니다! 힘내세요! ✨',
    createdAt: Date.now()
  }
};

// Gemini에 보낼 시스템 프롬프트 생성 함수
const buildSystemInstruction = (audience: GuideAudience): string => {
  let audiencePersona = '';
  if (audience === 'kids') {
    audiencePersona = `
[대상 독자: 초등학생 및 어린이]
- 말투: "~했어!", "~해봐!", "~란다!" 등 아주 친근하고 신나는 친구 같은 말투.
- 비유: 장난감 상자, 보물 지도, 마법 카드 게임 등에 비유하여 설명.
- 쉽고 재미있는 이모지를 문장마다 풍성하게 사용.`;
  } else if (audience === 'seniors') {
    audiencePersona = `
[대상 독자: 스마트폰과 컴퓨터가 낯선 어르신 및 시니어]
- 말투: "~하십니다", "~하시면 됩니다" 등 아주 정중하고 공손하며 읽기 편한 큰 글씨 설명문 어조.
- 어려운 외래어(DB, 링크, 스크롤 등)를 완전히 배제하고 '글상자', '화면 아래로 내리기' 등 순우리말로 표현.
- 글자 크기를 키워도 읽기 좋게 문장을 짧고 호흡을 또박또박하게 구성.`;
  } else {
    audiencePersona = `
[대상 독자: 노션을 처음 접하는 일반 초보자]
- 말투: 다정하고 친절하며 신뢰감 있는 코칭 어조 (~해요, ~해보세요).
- 불필요한 IT 전문 용어는 일상어로 바꾸고, 직관적인 행동 요령을 제시.`;
  }

  return `너는 복잡한 소프트웨어를 세상에서 가장 친절하게 설명해 주는 '초보자 맞춤형 디지털 온보딩 전문가'야.
사용자가 제공한 노션 템플릿(JSON)의 목적과 구조를 분석하여, 처음 쓰는 사람도 3분 만에 감을 잡을 수 있는 '비주얼 가이드북 데이터'를 생성해야 해.

${audiencePersona}

[전문 용어 순화 필수 규칙]
- "데이터베이스(Database)" ➡️ "정보 상자" 또는 "기록 주머니"
- "관계형 속성(Relation)" ➡️ "서로 연결해 주는 끈"
- "롤업(Rollup)" ➡️ "연결된 주머니에서 내용 가져와 합치기"
- "날짜 필터(Filter)" ➡️ "오늘 할 일만 쏙 골라보기"
- "수식(Formula)" ➡️ "자동 계산 마법"
- "속성(Property)" ➡️ "항목(날짜, 상태 등)"

[반드시 생성해야 하는 JSON 데이터 구조]:
{
  "headline": "템플릿을 대표하는 따뜻하고 매력적인 가이드 제목 (이모지 포함)",
  "summary": [
    "이 템플릿으로 할 수 있는 일 첫 번째 요약 문장",
    "이 템플릿으로 할 수 있는 일 두 번째 요약 문장",
    "이 템플릿으로 할 수 있는 일 세 번째 요약 문장"
  ],
  "firstDaySteps": [
    {
      "stepNumber": 1,
      "title": "첫 번째 행동 제목 (예: 오늘 할 일 적어보기)",
      "description": "어디를 누르고 무엇을 타이핑해야 하는지 1~2문장으로 아주 쉽게 안내",
      "icon": "이모지 (예: ✏️)",
      "actionExample": "구체적인 입력 예시 (예: [장보기] 우유 사기)",
      "calloutBadge": "1단계 꿀팁 배지 (예: 10초 완성)"
    },
    {
      "stepNumber": 2,
      "title": "두 번째 행동 제목 (예: 마감일 콕 찍기)",
      "description": "날짜나 상태를 바꾸는 방법 안내",
      "icon": "이모지 (예: 📅)",
      "actionExample": "구체적인 입력 예시",
      "calloutBadge": "2단계 꿀팁 배지"
    },
    {
      "stepNumber": 3,
      "title": "세 번째 행동 제목 (예: 다 끝내고 완료 누르기)",
      "description": "완료 후 성취감을 느끼는 방법 안내",
      "icon": "이모지 (예: 🎉)",
      "actionExample": "구체적인 입력 예시",
      "calloutBadge": "3단계 꿀팁 배지"
    }
  ],
  "calendarGuide": {
    "title": "달력 화면에서 쉽게 확인하는 방법",
    "description": "표 형태 대신 달력 뷰로 보면 왜 좋은지 설명",
    "steps": [
      "달력 탭 누르기",
      "날짜 칸을 눌러 일정 확인하기",
      "일정을 끌어서 날짜 변경하기"
    ],
    "proTip": "노션 캘린더 앱이나 구글 캘린더와 연결하면 폰 알림도 받을 수 있어요!"
  },
  "faqs": [
    {
      "question": "실수로 내용을 지웠을 땐 어떻게 하나요?",
      "answer": "키보드의 Ctrl + Z 키를 누르면 방금 지운 내용이 되살아나요! 휴지통 메뉴에서도 찾을 수 있습니다.",
      "tip": "되살리기: Ctrl + Z"
    },
    {
      "question": "휴대폰에서도 똑같이 볼 수 있나요?",
      "answer": "스마트폰 노션 앱을 켜면 컴퓨터에서 쓴 내용이 저절로 뿅 나타납니다!",
      "tip": "모바일 앱 자동 동기화"
    }
  ],
  "mermaidFlowchart": "graph TD\\n  A[✏️ 내용 입력] --> B[📅 달력에 쏙]\\n  B --> C[✅ 완료 체크]\\n  C --> D[🌟 멋진 하루 완성]",
  "cheerMessage": "초보자를 응원하는 따뜻하고 힘이 되는 마지막 한마디"
}

반드시 순수 JSON 형식만 반환해 (마크다운 백틱 제외).`;
};

// Gemini API를 호출하여 초보자 가이드 생성
export const generateGuideWithGemini = async (
  template: NotionTemplate,
  apiKey: string,
  audience: GuideAudience = 'general',
  model: GeminiModelType = 'gemini-1.5-flash'
): Promise<BeginnerGuide> => {
  // API 키가 없으면 기본 템플릿 프리셋 또는 동적 기본 가이드 반환
  if (!apiKey) {
    return createFallbackGuide(template, audience);
  }

  const prompt = `[템플릿 정보]
- 제목: ${template.title}
- 설명: ${template.description || '노션 아키텍트가 생성한 맞춤형 템플릿'}
- 데이터베이스: ${template.databases.map(db => `${db.name} (속성: ${db.properties.map(p => p.name).join(', ')})`).join(' | ')}
- 레이아웃 구성: ${template.page_layout.map(b => b.type).join(', ')}

위 템플릿을 처음 쓰는 사람을 위한 쉬운 비주얼 가이드를 지침에 따라 JSON으로 만들어줘.`;

  const targetModel = (model || 'gemini-3.6-flash').replace(/^models\//, '').trim() || 'gemini-3.6-flash';
  const requestPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: buildSystemInstruction(audience) }]
    },
    generationConfig: {
      temperature: 0.5,
      responseMimeType: 'application/json'
    }
  };

  try {
    // [보안 격리]: /api/gemini 프록시 우선 호출
    let res: Response;
    try {
      res = await fetch(`/api/gemini?model=${targetModel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey.trim()
        },
        body: JSON.stringify(requestPayload)
      });
    } catch {
      const fallbackUrl = `${GEMINI_API_BASE_URL}/${targetModel}:generateContent?key=${apiKey.trim()}`;
      res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
    }

    if (!res.ok) {
      console.warn('Gemini API 호출 실패, 기본 가이드로 대체합니다:', res.status);
      return createFallbackGuide(template, audience);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return createFallbackGuide(template, audience);

    const parsed = JSON.parse(rawText);
    return {
      id: `guide-${Date.now()}`,
      templateTitle: template.title,
      targetAudience: audience,
      headline: parsed.headline || `${template.title} 친절한 사용 설명서`,
      summary: parsed.summary || [
        '이 템플릿은 일상을 쉽고 정돈되게 만들어 줍니다.',
        '필요한 정보를 한곳에 모아두고 빠르게 찾을 수 있습니다.',
        '매일 조금씩 기록하면 훌륭한 나만의 보관함이 됩니다.'
      ],
      firstDaySteps: parsed.firstDaySteps || [
        {
          stepNumber: 1,
          title: '첫 번째 정보 적어보기',
          description: '[+ 새로 만들기]를 눌러 첫 카드를 작성해 보세요.',
          icon: '✏️',
          actionExample: '예: 오늘의 첫 기록',
          calloutBadge: '10초 시작'
        }
      ],
      calendarGuide: parsed.calendarGuide || {
        title: '달력 화면으로 편하게 보기',
        description: '상단의 달력 탭을 누르면 날짜별로 한눈에 볼 수 있습니다.',
        steps: ['달력 모양 탭 클릭', '날짜별 일정 확인'],
        proTip: '노션 캘린더와 연동하면 스마트폰 알림도 받을 수 있어요.'
      },
      faqs: parsed.faqs || [
        {
          question: '실수로 지웠을 때는 어떻게 하나요?',
          answer: 'Ctrl + Z를 누르면 되살아납니다!',
          tip: '되돌리기: Ctrl + Z'
        }
      ],
      mermaidFlowchart: parsed.mermaidFlowchart || `graph LR\n  A[✏️ 정보 입력] --> B[📅 달력 확인]\n  B --> C[✅ 완료]`,
      cheerMessage: parsed.cheerMessage || '시작이 반입니다! 천천히 하나씩 적어보세요! ✨',
      createdAt: Date.now()
    };

  } catch (err) {
    console.error('가이드 생성 중 오류:', err);
    return createFallbackGuide(template, audience);
  }
};

// 오프라인/에러 시 안전하게 제공되는 템플릿 맞춤형 동적 폴백 가이드
export const createFallbackGuide = (template: NotionTemplate, audience: GuideAudience): BeginnerGuide => {
  const isKids = audience === 'kids';
  const isSeniors = audience === 'seniors';

  const dbNames = template.databases.map(d => d.name).join(', ') || '기록 주머니';

  let headline = `누구나 쉽게 따라 하는 [${template.title}] 사용 가이드 ✨`;
  let cheer = '처음엔 딱 한 줄만 써보세요. 날마다 멋진 기록이 쌓일 거예요!';

  if (isKids) {
    headline = `신나는 [${template.title}] 탐험 설명서! 🚀`;
    cheer = '너만의 멋진 비밀 기지를 만들어봐! 파이팅! 🎈';
  } else if (isSeniors) {
    headline = `[${template.title}] 처음 사용하시는 어르신을 위한 큰 글씨 안내서 📖`;
    cheer = '어르신, 컴퓨터가 서툴러도 괜찮습니다. 하나씩 천천히 눌러보십시오. 건강한 하루 보내세요!';
  }

  return {
    id: `guide-fallback-${Date.now()}`,
    templateTitle: template.title,
    targetAudience: audience,
    headline,
    summary: [
      `1. [${template.title}]은 복잡한 생각을 깔끔하게 정리해 주는 마법 주머니입니다.`,
      `2. [${dbNames}]에 날짜와 할 일을 쏙쏙 적어두면 잊어버릴 걱정이 없습니다.`,
      '3. 끝난 일은 체크(완료) 버튼을 눌러 하루의 성취감을 느껴보세요.'
    ],
    firstDaySteps: [
      {
        stepNumber: 1,
        title: isKids ? '첫 번째 비밀 카드 만들기' : isSeniors ? '첫 번째 글 적어보기' : '첫 번째 항목 등록하기',
        description: '화면에서 [+ 새로 만들기] 버튼을 마우스로 살짝 누르고 제목을 적어보세요.',
        icon: '✏️',
        actionExample: isKids ? '예: 오늘 숙제 다 하기' : isSeniors ? '예: 아침 9시 병원 진료' : '예: 이번 주 핵심 목표',
        calloutBadge: '가장 쉬운 1단계'
      },
      {
        stepNumber: 2,
        title: isKids ? '날짜 요정에게 마감일 알려주기' : isSeniors ? '달력에서 날짜 정하기' : '일정 및 날짜 선택하기',
        description: '달력 칸을 눌러 언제까지 끝낼지 날짜를 골라주세요.',
        icon: '📅',
        actionExample: '오늘 날짜 또는 이번 주 금요일 선택',
        calloutBadge: '달력에 자동 쏙'
      },
      {
        stepNumber: 3,
        title: isKids ? '미션 성공 도장 쾅 찍기!' : isSeniors ? '다 끝낸 후 완료 표시하기' : '완료 체크하고 정리하기',
        description: '일을 마쳤다면 상태를 [완료]로 바꿔보세요. 초록색으로 예쁘게 바뀝니다.',
        icon: '🎉',
        actionExample: '진행 중 ➡️ 완료',
        calloutBadge: '뿌듯한 성취감'
      }
    ],
    calendarGuide: {
      title: '달력(캘린더) 모양으로 편안하게 보기',
      description: '표 모양이 복잡해 보일 땐 상단의 [달력 보기]를 눌러보세요. 한 달 달력 위에 내 일정들이 한눈에 쏙 들어옵니다.',
      steps: [
        '화면 상단에서 [달력]이라고 쓰인 탭을 콕 누릅니다.',
        '원하는 날짜 칸을 누르면 새 일정을 바로 적을 수 있습니다.',
        '날짜가 바뀌었다면 마우스로 끌어서 다른 날로 옮기면 끝!'
      ],
      proTip: '휴대폰에 노션 캘린더 앱을 깔아두면 외출 중에도 알림을 받아볼 수 있습니다.'
    },
    faqs: [
      {
        question: '실수로 지웠을 때는 어떻게 되살리나요?',
        answer: '키보드 왼쪽 아래에 있는 Ctrl 키를 누른 상태에서 Z 키를 누르면 방금 지운 글이 마법처럼 되살아납니다.',
        tip: '되살리기 단축키: Ctrl + Z'
      },
      {
        question: '휴대폰 스마트폰에서도 볼 수 있나요?',
        answer: '네! 스마트폰에서 노션 앱을 설치하고 로그인하시면 집 컴퓨터에서 쓴 내용이 그대로 보입니다.',
        tip: '스마트폰 앱 무료 설치'
      }
    ],
    mermaidFlowchart: `graph TD
    A[✏️ 1. 제목 적기] --> B[📅 2. 날짜 고르기]
    B --> C[🗓️ 3. 달력에서 한눈에 보기]
    C --> D[✅ 4. 다 끝내고 완료!]`,
    cheerMessage: cheer,
    createdAt: Date.now()
  };
};
