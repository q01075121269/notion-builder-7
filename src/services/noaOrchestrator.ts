// src/services/noaOrchestrator.ts
// 노아 총괄 PD 듀얼 트랙 대화형 오케스트레이터 및 FSM 엔진

import type {
  MediaDomain,
  SessionMode,
  InterviewStep,
  MediaArtifact,
  MediaCheckpoint
} from '../types/media';

// 도메인별 기본 인터뷰 단계 사전
export const DOMAIN_INTERVIEW_STEPS: Record<MediaDomain, InterviewStep[]> = {
  audio: [
    {
      id: 1,
      domain: 'audio',
      stepName: '장르 및 무드',
      question: '어떤 분위기나 장르의 사운드를 구상 중이신가요?',
      chips: ['120BPM 테크 로파이', '시네마틱 앰비언트', '경쾌한 어쿠스틱 팝', '트렌디 힙합 비트'],
      canSkip: true
    },
    {
      id: 2,
      domain: 'audio',
      stepName: '핵심 악기 및 질감',
      question: '강조하고 싶은 악기나 텍스처가 있으신가요?',
      chips: ['몽환적인 피아노 & 패드', '묵직한 서브 808 베이스', '어쿠스틱 기타 리프', '미니멀 모듈러 신스'],
      canSkip: true
    },
    {
      id: 3,
      domain: 'audio',
      stepName: '템포 및 용도',
      question: '콘텐츠 용도와 길이에 맞는 템포를 정해볼까요?',
      chips: ['쇼츠 15초 루프', '릴스 30초 몰입형', '유튜브 인트로 10초', '업무/명상 BGM'],
      canSkip: true
    }
  ],
  video: [
    {
      id: 1,
      domain: 'video',
      stepName: '주제 및 시놉시스',
      question: '어떤 스토리나 비주얼의 세로 숏폼 영상인가요?',
      chips: ['알프스 설산 CEO 모놀로그', '사이버펑크 네온 시티', '감성 카페 일상 브이로그', '테크 기기 언박싱'],
      canSkip: true
    },
    {
      id: 2,
      domain: 'video',
      stepName: '카메라 및 연출 스타일',
      question: '카메라 구도나 조명 연출은 어떻게 잡을까요?',
      chips: ['시네마틱 4K 실사', '하이퍼랩스 드론 뷰', '클로즈업 매크로 샷', '미니멀 슬로우 모션'],
      canSkip: true
    },
    {
      id: 3,
      domain: 'video',
      stepName: '자막 및 사운드',
      question: '모바일 숏폼을 위한 자막과 사운드 레이아웃을 선택해 주세요.',
      chips: ['볼드 한글 숏폼 자막', '미니멀 영문 타이포', '비트 싱크 컷편집', '내레이션 중심'],
      canSkip: true
    }
  ],
  visual: [
    {
      id: 1,
      domain: 'visual',
      stepName: '비주얼 스타일',
      question: '어떤 스타일의 이미지나 썸네일을 제작할까요?',
      chips: ['3D 시네마틱 렌더', '미니멀 플랫 일러스트', '하이엔드 스튜디오 포토', '사이버펑크 네온 아트'],
      canSkip: true
    },
    {
      id: 2,
      domain: 'visual',
      stepName: '화면 비율',
      question: '타깃 플랫폼에 맞춘 화면 비율을 선택해 주세요.',
      chips: ['16:9 유튜브 썸네일', '9:16 모바일 숏폼', '1:1 정방형 커버'],
      canSkip: true
    },
    {
      id: 3,
      domain: 'visual',
      stepName: '피사체 및 조명 디테일',
      question: '특별히 강조하고 싶은 피사체나 조명 효과가 있나요?',
      chips: ['스튜디오 드라마틱 조명', '초고화질 매크로 디테일', '자연광 골든아워', '네온 백라이트'],
      canSkip: true
    }
  ],
  omni: [
    {
      id: 1,
      domain: 'omni',
      stepName: '콘텐츠 목표',
      question: '어떤 종합 미디어 패키지(영상+음악+썸네일)를 제작할까요?',
      chips: ['유튜브 풀 패키지', '바이럴 릴스/쇼츠 킷', '브랜드 런칭 티저', '제품 홍보 클립'],
      canSkip: true
    }
  ]
};

