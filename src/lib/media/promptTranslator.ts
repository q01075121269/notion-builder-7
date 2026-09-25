// src/lib/media/promptTranslator.ts
// 한글 자연어 프롬프트 ➔ 영문 시맨틱 VPO 프롬프트 실시간 변환 엔진

export interface TranslatedSemantic {
  koreanSubject: string;
  englishPrompt: string;
  englishSubject: string;
  detectedSetting: string;
}

/**
 * 한국어 프롬프트를 분석하여 고화질 실사 AI 생성에 최적화된 영문 시맨틱 프롬프트로 변환
 * @param koreanPrompt 사용자가 입력한 한국어 프롬프트
 * @param previousSubject 이전 턴의 피사체 컨텍스트 (배경 교체 시 Character Lock 유지)
 */
export function translateToSemanticPrompt(
  koreanPrompt: string,
  previousSubject?: string
): TranslatedSemantic {
  const p = koreanPrompt.toLowerCase().trim();

  // =========================================================================
  // 1. 피사체 (Subject) 파싱
  // =========================================================================
  let koreanSubject = '';
  let englishSubject = '';

  // (1) 70대 / 노인 / 할아버지 / 흰머리 / 수염 / 한복
  if (
    p.includes('70대') || 
    p.includes('80대') || 
    p.includes('노인') || 
    p.includes('할아버지') || 
    p.includes('어르신') ||
    p.includes('흰머리') ||
    p.includes('하얀 수염')
  ) {
    koreanSubject = '70대 건강한 한복 노인';
    englishSubject = 'A robust 70-year-old Korean grandfather with a thick white beard and styled white hair, wearing modern refined Korean hanbok';
  } 
  // (2) 6세 / 여섯살 / 아이 / 소녀 / 금발
  else if (
    p.includes('금발') || 
    p.includes('여섯살') || 
    p.includes('6살') || 
    p.includes('어린이') || 
    p.includes('소녀') || 
    p.includes('아이')
  ) {
    if (p.includes('금발')) {
      koreanSubject = '여섯 살 금발머리 귀여운 여자아이';
      englishSubject = 'An adorable 6-year-old cute little girl with wavy golden blonde hair, big bright expressive eyes';
    } else if (p.includes('소년') || p.includes('남자아이')) {
      koreanSubject = '호기심 가득한 귀여운 소년';
      englishSubject = 'A curious charming 7-year-old boy with a cheerful joyful expression';
    } else {
      koreanSubject = '순수한 눈빛의 귀여운 아이';
      englishSubject = 'A lovely cute little child with innocent radiant eyes';
    }
  }
  // (3) 패션 디렉터 / 성인 여성 / 모델
  else if (p.includes('패션') || p.includes('디렉터') || p.includes('단발') || p.includes('트렌치')) {
    koreanSubject = '30대 여성 패션 디렉터';
    englishSubject = 'A sophisticated 30-year-old Korean woman fashion director, chic black bob haircut, beige trench coat';
  }
  // (4) CEO / 비즈니스 임원
  else if (p.includes('ceo') || p.includes('대표') || p.includes('임원') || p.includes('정장')) {
    koreanSubject = '글로벌 CEO 비즈니스 리더';
    englishSubject = 'A distinguished confident corporate CEO in a bespoke luxury dark charcoal suit';
  }
  // (5) 반려동물 / 동물
  else if (p.includes('고양이') || p.includes('야옹')) {
    koreanSubject = '에메랄드 눈빛의 고양이';
    englishSubject = 'A stunning regal Scottish Fold cat with vivid emerald green eyes and silky fur';
  }
  else if (p.includes('강아지') || p.includes('골든') || p.includes('개')) {
    koreanSubject = '사랑스러운 골든 리트리버';
    englishSubject = 'A happy friendly golden retriever dog with silky golden coat';
  }
  // (6) 사이버펑크 / 로봇 / SF
  else if (p.includes('사이버') || p.includes('로봇') || p.includes('안드로이드') || p.includes('sf')) {
    koreanSubject = '네온 사이버펑크 사이보그';
    englishSubject = 'A sleek futuristic cyberpunk cyborg humanoid with glowing carbon fiber chassis';
  }
  // (7) 이전 피사체 유지 (배경 교체 요청 시)
  else if (previousSubject && (p.includes('배경') || p.includes('바꿔') || p.includes('보이게'))) {
    koreanSubject = previousSubject;
    englishSubject = `The same ${previousSubject}`;
  }
  // (8) 기타 자연어 피사체
  else {
    koreanSubject = cleanKoreanSubject(koreanPrompt);
    englishSubject = `A highly detailed master portrait of ${koreanSubject}`;
  }

  // =========================================================================
  // 2. 행동 및 액션 (Action) 파싱
  // =========================================================================
  let englishAction = '';
  if (p.includes('장작') || p.includes('도끼') || p.includes('패고')) {
    englishAction = 'chopping firewood with a heavy iron axe with dynamic wood splinters flying';
  } else if (p.includes('걷는') || p.includes('산책')) {
    englishAction = 'walking gracefully';
  } else if (p.includes('웃고') || p.includes('미소')) {
    englishAction = 'warmly smiling towards camera';
  } else if (p.includes('커피') || p.includes('차 마시는')) {
    englishAction = 'holding a warm ceramic cup';
  } else {
    englishAction = 'posing naturally with authentic expression';
  }

  // =========================================================================
  // 3. 배경 및 환경 (Setting / Background) 파싱
  // =========================================================================
  let englishSetting = '';
  let detectedSetting = '';

  if (p.includes('바다') || p.includes('해변') || p.includes('모래') || p.includes('파도') || p.includes('비치')) {
    detectedSetting = '바닷가 모래 해변';
    englishSetting = 'standing on a breathtaking ocean beach with crystal turquoise waves crashing, golden sandy shore, wide open clear coastal horizon';
  } else if (p.includes('산') || p.includes('숲') || p.includes('나무') || p.includes('숲속')) {
    detectedSetting = '산림 숲속 풍경';
    englishSetting = 'deep in an alpine mountain forest with tall pine trees, scattered wooden logs, misty volumetric atmospheric light';
  } else if (p.includes('설산') || p.includes('알프스') || p.includes('눈') || p.includes('빙하')) {
    detectedSetting = '알프스 설산 파노라마';
    englishSetting = 'in front of majestic snow-capped alpine mountains under sharp cold blue skies';
  } else if (p.includes('도시') || p.includes('거리') || p.includes('카페') || p.includes('골목')) {
    detectedSetting = '도심 시티 거리';
    englishSetting = 'on a stylish modern European city avenue with cozy cafes in the background';
  } else if (p.includes('스튜디오') || p.includes('실내') || p.includes('단색')) {
    detectedSetting = '프리미엄 미니멀 스튜디오';
    englishSetting = 'in a high-end minimalist photography studio with soft diffused keylight';
  } else {
    detectedSetting = '자연광 시네마틱 앰비언스';
    englishSetting = 'in an atmospheric cinematic environment with gentle natural illumination';
  }

  // =========================================================================
  // 4. VPO 고화질 마스터 카메라 & 렌더링 프롬프트 합성
  // =========================================================================
  const qualityVPO = 'hyperrealistic 8k photography, Hasselblad H6D-100c medium format, 80mm f/1.8 lens, Rembrandt natural cinematic lighting, highly detailed micro textures, Kodak Portra 400 grain, photorealistic masterpiece, no watermark';

  const fullPromptParts = [
    englishSubject,
    englishAction,
    englishSetting,
    qualityVPO
  ].filter(Boolean);

  const englishPrompt = fullPromptParts.join(', ');

  return {
    koreanSubject,
    englishPrompt,
    englishSubject,
    detectedSetting
  };
}

/**
 * 프롬프트에서 서술어를 지우고 핵심 명사구 추출
 */
function cleanKoreanSubject(text: string): string {
  const cleaned = text
    .replace(/(를|을|로|에|의)?\s*(실사|캐릭터|이미지|사진|포트레이트)?\s*(로)?\s*(만들어\s*줘|생성해\s*줘|그려\s*줘|해\s*줘|보여\s*줘|뽑아\s*줘|부탁해|바꿔\s*줘|변환해\s*줘).*/gi, '')
    .replace(/(실사\s*캐릭터|실사\s*이미지|실사\s*사진)/gi, '')
    .trim();

  return cleaned || '맞춤형 실사 비주얼';
}
