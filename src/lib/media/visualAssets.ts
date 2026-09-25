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

export function resolveVisualAssetByPrompt(prompt: string): VisualAssetInfo {
  const p = prompt.toLowerCase();

  // 1. 여성 패션 디렉터 / 인물 실사 캐릭터
  if (
    p.includes('패션') || 
    p.includes('디렉터') || 
    p.includes('여성') || 
    p.includes('캐릭터') || 
    p.includes('단발') || 
    p.includes('트렌치') ||
    p.includes('모델')
  ) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1600&q=85',
      title: '30대 여성 패션 디렉터 (흑발 칼단발 & 베이지 트렌치코트)',
      theme: 'High-Fashion Editorial Portrait',
      cameraSpec: 'Hasselblad H6D-100c • 80mm prime lens f/1.8',
      lightingSpec: 'Rembrandt natural soft side-lighting',
      colorGrade: 'Kodak Portra 400 grain, balanced warm tones'
    };
  }

  // 2. 알프스 설산 / 배경
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

  // 3. 3D 메카닉 / 헬리콥터 / 기계
  if (p.includes('3d') || p.includes('헬리콥터') || p.includes('기계') || p.includes('엔진')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1600&q=85',
      title: '3D 정밀 메커니즘 항공 기체',
      theme: 'Precision Aerodynamic Mechanical Render',
      cameraSpec: 'Octane Render 2026 • Unreal Engine 5.5',
      lightingSpec: 'Ray-traced PBR Titanium Studio Box',
      colorGrade: 'Neutral Titanium Metallic Curve'
    };
  }

  // 4. 서양 CEO / 비즈니스 인물
  if (p.includes('ceo') || p.includes('대표') || p.includes('서양') || p.includes('정장')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=85',
      title: '40대 서양 글로벌 CEO 포트레이트',
      theme: 'Executive Corporate Portrait',
      cameraSpec: 'Sony A1 • FE 85mm f/1.4 GM',
      lightingSpec: 'Studio Keylight with subtle hair rim light',
      colorGrade: 'Classic Executive Contrast'
    };
  }

  // 기본값: 프리미엄 고화질 패션 인물 포트레이트
  return {
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85',
    title: '시네마틱 인물 비주얼 마스터',
    theme: 'Editorial Masterwork 2026',
    cameraSpec: 'Hasselblad H6D • 80mm f/1.8',
    lightingSpec: 'Natural Ambient Diffused Light',
    colorGrade: 'Kodak Portra 400 Filmic'
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
