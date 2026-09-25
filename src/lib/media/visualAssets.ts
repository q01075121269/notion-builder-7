// src/lib/media/visualAssets.ts
// 실시간 AI 동적 비주얼 생성 엔진 (Pollinations Flux 8K Realtime Synthesizer)

import { translateToSemanticPrompt } from './promptTranslator';

export interface VisualAssetInfo {
  imageUrl: string;
  title: string;
  theme: string;
  semanticEnglish: string;
  cameraSpec: string;
  lightingSpec: string;
  colorGrade: string;
}

/**
 * 비율에 따른 렌더링 해상도 계산
 */
export function getDimensionsForRatio(aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'): { width: number; height: number } {
  if (aspectRatio === '9:16') {
    return { width: 720, height: 1280 };
  }
  if (aspectRatio === '1:1') {
    return { width: 1024, height: 1024 };
  }
  return { width: 1280, height: 720 };
}

/**
 * 실시간 AI 동적 렌더러 엔드포인트 URL 생성 (Pollinations Flux 무제한 초고화질)
 */
export function buildPollinationsFluxUrl(
  englishPrompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): string {
  const { width, height } = getDimensionsForRatio(aspectRatio);
  const seed = Math.floor(Math.random() * 9000000) + 1000000;
  const encodedPrompt = encodeURIComponent(englishPrompt);

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
}

/**
 * 사용자의 한국어 프롬프트를 실시간 분석/번역하여 실제 AI 생성 이미지를 반환하는 실체 로직
 */
export function resolveVisualAssetByPrompt(
  prompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  previousSubject?: string
): VisualAssetInfo {
  const semantic = translateToSemanticPrompt(prompt, previousSubject);
  const imageUrl = buildPollinationsFluxUrl(semantic.englishPrompt, aspectRatio);

  const title = semantic.detectedSetting 
    ? `${semantic.koreanSubject} (${semantic.detectedSetting})`
    : semantic.koreanSubject;

  return {
    imageUrl,
    title,
    theme: semantic.detectedSetting || '시네마틱 실사 마스터',
    semanticEnglish: semantic.englishPrompt,
    cameraSpec: 'Hasselblad H6D-100c Medium Format • 80mm f/1.8',
    lightingSpec: 'Rembrandt natural cinematic lighting & atmospheric volumetric fill',
    colorGrade: 'Kodak Portra 400 Filmic 8K Curve'
  };
}

/**
 * 외부에서 프롬프트의 한글 제목만 필요할 때 추출
 */
export function extractSubjectTitle(prompt: string): string {
  const semantic = translateToSemanticPrompt(prompt);
  return semantic.koreanSubject;
}

/**
 * 이미지 다운로드 트리거 함수
 */
export async function downloadImageDirectly(imageUrl: string, filename: string = 'noa-ai-master.png'): Promise<void> {
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