// 도메인 감지 헬퍼
export function detectDomainFromPrompt(prompt: string): MediaDomain {
  const p = prompt.toLowerCase();

  // 1. 오디오/음원
  if (p.includes('음악') || p.includes('bgm') || p.includes('사운드') || p.includes('노래') || p.includes('오디오') || p.includes('비트') || p.includes('bgm만들')) {
    return 'audio';
  }

  // 2. 비디오/영상/MV (명시적 영상 키워드가 있는 경우)
  const isVideoExplicit = p.includes('영상') || p.includes('비디오') || p.includes('쇼츠') || p.includes('릴스') || p.includes('동영상') || p.includes('모션') || p.includes('mv') || p.includes('뮤직비디오');

  // 3. 비주얼/실사/이미지 키워드 우선 검사
  const isVisualExplicit = 
    p.includes('캐릭터') ||
    p.includes('실사') ||
    p.includes('이미지') ||
    p.includes('사진') ||
    p.includes('썸네일') ||
    p.includes('포트레이트') ||
    p.includes('인물') ||
    p.includes('디렉터') ||
    p.includes('패션') ||
    p.includes('그림') ||
    p.includes('화보') ||
    p.includes('비주얼') ||
    p.includes('3d') ||
    p.includes('포스터');

  if (isVisualExplicit && !isVideoExplicit) {
    return 'visual';
  }

  if (isVideoExplicit) {
    return 'video';
  }

  return 'visual';
}

// 스킵 명령인지 확인
export function isSkipCommand(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  return (
    p === '건너뛰기' ||
    p === '건너뛰자' ||
    p === '생략' ||
    p === '패스' ||
    p === '다음' ||
    p === '스킵' ||
    p.includes('이 단계 건너뛰기') ||
    p.includes('그냥 해줘') ||
    p.includes('알아서 해줘')
  );
}

// 중간 점검/상태 확인 명령인지 확인
export function isInspectCommand(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  return (
    p.includes('보여줘') ||
    p.includes('중간 점검') ||
    p.includes('현재 상태') ||
    p.includes('캔버스') ||
    p.includes('어디까지') ||
    p.includes('확인')
  );
}

// 취소/중단/거부/항의 명령인지 확인 (FSM 및 불필요한 생성 차단용)
export function isCancelCommand(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  return (
    p === '취소' ||
    p === '중단' ||
    p === '그만' ||
    p === '그만해' ||
    p === '나가기' ||
    p === '종료' ||
    p === '처음으로' ||
    p === '리셋' ||
    p.includes('취소해') ||
    p.includes('그만할래') ||
    isNegativeOrProtestCommand(prompt)
  );
}

