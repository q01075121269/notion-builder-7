// src/components/spark/artifacts/SlidesDeckRenderer.tsx
// 16:9 와이드 비율의 프레젠테이션 카드 덱 렌더러 (10대 슬라이드 아키타입 & SVG 차트 내장)

import React, { useState } from 'react';
import type { OfficeDocument, SlideItem, SlideLayoutType } from '../../../types/office';
import type { SparkVisualStyle } from '../../../types/visualStyle';
import { VISUAL_STYLES } from '../../../types/visualStyle';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Mic, 
  Presentation, 
  Copy, 
  Check, 
  TrendingUp,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Workflow,
  Quote,
  Table
} from 'lucide-react';
import { InteractiveBarChart } from '../../office/charts/InteractiveBarChart';
import { DonutProgressGauge } from '../../office/charts/DonutProgressGauge';
import { TimelineConnector } from '../../office/charts/TimelineConnector';

interface SlideStylePreset {
  containerBg: string;
  frameClass: string;
  overlayClass: string;
  badgeClass: string;
  sectionTextClass: string;
  titleClass: string;
  subtitleClass: string;
  cardClass: string;
  cardBadgeClass: string;
  cardCategoryText: string;
  cardTextAreaClass: string;
  kpiBorderClass: string;
  kpiBoxClass: string;
  kpiLabelClass: string;
  kpiValueClass: string;
  footerClass: string;
  controlClass: string;
}

