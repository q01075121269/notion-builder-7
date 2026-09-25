// src/components/spark/artifacts/SlidesDeckRenderer.tsx
// 16:9 와이드 비율의 프레젠테이션 카드 덱 렌더러

import React, { useState } from 'react';
import type { OfficeDocument, SlideItem } from '../../../types/office';
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
  Target
} from 'lucide-react';

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
  const activeSlide: SlideItem = slides[currentSlideIndex] || {
    id: 'default-1',
    title: document.title || '발표 자료 슬라이드',
    subtitle: '스마트 행정 및 자동화 추진 전략',
    bullets: ['핵심 추진 과제 1', '핵심 실행 방안 2', '기대 효과 및 로드맵 3'],
    badge: 'STRATEGY'
  };

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
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: '새로운 핵심 전략 슬라이드',
      subtitle: '추진 과제 및 세부 실행 계획 요약',
      bullets: [
        '단계별 마일스톤 및 리소스 배분 계획',
        '정량적 성과 지표(KPI) 및 데이터 검증 체계',
        '사내 변경 관리 및 단계적 확산 가이드라인'
      ],
      badge: 'PHASE ' + (slides.length + 1)
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
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${styleMeta.themeTokens.container} transition-all duration-200 select-text`}>
      
      {/* 1. 상단 슬라이드 덱 컨트롤 헤더 */}
      <div className="w-full max-w-[1040px] mb-4 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                16:9 프레젠테이션 슬라이드 덱
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Slide {currentSlideIndex + 1} of {Math.max(1, slides.length)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                  ? `${styleMeta.themeTokens.badge} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
              title={s.title}
            >
              #{idx + 1}
            </button>
          ))}
          <button
            onClick={handleAddSlide}
            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer shrink-0"
            title="새 슬라이드 추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 중앙 16:9 와이드 메인 프레젠테이션 카드 뷰어 */}
      <div className="w-full max-w-[1040px] aspect-[16/9] min-h-[460px] flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden transition-all duration-200 group border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white dark:bg-slate-900">
        
        {/* 스타일 배경 오버레이 */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          visualStyle === 'cyber-glow' 
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent' 
            : visualStyle === 'storybook'
            ? 'bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15'
            : visualStyle === '3d-isometric'
            ? 'bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-purple-500/5'
            : ''
        }`} />

        {/* 슬라이드 탑 메타 바 */}
        <div className="flex items-center justify-between w-full relative z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className={styleMeta.themeTokens.badge}>
              {activeSlide.badge || 'EXECUTIVE SUMMARY'}
            </span>
            <span className="text-xs text-slate-400 font-mono tracking-wider">
              SECTION #{currentSlideIndex + 1}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyScript}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center space-x-1 transition cursor-pointer"
              title="슬라이드 대본 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={(e) => handleDeleteSlide(currentSlideIndex, e)}
              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs transition cursor-pointer"
              title="현재 슬라이드 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 슬라이드 메인 헤드라인 및 서브타이틀 */}
        <div className="relative z-10 my-auto py-4">
          <input
            type="text"
            value={activeSlide.title}
            onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
            className={`w-full text-2xl sm:text-4xl bg-transparent outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 transition-colors pb-1 ${styleMeta.themeTokens.header}`}
            placeholder="슬라이드 대형 헤드라인을 입력하세요"
          />
          <input
            type="text"
            value={activeSlide.subtitle}
            onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
            className="w-full text-sm sm:text-base text-slate-600 dark:text-slate-300 bg-transparent outline-none mt-2 font-medium"
            placeholder="핵심 메시지 서브타이틀을 입력하세요"
          />

          {/* 3대 핵심 메시지 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            {(activeSlide.bullets || []).slice(0, 3).map((bullet, bIdx) => (
              <div
                key={bIdx}
                className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 ${styleMeta.themeTokens.card}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-blue-600 text-white shrink-0">
                    {bIdx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    핵심 전략 포인트
                  </span>
                </div>
                <textarea
                  value={bullet}
                  onChange={(e) => handleBulletChange(bIdx, e.target.value)}
                  rows={3}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none resize-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed"
                  placeholder="세부 실행 내용을 입력하세요"
                />
              </div>
            ))}
          </div>

          {/* 비주얼 데이터 포인트 (KPI 3종 미니 지표 바) */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">업무 효율 증대</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">+84.5%</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">구축 예상 일정</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">Q3 완료 (4주)</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">목표 정확도</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">99.8% 달성</div>
              </div>
            </div>
          </div>
        </div>

        {/* 슬라이드 풋터 브랜딩 */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 shrink-0 relative z-10">
          <span>{document.title} | 비즈니스 발표 프레젠테이션</span>
          <span className="font-mono">Page {currentSlideIndex + 1} / {slides.length}</span>
        </div>
      </div>

      {/* 3. 하단 슬라이드 덱 네비게이션 & 스피커 노트 토글 */}
      <div className="w-full max-w-[1040px] mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
