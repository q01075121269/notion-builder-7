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

// 초보자/숙련자 모드 판별
// 길이가 짧거나 포괄적 키워드만 있으면 초보자(interview),
// 구체적인 세부 조건(배경, 인물, 분위기, 15자 이상 등)이 있으면 숙련자(oneshot)
export function determineSessionMode(prompt: string): SessionMode {
  const trimmed = prompt.trim();
  if (trimmed.length < 14) {
    return 'interview';
  }
  // 묘사적 단어 포함 여부
  const complexKeywords = ['배경', '스타일', '비율', '서양', '동양', '분위기', '카메라', '조명', 'bpm', '4k', '시네마틱', '설산', 'ceo'];
  const matchCount = complexKeywords.filter(k => trimmed.toLowerCase().includes(k)).length;
  if (matchCount >= 2 || trimmed.length >= 25) {
    return 'oneshot';
  }
  return 'interview';
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