// 명시적인 이미지/영상 생성 거부 및 항의 발화 감지
export function isNegativeOrProtestCommand(prompt: string): boolean {
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

// 질문, 대화, 기능 문의, 날씨, 상식, 항의인지 감지 (이미지 생성 무지성 루프 원천 차단)
export function isConversationalOrQuestion(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();

  // 1. 최우선: 생성 거부 및 항의 발화는 100% 대화(CHAT)로 분류
  if (isNegativeOrProtestCommand(prompt)) {
    return true;
  }

  // 2. 날씨 / 일상 상식 / 시각 / 인사 관련 키워드
  const commonInfoKeywords = [
    '날씨', '기온', '비 와', '비와', '눈 와', '눈와', '우산', '더워', '추워', '미세먼지',
    '몇 시', '몇시', '며칠', '오늘 날짜', '무슨 요일', '식사', '밥 먹', '배고파'
  ];
  if (commonInfoKeywords.some((kw) => p.includes(kw))) {
    return true;
  }

  // 3. 제작/생성 요청 명령어가 명시적인 경우 제외
  const isGenerationTrigger = 
    p.includes('만들어줘') ||
    p.includes('생성해줘') ||
    p.includes('그려줘') ||
    p.includes('작곡해줘') ||
    p.includes('렌더링해줘') ||
    p.includes('바꿔줘') ||
    p.includes('제작해줘');

  if (isGenerationTrigger) {
    return false;
  }

  // 4. 인사 / 정체 / 기능 / 사용법 문의 / 질문 어미
  const conversationalKeywords = [
    '누구', '뭐해', '뭐야', '뭘 할 수', '기능', '도움말', '어떤 거', '어떤거',
    '사용법', '어떻게 써', '어떻게 쓰', '어떻게 해', '설명해', '알려줘',
    '안녕', '반가워', '노아', 'noa', '안되', '안돼', '버그', '에러', '왜 이래',
    '왜 그래', '왜 안', '뭐하는', '할줄', '능력', '가이드', '질문', '궁금',
    '어때', '생각해', '조언'
  ];

  const hasConversationalKeyword = conversationalKeywords.some((kw) => p.includes(kw));

  // 물음표가 있거나 대화형 키워드가 있는 경우
  return hasConversationalKeyword || p.endsWith('?') || p.endsWith('??');
}

// 질문 및 대화에 대한 노아 총괄 PD의 지능형 응답 생성기
export function generateNoaConversationalResponse(prompt: string): string {
  const p = prompt.trim().toLowerCase();

  // 항의 및 거부 대응
  if (isNegativeOrProtestCommand(prompt)) {
    return `대단히 죄송합니다! 의도치 않게 이미지를 생성하여 불편을 드렸습니다. 🙇‍♂️
사용자님의 명시적인 제작 명령("~만들어줘", "~생성해줘")이 있기 전까지는 어떠한 이미지나 영상도 생성하지 않고, 오직 대화와 Q&A에만 집중하겠습니다.
궁금하신 점이나 나누고 싶은 이야기를 편하게 말씀해 주세요!`;
  }

  // 날씨 관련 질문 대응
  if (p.includes('날씨') || p.includes('기온') || p.includes('비 와') || p.includes('눈 와') || p.includes('우산')) {
    return `제가 실시간 기상청 위성 센서에 직접 접속할 수는 없지만, 현재 계절과 무드에 맞는 미디어(예: '비 내리는 서울 밤거리의 차분한 네온사인', '햇살 가득한 해변')를 언제든 아름답게 연출해 드릴 수 있습니다! 🌦️
정확한 오늘/내일 날씨는 기상청 날씨누리나 포털 날씨 앱에서 확인하시는 것을 추천드립니다. 미디어 랩에서 표현하고 싶은 분위기나 날씨 풍경이 있으시다면 언제든 말씀해 주세요!`;
  }

  if (p.includes('누구') || p.includes('노아') || p.includes('noa') || p.includes('정체')) {
    return `안녕하세요! 저는 AI 미디어 랩의 총괄 크리에이티브 디렉터 **노아(NOA)**입니다. 🎬

비주얼(이미지), 비트 싱크 비디오(MV/숏폼), 오디오(BGM) 등 창작물의 컨셉 기획부터 고해상도 생성 및 디렉팅까지 전 과정을 책임집니다.
하단 만능 커맨드 독에 원하시는 분위기나 장면을 편하게 말씀해 주시면 즉시 캔버스에 구현해 드립니다!`;
  }

  if (p.includes('기능') || p.includes('뭘 할 수') || p.includes('할줄') || p.includes('어떤 거') || p.includes('능력')) {
    return `총괄 PD 노아(NOA)가 지원하는 핵심 창작 파이프라인입니다:

🎨 **1. FLUX 8K 비주얼 생성**
- 시네마틱 화보, 하이엔드 인물 포트레이트, 유튜브 썸네일 등 초고화질 이미지 렌더링

🎵 **2. 비트 싱크 숏폼 비디오 & MV**
- 음악의 BPM 및 비트 피크에 맞춰 씬 컷 전환과 다이내믹 카메라 모션 자동 연출

🎧 **3. 맞춤형 AI 사운드트랙 (BGM)**
- 영상 및 무드에 어울리는 스템별 악기 믹싱 사운드 트랙 생성

📁 **4. 만능 멀티모달 파일 투하**
- 레퍼런스 이미지나 음악 파일을 커맨드 독에 드래그하거나 Ctrl+V로 붙여넣으면 즉시 분석하여 창작에 반영합니다.

지금 원하시는 아이디어를 바로 말씀해 보세요!`;
  }

  if (p.includes('사용법') || p.includes('어떻게') || p.includes('도움말') || p.includes('가이드')) {
    return `**만능 Noa 커맨드 독 이용 가이드** 💡

1. **자유로운 텍스트 입력**: "네온사인이 번지는 사이버펑크 서울 밤거리", "차분한 로파이 비트" 등 원하는 장면을 편하게 말씀하세요.
2. **음성 인식 (STT)**: 우측 마이크(🎙️) 버튼을 누르고 음성으로 직접 지시하실 수 있습니다.
3. **파일 드래그 & 드롭**: 영감을 주는 이미지나 오디오 파일을 독 위에 끌어다 놓으시면 멀티모달 에셋으로 자동 결속됩니다.
4. **실시간 캔버스 피드백**: 생성된 결과물을 보며 "조명을 더 어둡게", "배경을 설산으로"처럼 추가 수정을 이어갈 수 있습니다.`;
  }

  if (p.includes('안녕') || p.includes('반가워') || p.includes('하이')) {
    return `반갑습니다! 🎬 오늘 노아와 함께 어떤 멋진 미디어를 만들어 볼까요? 생각하고 계신 컨셉이나 떠오르는 단어가 있다면 편하게 던져주세요!`;
  }

  if (p.includes('안되') || p.includes('안돼') || p.includes('버그') || p.includes('에러') || p.includes('왜')) {
    return `불편을 드려 죄송합니다! 현재 시스템은 단일 골든 패스 및 실시간 복구 배관을 갖추고 있습니다.
원하시는 이미지나 영상의 구체적인 키워드를 말씀해 주시거나, 상단 [새 세션] 버튼으로 깨끗하게 리셋 후 다시 시작하실 수도 있습니다.`;
  }

  // 기본 친절한 안내
  return `노아 총괄 PD가 경청하고 있습니다. 🎙️
궁금하신 점이 있다면 편하게 질문해 주시고, 새로운 미디어를 제작하고 싶으시다면 원하는 컨셉이나 스타일을 언제든 말씀해 주세요!`;
}

// 세션 모드 판별: 명시적 기획/인터뷰 요청이 있을 때만 interview 모드로 진입
export function determineSessionMode(prompt: string): SessionMode {
  const trimmed = prompt.trim().toLowerCase();
  
  const explicitInterviewKeywords = ['인터뷰', '단계별', '기획부터', '기획해줘', '차근차근', '가이드해줘', '설문'];
  const wantsInterview = explicitInterviewKeywords.some((k) => trimmed.includes(k));

  if (wantsInterview) {
    return 'interview';
  }

  // 기본은 원샷 직결 생성 (즉각적 창작 캔버스 피드백)
  return 'oneshot';
}

// 더미 파형 데이터 생성기 (오디오용)
export function generateWaveformData(length = 64): number[] {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    const v = 0.2 + Math.abs(Math.sin(i * 0.25) * 0.6) + (Math.random() * 0.2);
    data.push(Math.min(1.0, Math.max(0.1, Number(v.toFixed(2)))));
  }
  return data;
}