const SLIDE_THEMES: Record<SparkVisualStyle, SlideStylePreset> = {
  '3d-isometric': {
    containerBg: 'bg-[#070b14]',
    frameClass: 'bg-[#090e1a] text-white border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,210,255,0.18)] rounded-3xl',
    overlayClass: 'bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.15),transparent_50%)]',
    badgeClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono uppercase tracking-wider text-xs px-3 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] font-bold',
    sectionTextClass: 'text-cyan-400 font-mono tracking-wider',
    titleClass: 'text-white font-black tracking-tight drop-shadow-[0_2px_12px_rgba(6,182,212,0.4)]',
    subtitleClass: 'text-cyan-200/90 font-medium',
    cardClass: 'backdrop-blur-xl bg-zinc-900/70 border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,190,255,0.15)] rounded-2xl hover:border-cyan-400/60 transition-all',
    cardBadgeClass: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black rounded-full',
    cardCategoryText: 'text-cyan-300 font-semibold',
    cardTextAreaClass: 'text-slate-100 placeholder-zinc-500 font-medium',
    kpiBorderClass: 'border-cyan-500/20',
    kpiBoxClass: 'backdrop-blur-md bg-cyan-950/20 border border-cyan-500/30 rounded-xl',
    kpiLabelClass: 'text-cyan-400 font-medium',
    kpiValueClass: 'text-white font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    footerClass: 'text-cyan-400/70 border-cyan-500/20',
    controlClass: 'bg-zinc-900/90 border-cyan-500/30 text-cyan-200'
  },

  'storybook': {
    containerBg: 'bg-[#ede6da]',
    frameClass: 'bg-[#f4efe6] text-[#2c2825] border-2 border-[#d6cbbe] shadow-xl rounded-3xl',
    overlayClass: 'bg-[radial-gradient(#c5baab_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-25',
    badgeClass: 'bg-[#e2dacd] text-[#5c4e3f] border border-[#cfc3b3] font-bold text-xs px-3 py-1 rounded-full shadow-xs',
    sectionTextClass: 'text-[#8a7b6c] font-mono tracking-wider',
    titleClass: 'text-[#2c2825] font-black tracking-normal',
    subtitleClass: 'text-[#6a5f54] font-medium',
    cardClass: 'rounded-3xl border-2 border-[#d6cbbe] bg-white/90 shadow-sm text-[#2c2825] hover:border-[#b8aa97] transition-all',
    cardBadgeClass: 'bg-[#8c7b6c] text-[#fbf9f5] font-black rounded-full',
    cardCategoryText: 'text-[#7d6d5d] font-bold',
    cardTextAreaClass: 'text-[#2c2825] placeholder-stone-400 font-medium',
    kpiBorderClass: 'border-[#d6cbbe]',
    kpiBoxClass: 'bg-[#ece4d6] border border-[#d6cbbe] rounded-2xl',
    kpiLabelClass: 'text-[#7d6d5d] font-bold',
    kpiValueClass: 'text-[#2c2825] font-black',
    footerClass: 'text-[#8a7b6c] border-[#d6cbbe]',
    controlClass: 'bg-[#f4efe6] border-[#d6cbbe] text-[#2c2825]'
  },

  'mckinsey': {
    containerBg: 'bg-[#050b18]',
    frameClass: 'bg-[#0a1128] text-slate-100 border border-slate-700 shadow-2xl rounded-none',
    overlayClass: 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20',
    badgeClass: 'bg-blue-600 text-white font-mono uppercase tracking-widest text-[11px] px-2.5 py-0.5 rounded-none font-bold',
    sectionTextClass: 'text-slate-400 font-mono tracking-widest',
    titleClass: 'font-serif font-black text-slate-50 tracking-tight',
    subtitleClass: 'text-slate-300 font-sans font-medium',
    cardClass: 'rounded-none border border-slate-700 bg-slate-900/90 shadow-none text-slate-100 hover:border-slate-500 transition-all',
    cardBadgeClass: 'bg-slate-200 text-slate-950 font-bold rounded-none',
    cardCategoryText: 'text-blue-400 font-bold tracking-wider',
    cardTextAreaClass: 'text-slate-100 placeholder-slate-500 font-medium',
    kpiBorderClass: 'border-slate-800',
    kpiBoxClass: 'border border-slate-700 bg-slate-950/80 rounded-none',
    kpiLabelClass: 'text-slate-400 font-semibold',
    kpiValueClass: 'text-slate-50 font-black',
    footerClass: 'text-slate-400 border-slate-800',
    controlClass: 'bg-slate-900 border-slate-700 text-slate-200'
  },

  'cyber-glow': {
    containerBg: 'bg-black',
    frameClass: 'bg-zinc-950 text-cyan-400 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] rounded-xl',
    overlayClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent',
    badgeClass: 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-mono tracking-widest text-xs px-2.5 py-0.5 rounded-xs font-bold',
    sectionTextClass: 'text-cyan-400 font-mono tracking-widest',
    titleClass: 'font-mono text-cyan-300 font-black tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]',
    subtitleClass: 'font-mono text-cyan-200/80 font-medium',
    cardClass: 'bg-black/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-lg text-cyan-200 hover:border-cyan-400 transition-all',
    cardBadgeClass: 'bg-cyan-400 text-black font-black rounded-xs',
    cardCategoryText: 'text-cyan-400 font-mono font-bold',
    cardTextAreaClass: 'text-cyan-200 placeholder-cyan-800 font-mono',
    kpiBorderClass: 'border-cyan-500/40',
    kpiBoxClass: 'bg-zinc-950 border border-cyan-500/40 rounded-lg',
    kpiLabelClass: 'text-cyan-400 font-mono',
    kpiValueClass: 'text-cyan-300 font-mono font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    footerClass: 'text-cyan-500 border-cyan-500/40 font-mono',
    controlClass: 'bg-zinc-950 border-cyan-500/50 text-cyan-300'
  },

  'swiss-minimal': {
    containerBg: 'bg-neutral-100',
    frameClass: 'bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000] rounded-none',
    overlayClass: 'bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] opacity-10',
    badgeClass: 'bg-black text-white font-mono font-bold tracking-wider text-xs px-2.5 py-0.5 rounded-none',
    sectionTextClass: 'text-neutral-500 font-mono tracking-widest',
    titleClass: 'text-black font-black tracking-tighter uppercase',
    subtitleClass: 'text-neutral-700 font-medium',
    cardClass: 'bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none text-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all',
    cardBadgeClass: 'bg-black text-white font-black rounded-none',
    cardCategoryText: 'text-black font-mono font-bold',
    cardTextAreaClass: 'text-black placeholder-neutral-400 font-medium',
    kpiBorderClass: 'border-black',
    kpiBoxClass: 'bg-neutral-100 border border-black rounded-none',
    kpiLabelClass: 'text-black font-bold font-mono',
    kpiValueClass: 'text-black font-black',
    footerClass: 'text-neutral-600 border-black',
    controlClass: 'bg-white border-black text-black shadow-[2px_2px_0px_#000]'
  }
};

export interface SlideLayoutMeta {
  id: SlideLayoutType;
  label: string;
  emoji: string;
  desc: string;
}

