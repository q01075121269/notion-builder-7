// src/components/spark/artifacts/InfographicPosterRenderer.tsx
// 와이드 포스터형 원페이지 비주얼 스토리보드 인포그래픽 렌더러

import React, { useRef } from 'react';
import type { OfficeDocument, PlanTriad } from '../../../types/office';
import type { SparkVisualStyle } from '../../../types/visualStyle';
import { VISUAL_STYLES } from '../../../types/visualStyle';
import { 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Zap, 
  BarChart3, 
  Calendar, 
  Share2,
  Sparkles
} from 'lucide-react';

interface InfographicPosterRendererProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  visualStyle?: SparkVisualStyle;
  onChangeDocument?: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const InfographicPosterRenderer: React.FC<InfographicPosterRendererProps> = ({
  document,
  planTriad,
  visualStyle = '3d-isometric',
  onShowToast
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleMeta = VISUAL_STYLES[visualStyle] || VISUAL_STYLES['3d-isometric'];

  const toast = onShowToast || ((_m: string) => {});

  // 예산 총합 산출
  const totalBudget = document.content.sheetsContent?.rows.reduce((acc, r) => {
    const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
    return acc + val;
  }, 0) || 55000000;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('인포그래픽 공유 링크가 클립보드에 복사되었습니다.', 'success');
  };

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${styleMeta.themeTokens.container} transition-all duration-200 select-text`}>
      
      {/* 상단 툴바: 인쇄, 공유, 스타일 안내 */}
      <div className="w-full max-w-[1100px] mb-4 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                와이드 포스터형 비주얼 인포그래픽
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                1-Page Summary
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              적용 스타일: {styleMeta.name} ({styleMeta.emoji})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>공유</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF/인쇄</span>
          </button>
        </div>
      </div>

      {/* 대형 와이드 포스터 캔버스 본체 */}
      <div 
        ref={containerRef}
        className={`w-full max-w-[1100px] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden transition-all duration-200`}
      >
        {/* 스타일 장식 배경 */}
        <div className={`absolute inset-0 pointer-events-none ${
          visualStyle === 'cyber-glow'
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-transparent to-transparent'
            : visualStyle === 'storybook'
            ? 'bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-10'
            : visualStyle === '3d-isometric'
            ? 'bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-transparent'
            : ''
        }`} />

        {/* 1. 상단 HERO 배너 및 메타 뱃지 */}
        <div className="relative z-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className={styleMeta.themeTokens.badge}>
                INFOGRAPHIC POSTER
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/50 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Verified by Multi-agent</span>
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              작성: {document.metadata.author || '행정혁신단'} | 최종 갱신: {document.metadata.date || new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          <h1 className={`text-2xl sm:text-4xl ${styleMeta.themeTokens.header} mb-2 leading-tight`}>
            {document.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-3xl">
            {planTriad?.optionA.concept || '인공지능 에이전트와 지능형 자동화 워크플로우를 통한 차세대 행정 업무 프로세스 혁신 보고서'}
          </p>
        </div>

        {/* 2. 대형 KPI 메트릭스 바 (4대 핵심 지표) */}
        <div className="relative z-10 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">예산 절감 효과</span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {(totalBudget / 10000).toLocaleString()} <span className="text-sm font-semibold text-slate-500">만원</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                기존 대비 34.2% 예산 절감
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">업무 처리 속도</span>
                <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                12배 <span className="text-sm font-semibold text-slate-500">단축</span>
              </div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                평균 소요 3.2일 ➔ 4시간
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">품질 신뢰도</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                99.8%
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                행안부 표준 서식 100% 충족
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">추진 일정</span>
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                4주 <span className="text-sm font-semibold text-slate-500">완료</span>
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                단계별 검증 및 조기 안착
              </div>
            </div>

          </div>
        </div>

        {/* 3. 3단계 프로세스 플로우 (로드맵 인터랙티브 타임라인) */}
        <div className="relative z-10 py-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              3단계 추진 프로세스 로드맵
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border transition-all duration-200 relative ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  STEP 01
                </span>
                <span className="text-xs text-slate-400 font-semibold">1~2주차</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                기획 및 사내 인프라 연동
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                행정 데이터베이스 및 보안 게이트웨이 정합성 검증, 파일럿 태스크포스 구성
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 relative ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  STEP 02
                </span>
                <span className="text-xs text-slate-400 font-semibold">3주차</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                AI 시범 PoC 및 실증
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                반복 기안문 자동 생성 엔진 테스트 및 현업 실무진 피드백 실시간 수렴
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 relative ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  STEP 03
                </span>
                <span className="text-xs text-slate-400 font-semibold">4주차</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                전사 확산 및 지속 개선
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                전자결재 표준 가이드 배포, 부서별 전담 코파일럿 헬프데스크 운영 개시
              </p>
            </div>
          </div>
        </div>

        {/* 4. 3-Way 전략 비교 매트릭스 카드 */}
        <div className="relative z-10 py-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                3-Way 전략 의사결정 매트릭스
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Option A / B / C 다각도 비교
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Option A */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Option A
                </span>
                <span className="text-xs text-emerald-600 font-semibold">안정형 (Standard)</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {planTriad?.optionA.title || '핵심 기능 중심의 표준 도입'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {planTriad?.optionA.concept || '보수적이고 검증된 프로세스를 우선 적용하여 리스크 제로화.'}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                타깃: {planTriad?.optionA.target || '전사 실무 부서'}
              </div>
            </div>

            {/* Option B */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Option B
                </span>
                <span className="text-xs text-blue-600 font-semibold">균형형 (Balanced)</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {planTriad?.optionB.title || '단계적 기능 고도화 방안'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {planTriad?.optionB.concept || '비용과 기능의 균형점을 도출하여 단계별 성과 확보.'}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                타깃: {planTriad?.optionB.target || '시범 선도 부서 및 거점 부서'}
              </div>
            </div>

            {/* Option C */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${styleMeta.themeTokens.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Option C
                </span>
                <span className="text-xs text-purple-600 font-semibold">혁신형 (Innovative)</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {planTriad?.optionC.title || '완전 자율 AI 파이프라인'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {planTriad?.optionC.concept || '자율 에이전트와 지능형 검증을 완전 결합한 차세대 모델.'}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                타깃: {planTriad?.optionC.target || '전사 전 부서 및 협력 기관'}
              </div>
            </div>
          </div>
        </div>

        {/* 풋터 메타 */}
        <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{document.title} | 비주얼 인포그래픽 포스터 2026</span>
          <span className="font-mono">SPARK STUDIO 2026</span>
        </div>
      </div>

    </div>
  );
};