// 초기 기본 아티팩트 빌더
export function createInitialArtifact(
  domain: MediaDomain,
  userPrompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): MediaArtifact {
  const id = `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = userPrompt.length > 20 ? `${userPrompt.substring(0, 20)}...` : userPrompt || 'AI 미디어 창작물';

  let previewUrl = '';
  let waveformData: number[] | undefined = undefined;

  if (domain === 'audio') {
    waveformData = generateWaveformData(48);
  } else if (domain === 'video') {
    // 9:16 기본
    aspectRatio = '9:16';
  } else {
    // visual 기본 16:9
  }

  return {
    id,
    title,
    domain,
    aspectRatio,
    previewUrl,
    waveformData,
    promptHistory: [
      {
        userRaw: userPrompt,
        optimizedVPO: `[VPO Prompt Orchestrated]: ${userPrompt}, hyper-detailed, 8k resolution, photorealistic cinematic lighting, ultra masterwork 2026`
      }
    ],
    stems: domain === 'audio' ? [
      { name: 'Drum & Percussion', active: true, volume: 85 },
      { name: 'Bass & Sub', active: true, volume: 90 },
      { name: 'Melody & Synth', active: true, volume: 80 },
      { name: 'Ambient FX', active: true, volume: 70 }
    ] : undefined,
    captions: domain === 'video' ? [
      { start: 0, end: 2.5, text: '도전하지 않으면 아무것도 변하지 않습니다.' },
      { start: 2.5, end: 5.0, text: '최고의 순간은 지금 바로 시작됩니다.' }
    ] : undefined,
    provenance: {
      c2paSigned: true,
      synthId: true,
      license: 'CC-BY-4.0 AI Master 2026'
    },
    progressPercent: 75,
    currentStepText: '초안 캔버스 렌더링 완료'
  };
}

// 체크포인트 생성 헬퍼 (Undo/Redo용)
export function createCheckpoint(artifact: MediaArtifact): MediaCheckpoint {
  return {
    id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    snapshot: JSON.parse(JSON.stringify(artifact))
  };
}
