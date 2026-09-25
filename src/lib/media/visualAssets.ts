// src/lib/media/visualAssets.ts
// 프롬프트 기반 고화질 실사 비주얼 에셋 큐레이터 및 다운로더 헬퍼

export interface VisualAssetInfo {
  imageUrl: string;
  title: string;
  theme: string;
  cameraSpec: string;
  lightingSpec: string;
  colorGrade: string;
}

/**
 * 사용자의 자연어 프롬프트에서 핵심 피사체(Subject) 명칭을 정밀 추출
 */
export function extractSubjectTitle(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '맞춤형 비주얼 피사체';

  const p = prompt.trim();

  // 1. 특정 패턴 우선 감지
  if (p.includes('금발') && (p.includes('아이') || p.includes('여자') || p.includes('소녀') || p.includes('어린이'))) {
    return '여섯 살 금발머리 귀여운 여자아이';
  }
  if (p.includes('아이') || p.includes('어린이') || p.includes('소녀')) {
    return '순수한 눈빛의 귀여운 아이';
  }
  if (p.includes('소년')) {
    return '호기심 가득한 소년';
  }
  if (p.includes('숲') && (p.includes('배경') || p.includes('볕'))) {
    return '숲속 볕내림 앰비언스';
  }
  if (p.includes('ceo') || p.includes('대표') || p.includes('임원')) {
    return '글로벌 CEO';
  }
  if (p.includes('패션') && (p.includes('디렉터') || p.includes('모델'))) {
    return '패션 디렉터';
  }
  if (p.includes('3d') || p.includes('기계') || p.includes('항공') || p.includes('헬리콥터')) {
    return '3D 정밀 메커니즘 기체';
  }

  // 2. 불필요한 서술어 및 종결어미 제거
  let cleaned = p
    .replace(/(를|을|로|에|의)?\s*(실사|캐릭터|이미지|사진|포트레이트)?\s*(로)?\s*(만들어\s*줘|생성해\s*줘|그려\s*줘|해\s*줘|보여\s*줘|뽑아\s*줘|부탁해|바꿔\s*줘|변환해\s*줘).*/gi, '')
    .replace(/(실사\s*캐릭터|실사\s*이미지|실사\s*사진)/gi, '')
    .trim();

  if (cleaned.length === 0 || cleaned.length > 30) {
    cleaned = p.slice(0, 25).trim();
  }

  return cleaned || '맞춤형 실사 비주얼';
}