export const SLIDE_LAYOUTS: SlideLayoutMeta[] = [
  { id: 'barchart', label: '막대 분석형', emoji: '📊', desc: '상단 핵심 메시지 + 대형 SVG 막대 차트 + 통계 브리프' },
  { id: 'donut', label: '도넛 차트형', emoji: '🍩', desc: '예산/점유율 원형 게이지 + 우측 범례 및 주요 항목 명세' },
  { id: 'kpi-impact', label: 'KPI 임팩트형', emoji: '🚀', desc: '초대형 볼드 타이포 + 증감률 태그 + 서브 게이지 바' },
  { id: 'problem-solution', label: '문제 vs 해결', emoji: '⚖️', desc: '현재의 병목(적색) vs 도입 후 혁신(청색) 2단 분할' },
  { id: 'triad-matrix', label: '3-Way 비교', emoji: '🏛️', desc: 'A안(정석), B안(파격), C안(실속) 3단 입체 비교 카드' },
  { id: 'timeline-roadmap', label: '타임라인 로드맵', emoji: '⏱️', desc: '4단계 추진 일정 파이프라인 및 주차별 마일스톤' },
  { id: 'bento-dashboard', label: 'Bento 대시보드', emoji: '🍱', desc: '4열 비대칭 벤토 카드로 요약/수치/로드맵 집약' },
  { id: 'system-pipeline', label: '시스템 파이프라인', emoji: '⚡', desc: '입력 ➔ AI 코어 ➔ 출력 자동화 3단 블록 연결' },
  { id: 'executive-quote', label: '결론/인용형', emoji: '💬', desc: 'C레벨 직보고용 대형 인용구 및 핵심 의사결정 콜아웃' },
  { id: 'budget-grid', label: '예산 상세 그리드', emoji: '💰', desc: '항목별 금액 표 + 누적 예산 프로그레스 바' }
];

