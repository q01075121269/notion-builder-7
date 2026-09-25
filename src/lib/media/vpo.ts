// src/lib/media/vpo.ts
// 지능형 프롬프트 인핸서 VPO (Visual Prompt Optimizer) 2026 Engine

import type { MediaDomain } from '../../types/media';

export type VPOStyle = '3d' | 'photo' | 'cinematic';

export interface VPOOptimizationResult {
  rawPrompt: string;
  optimizedPrompt: string;
  negativePrompt: string;
  style: VPOStyle;
  technicalSpecs: {
    engineOrCamera: string;
    lensOrOptics: string;
    lighting: string;
    materials: string;
    resolution: string;
    colorGrade: string;
  };
  c2paSigned: boolean;
}

// 시스템 전역 네거티브 가드레일 (인공적 저품질 붕괴 방지)
export const SYSTEM_NEGATIVE_GUARDRAILS = 
  'low-poly, primitive geometric shapes, childish toy, plastic texture, flat shading, distorted perspective, draft quality, oversaturated, blurry, bad anatomy, deformed limbs, watermark, artifacts';

/**
 * 프롬프트 키워드 분석을 통해 스타일을 자동 감지
 */
export function detectVPOStyle(prompt: string): VPOStyle {
  const p = prompt.toLowerCase();
  if (p.includes('3d') || p.includes('렌더') || p.includes('기계') || p.includes('오브젝트') || p.includes('메카닉') || p.includes('헬리콥터') || p.includes('제품') || p.includes('unreal')) {
    return '3d';
  }
  if (p.includes('사진') || p.includes('실사') || p.includes('인물') || p.includes('포트레이트') || p.includes('얼굴') || p.includes('스튜디오') || p.includes('포토')) {
    return 'photo';
  }
  return 'cinematic';
}

/**
 * 지능형 VPO 최적화 실행 함수
 * 짧은 자연어 입력("3D 헬리콥터", "알프스 설산")도 헐리우드급 프로덕션 메타데이터로 즉각 변환
 */
export function optimizePrompt(
  rawPrompt: string,
  _domain: MediaDomain = 'visual',
  forceStyle?: VPOStyle
): VPOOptimizationResult {
  const style = forceStyle || detectVPOStyle(rawPrompt);
  const cleanInput = rawPrompt.trim() || '고해상도 시네마틱 미디어';

  let engineOrCamera = '';
  let lensOrOptics = '';
  let lighting = '';
  let materials = '';
  const resolution = '8K UHD Master';
  let colorGrade = '';
  let promptSuffix = '';

  if (style === '3d') {
    engineOrCamera = 'Unreal Engine 5.5, Octane Render 2026';
    lensOrOptics = 'Telephoto 85mm Orthographic & Perspective rig';
    lighting = 'Ray-traced soft box studio reflections, Global Illumination';
    materials = 'PBR titanium, forged carbon fiber, anodized aluminum accents';
    colorGrade = 'Neutral Industrial Precision, ACEScg color space';
    promptSuffix = `Unreal Engine 5.5, Octane Render, PBR titanium and carbon materials, Ray-traced reflections, Subsurface scattering, Photorealistic industrial mechanism, 8K resolution masterwork`;
  } else if (style === 'photo') {
    engineOrCamera = 'Hasselblad H6D-100c Medium Format';
    lensOrOptics = '80mm prime lens, f/1.8 aperture';
    lighting = 'Rembrandt natural volumetric side-lighting';
    materials = 'Authentic micro skin pores, fabric thread texture, subsurface scattering';
    colorGrade = 'Kodak Portra 400 grain, balanced skin tones, filmic curve';
    promptSuffix = `Hasselblad H6D, 80mm prime lens, f/1.8, Rembrandt lighting, Kodak Portra 400 grain, micro skin pores and realistic fabric texture, 8K ultra-detailed portrait`;
  } else {
    // cinematic
    engineOrCamera = 'ARRI Alexa 65 Large Format Cinema Camera';
    lensOrOptics = 'Cooke Anamorphic /i Full Frame Plus 40mm';
    lighting = 'Golden hour atmospheric rim light, volumetric fog, anamorphic lens flare';
    materials = 'Hyper-detailed environmental depth, organic particulate dynamics';
    colorGrade = 'Hollywood Arri LogC to Rec.709 filmic LUT, rich cinematic contrast';
    promptSuffix = `ARRI Alexa 65, Cooke Anamorphic lens, cinematic depth of field, dramatic atmospheric lighting, natural environmental mist, 8K theatrical master`;
  }

  const optimizedPrompt = `${cleanInput}, ${promptSuffix}`;

  return {
    rawPrompt: cleanInput,
    optimizedPrompt,
    negativePrompt: SYSTEM_NEGATIVE_GUARDRAILS,
    style,
    technicalSpecs: {
      engineOrCamera,
      lensOrOptics,
      lighting,
      materials,
      resolution,
      colorGrade
    },
    c2paSigned: true
  };
}