export function resolveVisualAssetByPrompt(prompt: string): VisualAssetInfo {
  const p = prompt.toLowerCase();

  // 1. 금발머리 귀여운 여자아이 / 어린이 / 키즈 (최우선 매칭)
  if (
    (p.includes('금발') && (p.includes('아이') || p.includes('여자') || p.includes('소녀') || p.includes('애'))) ||
    p.includes('여섯살') || 
    p.includes('6살') || 
    p.includes('6-year') ||
    p.includes('blonde') ||
    p.includes('little girl')
  ) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=85',
      title: '여섯 살 금발머리 귀여운 여자아이',
      theme: 'Innocent Cute Blonde Child Portrait',
      cameraSpec: 'Hasselblad H6D-100c • 80mm prime lens f/1.8',
      lightingSpec: 'Soft natural daylight with warm rim lighting',
      colorGrade: 'Kodak Portra 160, pure soft skin tones'
    };
  }

  // 2. 일반 귀여운 아이 / 어린이 / 소녀
  if (p.includes('아이') || p.includes('어린이') || p.includes('소녀') || p.includes('키즈') || p.includes('child')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=85',
      title: '맑고 순수한 눈빛의 어린이',
      theme: 'Cute Innocent Child Portrait',
      cameraSpec: 'Sony A1 • 85mm f/1.4 GM',
      lightingSpec: 'Golden Hour Soft Window Light',
      colorGrade: 'Cinematic Warmth & Crystal Clarity'
    };
  }

  // 3. 햇살 쏟아지는 숲속 배경 (Inpainting / Forest)
  if (p.includes('숲') || p.includes('숲속') || p.includes('볕') || p.includes('햇살') || p.includes('나무') || p.includes('포레스트')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=85',
      title: '햇살 쏟아지는 신비로운 숲속',
      theme: 'Sunlit Mystical Forest with God Rays',
      cameraSpec: 'Hasselblad H6D-100c • 80mm prime lens f/1.8',
      lightingSpec: 'Volumetric Forest God-Rays & Soft Backlit Sunbeams',
      colorGrade: 'Emerald Green Forest Hue & Warm Gold Fill'
    };
  }

  // 4. 반려동물 / 동물 (고양이, 강아지)
  if (p.includes('고양이') || p.includes('야옹') || p.includes('cat')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1600&q=85',
      title: '매력적인 에메랄드 눈빛의 고양이',
      theme: 'Photorealistic Feline Portrait',
      cameraSpec: 'Canon R5 • 100mm f/2.8L Macro',
      lightingSpec: 'Studio Key Softbox with Catchlight',
      colorGrade: 'Fine Fur Detail & Amber Tone'
    };
  }
  if (p.includes('강아지') || p.includes('개') || p.includes('dog') || p.includes('puppy')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1600&q=85',
      title: '사랑스러운 반려견 실사 포트레이트',
      theme: 'Golden Retriever Warm Portrait',
      cameraSpec: 'Sony A7R V • 85mm f/1.4',
      lightingSpec: 'Outdoor Natural Meadow Sunlight',
      colorGrade: 'Warm Golden Glow'
    };
  }

  // 5. 사이버펑크 / SF / 로봇
  if (p.includes('사이버') || p.includes('로봇') || p.includes('sf') || p.includes('메카') || p.includes('안드로이드')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=85',
      title: '네온 사이버펑크 안드로이드 피사체',
      theme: 'Futuristic Cyberpunk Character',
      cameraSpec: 'Octane Render 2026 • 8K Unreal Engine 5.5',
      lightingSpec: 'Cyan & Magenta Volumetric Neon Edge Glow',
      colorGrade: 'High Contrast Blade Runner Aesthetic'
    };
  }

  // 6. 패션 디렉터 / 성인 패션 모델 (명시적 패션/디렉터/트렌치 입력 시에만!)
  if (
    (p.includes('패션') && (p.includes('디렉터') || p.includes('모델'))) || 
    p.includes('트렌치') || 
    p.includes('칼단발')
  ) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1600&q=85',
      title: '30대 여성 패션 디렉터',
      theme: 'High-Fashion Editorial Portrait',
      cameraSpec: 'Hasselblad H6D-100c • 80mm prime lens f/1.8',
      lightingSpec: 'Rembrandt natural soft side-lighting',
      colorGrade: 'Kodak Portra 400 grain, balanced warm tones'
    };
  }

  // 7. 알프스 설산 / 자연 풍경
  if (p.includes('설산') || p.includes('알프스') || p.includes('빙하') || p.includes('산맥')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
      title: '알프스 설산 마제스틱 파노라마',
      theme: 'Alpine Glacier Landscape',
      cameraSpec: 'Phase One IQ4 150MP • Rodenstock 32mm',
      lightingSpec: 'Golden hour cold alpine irradiance',
      colorGrade: 'Cinematic Bleach Bypass + Arctic Blue'
    };
  }

  // 8. 3D 정밀 메카닉 / 항공 기체
  if (p.includes('3d') || p.includes('헬리콥터') || p.includes('항공') || p.includes('엔진')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1600&q=85',
      title: '3D 정밀 메커니즘 항공 기체',
      theme: 'Precision Aerodynamic Mechanical Render',
      cameraSpec: 'Octane Render 2026 • Unreal Engine 5.5',
      lightingSpec: 'Ray-traced PBR Titanium Studio Box',
      colorGrade: 'Neutral Titanium Metallic Curve'
    };
  }

  // 9. 서양 CEO / 비즈니스 인물
  if (p.includes('ceo') || p.includes('대표') || p.includes('임원') || p.includes('정장')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=85',
      title: '40대 글로벌 CEO 비즈니스 포트레이트',
      theme: 'Executive Corporate Portrait',
      cameraSpec: 'Sony A1 • FE 85mm f/1.4 GM',
      lightingSpec: 'Studio Keylight with subtle hair rim light',
      colorGrade: 'Classic Executive Contrast'
    };
  }

  // 기본값: 고화질 시네마틱 인물 비주얼
  return {
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85',
    title: extractSubjectTitle(prompt),
    theme: 'Cinematic Photorealistic Masterwork',
    cameraSpec: 'Hasselblad H6D-100c • 80mm f/1.8 Prime',
    lightingSpec: 'Natural Ambient Diffused Light',
    colorGrade: 'Kodak Portra 400 Filmic Tone'
  };
}

/**
 * 이미지 다운로드 트리거 함수
 */
export async function downloadImageDirectly(imageUrl: string, filename: string = 'noa-visual-master.png'): Promise<void> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Direct blob fetch failed, falling back to window open:', err);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