interface SlidesDeckRendererProps {
  document: OfficeDocument;
  visualStyle?: SparkVisualStyle;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const SlidesDeckRenderer: React.FC<SlidesDeckRendererProps> = ({
  document,
  visualStyle = '3d-isometric',
  onChangeDocument,
  onShowToast
}) => {
  const slides = document.content.slidesContent?.slides || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState<Record<number, string>>({
    0: '오프닝 스크립트: 본 프로젝트의 핵심 목표와 배경을 강조하고, 사내외 이해관계자들의 공감을 이끌어내는 인트로 진행.'
  });
  const [copied, setCopied] = useState(false);

  const styleMeta = VISUAL_STYLES[visualStyle] || VISUAL_STYLES['3d-isometric'];
  const slideTheme = SLIDE_THEMES[visualStyle] || SLIDE_THEMES['3d-isometric'];

  const defaultLayouts: SlideLayoutType[] = [
    'barchart',
    'donut',
    'kpi-impact',
    'problem-solution',
    'triad-matrix',
    'timeline-roadmap',
    'bento-dashboard',
    'system-pipeline',
    'executive-quote',
    'budget-grid'
  ];

  const activeSlide: SlideItem = slides[currentSlideIndex] || {
    id: 'default-1',
    title: document.title || '발표 자료 슬라이드',
    subtitle: '스마트 행정 및 자동화 추진 전략',
    bullets: ['핵심 추진 과제 1', '핵심 실행 방안 2', '기대 효과 및 로드맵 3'],
    badge: 'STRATEGY',
    layout: defaultLayouts[currentSlideIndex % defaultLayouts.length]
  };

  const currentLayout: SlideLayoutType = activeSlide.layout || defaultLayouts[currentSlideIndex % defaultLayouts.length];

  const handleUpdateActiveSlide = (partial: Partial<SlideItem>) => {
    const updatedSlide = { ...activeSlide, ...partial };
    const updatedSlides = slides.map((s, idx) => idx === currentSlideIndex ? updatedSlide : s);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updatedSlides }
      }
    }, '슬라이드 실시간 편집');
  };

  const handleAddSlide = () => {
    const nextIdx = slides.length;
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: '새로운 핵심 전략 슬라이드',
      subtitle: '추진 과제 및 세부 실행 계획 요약',
      bullets: [
        '단계별 마일스톤 및 리소스 배분 계획',
        '정량적 성과 지표(KPI) 및 데이터 검증 체계',
        '사내 변경 관리 및 단계적 확산 가이드라인'
      ],
      badge: 'PHASE ' + (nextIdx + 1),
      layout: defaultLayouts[nextIdx % defaultLayouts.length]
    };
    const updated = [...slides, newSlide];
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updated }
      }
    }, '새 슬라이드 추가');
    setCurrentSlideIndex(updated.length - 1);
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) {
      onShowToast?.('최소 1장의 슬라이드는 유지되어야 합니다.', 'info');
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updated }
      }
    }, '슬라이드 삭제');
    if (currentSlideIndex >= updated.length) {
      setCurrentSlideIndex(updated.length - 1);
    }
  };

  const handleBulletChange = (idx: number, text: string) => {
    const newBullets = [...(activeSlide.bullets || [])];
    newBullets[idx] = text;
    handleUpdateActiveSlide({ bullets: newBullets });
  };

  const handleCopyScript = () => {
    const text = `[Slide ${currentSlideIndex + 1}: ${activeSlide.title}]\n${activeSlide.subtitle}\n\n- ${activeSlide.bullets.join('\n- ')}\n\n[발표자 노트]\n${speakerNotes[currentSlideIndex] || '노트 없음'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onShowToast?.('슬라이드 대본이 클립보드에 복사되었습니다.', 'success');
  };

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${slideTheme.containerBg} transition-all duration-300 select-text`}>
      
      {/* 1. 상단 슬라이드 덱 컨트롤 헤더 */}
      <div className={`w-full max-w-[1040px] mb-3 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-sm transition-all duration-200 ${slideTheme.controlClass}`}>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold">
                16:9 프레젠테이션 슬라이드 덱
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Slide {currentSlideIndex + 1} of {Math.max(1, slides.length)}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              스타일: {styleMeta.name} ({styleMeta.emoji})
            </p>
          </div>
        </div>

        {/* 미니 썸네일 스트립 */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full sm:max-w-md py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer
                ${idx === currentSlideIndex
                  ? `${slideTheme.badgeClass} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-black/10 dark:bg-white/10 opacity-70 hover:opacity-100'
                }
              `}
              title={s.title}
            >
              #{idx + 1}
            </button>
          ))}
          <button
            onClick={handleAddSlide}
            className="p-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-blue-500 hover:text-white transition cursor-pointer shrink-0"
            title="새 슬라이드 추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 📐 슬라이드 레이아웃 (10종) 선택 가로 스크롤 바 */}
      <div className="w-full max-w-[1040px] mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-zinc-400 shrink-0 text-[11px] mr-1 flex items-center gap-1">
          <span>📐 레이아웃:</span>
        </span>
        {SLIDE_LAYOUTS.map(ly => {
          const isSelected = currentLayout === ly.id;
          return (
            <button
              key={ly.id}
              onClick={() => handleUpdateActiveSlide({ layout: ly.id })}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
              title={ly.desc}
            >
              <span>{ly.emoji}</span>
              <span>{ly.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. 중앙 16:9 와이드 메인 프레젠테이션 카드 뷰어 */}
      <div className={`w-full max-w-[1040px] aspect-[16/9] min-h-[500px] flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden transition-all duration-300 group ${slideTheme.frameClass}`}>
        
        {/* 스타일 배경 오버레이 */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${slideTheme.overlayClass}`} />

        {/* 슬라이드 탑 메타 바 */}
        <div className="flex items-center justify-between w-full relative z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className={slideTheme.badgeClass}>
              {activeSlide.badge || 'EXECUTIVE SUMMARY'}
            </span>
            <span className={`text-xs ${slideTheme.sectionTextClass}`}>
              SECTION #{currentSlideIndex + 1} • {SLIDE_LAYOUTS.find(l => l.id === currentLayout)?.label}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyScript}
              className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs flex items-center space-x-1 transition cursor-pointer"
              title="슬라이드 대본 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={(e) => handleDeleteSlide(currentSlideIndex, e)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs transition cursor-pointer"
              title="현재 슬라이드 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 슬라이드 메인 헤드라인 및 서브타이틀 */}
        <div className="relative z-10 my-auto py-2 flex flex-col justify-center">
          <input
            type="text"
            value={activeSlide.title}
            onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
            className={`w-full text-2xl sm:text-3.5xl bg-transparent outline-none border-b border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-blue-500 transition-colors pb-1 ${slideTheme.titleClass}`}
            placeholder="슬라이드 대형 헤드라인을 입력하세요"
          />
          <input
            type="text"
            value={activeSlide.subtitle}
            onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
            className={`w-full text-xs sm:text-sm bg-transparent outline-none mt-1 ${slideTheme.subtitleClass}`}
            placeholder="핵심 메시지 서브타이틀을 입력하세요"
          />

          {/* ========================================================================= */}
          {/* 10대 레이아웃 동적 교체 렌더링 영역 */}
          {/* ========================================================================= */}
          <div className="mt-4">
            
            {/* 1. [막대 그래프 분석형] */}
            {currentLayout === 'barchart' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2">
                  <InteractiveBarChart
                    title="연도별 AI 행정 처리량 및 공수 절감 실측치"
                    growthTag="+38% 성장"
                    unit="k건"
                    height={180}
                  />
                </div>
                <div className={`p-4 flex flex-col justify-between ${slideTheme.cardClass}`}>
                  <div>
                    <span className="text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 통계 분석 브리프
                    </span>
                    <h5 className="text-xs font-bold text-white mb-2">기존 수기 작성 대비 생산성 3배</h5>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      2026년 하반기 전사 확대 시 연간 12만 건 이상의 반복 기안서와 수식 검증이 단일 골든 패스로 1초 자동화됩니다.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-bold">
                    ✓ 재무/감사 승인 리스크 0%
                  </div>
                </div>
              </div>
            )}

            {/* 2. [도넛 비중 차트형] */}
            {currentLayout === 'donut' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <DonutProgressGauge
                  value={84.5}
                  size={160}
                  title="2026 목표 달성률 (84.5%)"
                  subtitle="전사 행정 디지털화 완수율"
                  secondaryValue={68}
                  secondaryLabel="예산 조기 집행률"
                />
                <div className="space-y-2.5">
                  <div className={`p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 ${slideTheme.cardClass}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                      <span>핵심 엔진 라이선스 (48M)</span>
                      <span>56.4%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Gemini Pro API 및 엔터프라이즈 전사 시트</p>
                  </div>
                  <div className={`p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 ${slideTheme.cardClass}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span>온프레미스 보안 인프라 (25M)</span>
                      <span>29.4%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">정보보안 규정 제45조 연동 게이트웨이</p>
                  </div>
                  <div className={`p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 ${slideTheme.cardClass}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span>파일럿 운영 & 예비비 (12M)</span>
                      <span>14.2%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">30인 실증 부서 피드백 리워드</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. [대형 KPI 임팩트형] */}
            {currentLayout === 'kpi-impact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-6 rounded-2xl flex flex-col justify-center items-center text-center ${slideTheme.cardClass}`}>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    기안 수립 공수 절감
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-cyan-400 tracking-tight my-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    78%
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                    ▲ 4.2시간 ➔ 50분 단축
                  </span>
                </div>

                <div className={`p-6 rounded-2xl flex flex-col justify-center items-center text-center ${slideTheme.cardClass}`}>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    데이터 정합성 및 무결성
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-purple-400 tracking-tight my-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    100%
                  </div>
                  <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800">
                    =SUM 수식 자동 검증 통과
                  </span>
                </div>
              </div>
            )}

            {/* 4. [문제 vs 해결 2단 분할형] */}
            {currentLayout === 'problem-solution' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 현재의 병목 (적색 테두리) */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border-2 border-rose-500/40 text-rose-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>CURRENT BOTTLENECK (현재 문제점)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-rose-200/90">
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>문서·엑셀·슬라이드 제각각 작성으로 데이터 불일치 빈발</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>수기 예산 집행 시 합계 오류로 재무팀 반려율 32% 달함</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>사내 보안 규정 검토에만 평균 2주 이상 소요되는 지연</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-[10px] text-rose-400/80 font-mono mt-3 pt-2 border-t border-rose-900/40">
                    * 비효율 공수 연간 약 3.8억원 낭비
                  </div>
                </div>

                {/* AI 도입 후 혁신 (청색 테두리) */}
                <div className="p-4 rounded-2xl bg-blue-950/20 border-2 border-blue-500/50 text-blue-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>INNOVATIVE SOLUTION (AI 오피스 혁신)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-blue-100">
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>단일 지식 소스 기반 4대 완제품 문서 0초 동시 출하</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>사내 표준 결재선(4단) 및 예산 =SUM 공식 100% 무결성</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>정보보안 규정 제45조 보안 프록시로 사전 적합성 통과</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-3 pt-2 border-t border-blue-900/40 font-bold">
                    * 대표이사 재가 상신 시간 70% 단축
                  </div>
                </div>
              </div>
            )}

            {/* 5. [3-Way 전략 비교 매트릭스형] */}
            {currentLayout === 'triad-matrix' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-2xl border ${slideTheme.cardClass} relative`}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    OPTION A • 안정형
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1.5 mb-1">사내 표준 온프레미스</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    폐쇄망 격리 및 4단 결재 완벽 지원. 금융/공공 기관 필수 규격.
                  </p>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                    예산: 8,500만원 / 4주 완료
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border-2 border-blue-500/50 bg-blue-950/30 ${slideTheme.cardClass} relative`}>
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                    추천안
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                    OPTION B • 혁신형
                  </span>
                  <h5 className="text-xs font-bold text-cyan-300 mt-1.5 mb-1">하이브리드 AI 에이전트</h5>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    구글 웹 그라운딩 + 사내 위키 자동 연동. 생산성 3.2배 향상.
                  </p>
                  <div className="mt-3 pt-2 border-t border-blue-800/50 text-[10px] font-mono text-cyan-300 font-bold">
                    예산: 1억 1,000만원 / 6주 완료
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${slideTheme.cardClass} relative`}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    OPTION C • MVP형
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1.5 mb-1">초고속 파일럿 팩</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    핵심 1개 부서 30인 즉시 적용. 2주 내 검증 보고서 도출.
                  </p>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                    예산: 3,500만원 / 2주 완료
                  </div>
                </div>
              </div>
            )}

            {/* 6. [단계별 타임라인 로드맵형] */}
            {currentLayout === 'timeline-roadmap' && (
              <TimelineConnector
                title="2026 하반기 오피스 스튜디오 도입 4단계 로드맵"
              />
            )}

            {/* 7. [Bento Grid 복합 대시보드형] */}
            {currentLayout === 'bento-dashboard' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-2xl sm:col-span-2 ${slideTheme.cardClass}`}>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    핵심 추진 미션
                  </span>
                  <h5 className="text-xs font-bold text-white mb-1.5">문서 수립 단일 골든 패스 구축</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    기안서-시트-장표 3대 산출물 간 데이터 정합성을 100% 보장하는 AI 오피스 파이프라인.
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl flex flex-col justify-between ${slideTheme.cardClass}`}>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    보안 규정 준수
                  </span>
                  <div className="text-2xl font-black text-white font-mono my-1">
                    100%
                  </div>
                  <span className="text-[10px] text-zinc-400">제45조 검증 통과</span>
                </div>

                <div className={`p-3.5 rounded-2xl flex flex-col justify-between ${slideTheme.cardClass}`}>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    총 소요 예산
                  </span>
                  <div className="text-xl font-black text-white font-mono my-1">
                    8,500만
                  </div>
                  <span className="text-[10px] text-zinc-400">연간 운영 선지급</span>
                </div>
              </div>
            )}

            {/* 8. [시스템 파이프라인형] */}
            {currentLayout === 'system-pipeline' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className={`p-4 rounded-2xl border text-center ${slideTheme.cardClass}`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">1. 멀티 소스 수집</h5>
                  <p className="text-[11px] text-zinc-400">
                    PDF, 노션 링크, 구글 실시간 검색 27개 출처 자동 그라운딩
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 text-center ${slideTheme.cardClass}`}>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-cyan-300 mb-1">2. AI 지식 합성 코어</h5>
                  <p className="text-[11px] text-zinc-300">
                    3-Way 기획 생성, 사내 표준 결재선 및 =SUM 수식 자동 바인딩
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border text-center ${slideTheme.cardClass}`}>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">3. 완제품 동시 출하</h5>
                  <p className="text-[11px] text-zinc-400">
                    공문서(HWP/DOC), 정밀 시트(XLSX), 발표 장표(PPTX) 즉시 배포
                  </p>
                </div>
              </div>
            )}

            {/* 9. [경영진 1-Page 결론 인용형] */}
            {currentLayout === 'executive-quote' && (
              <div className={`p-6 rounded-2xl border ${slideTheme.cardClass} flex flex-col justify-between`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Quote className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                      "정보보안 규정 제45조를 완벽히 준수하면서 기안 작성 공수를 70% 단축하는 단 하나의 골든 패스입니다."
                    </h4>
                    <p className="text-xs text-zinc-400 mt-2">
                      — 신사업전략본부 AI솔루션팀 및 전사 감사위원회 합동 검토 의견
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">결재 상신: 4단 승인 라인 완료 (대표이사 최종 재가 대기)</span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                    즉시 집행 가능 (Ready)
                  </span>
                </div>
              </div>
            )}

            {/* 10. [예산/비용 상세 그리드형] */}
            {currentLayout === 'budget-grid' && (
              <div className={`p-4 rounded-2xl border ${slideTheme.cardClass} space-y-3`}>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span>소요 예산 표준 그리드 (단위: 원)</span>
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">총 합계: 85,000,000원</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">SW 라이선스</div>
                    <div className="font-bold text-white mt-1">48,000,000</div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">인프라 구축비</div>
                    <div className="font-bold text-white mt-1">25,000,000</div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">파일럿 운영비</div>
                    <div className="font-bold text-white mt-1">5,000,000</div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">예비비</div>
                    <div className="font-bold text-white mt-1">7,000,000</div>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>예산 확정 진척률</span>
                    <span className="font-mono font-bold text-emerald-400">100% 확보 완료</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full w-full" />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 슬라이드 불릿 포인트 직접 인라인 편집 바 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            {(activeSlide.bullets || []).slice(0, 3).map((bullet, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs">
                <span className="w-4 h-4 rounded-full bg-blue-600/80 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {bIdx + 1}
                </span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => handleBulletChange(bIdx, e.target.value)}
                  className="w-full bg-transparent outline-none text-zinc-200 text-xs truncate"
                  placeholder={`실행 항목 ${bIdx + 1}`}
                />
              </div>
            ))}
          </div>

          {/* 비주얼 데이터 포인트 (KPI 3종 미니 지표 바) */}
          <div className={`grid grid-cols-3 gap-3 mt-4 pt-3 border-t ${slideTheme.kpiBorderClass}`}>
            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>업무 효율 증대</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>+84.5%</div>
              </div>
            </div>

            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>구축 예상 일정</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>Q3 완료 (4주)</div>
              </div>
            </div>

            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>목표 정확도</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>99.8% 달성</div>
              </div>
            </div>
          </div>
        </div>

        {/* 슬라이드 풋터 브랜딩 */}
        <div className={`flex items-center justify-between text-[11px] border-t pt-2 shrink-0 relative z-10 ${slideTheme.footerClass}`}>
          <span>{document.title} | 비즈니스 발표 프레젠테이션</span>
          <span className="font-mono">Page {currentSlideIndex + 1} / {slides.length}</span>
        </div>
      </div>

      {/* 3. 하단 슬라이드 덱 네비게이션 & 스피커 노트 토글 */}
      <div className="w-full max-w-[1040px] mt-4 flex flex-col gap-2">
        <div className={`flex items-center justify-between p-3 rounded-2xl border shadow-sm transition-all duration-200 ${slideTheme.controlClass}`}>
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전 슬라이드</span>
          </button>

          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`
              flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer
              ${showSpeakerNotes
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/50 hover:bg-amber-100'
              }
            `}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{showSpeakerNotes ? '발표자 스피커 노트 닫기' : '🎙️ 발표자 스피커 노트 열기'}</span>
          </button>

          <button
            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <span>다음 슬라이드</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 접이식 발표자 스피커 노트 패널 */}
        {showSpeakerNotes && (
          <div className="w-full bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/60 rounded-2xl p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Mic className="w-4 h-4 text-amber-600" />
                <span>발표자 스피커 노트 & Q&A 방어 대본 (Slide #{currentSlideIndex + 1})</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                실시간 키노트 프롬프터 연동
              </span>
            </div>
            <textarea
              value={speakerNotes[currentSlideIndex] || ''}
              onChange={(e) => setSpeakerNotes(prev => ({ ...prev, [currentSlideIndex]: e.target.value }))}
              rows={4}
              placeholder="이 슬라이드를 발표할 때 언급할 핵심 멘트, 예상 질문 및 방어 논리를 작성하세요..."
              className="w-full text-xs bg-white/80 dark:bg-black/40 text-slate-800 dark:text-slate-200 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 outline-none leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

    </div>
  );
};
