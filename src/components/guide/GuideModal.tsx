import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Share2, 
  Sparkles, 
  BookOpen, 
  Type, 
  Check, 
  Smile,
  Heart
} from 'lucide-react';
import type { GuideAudience } from '../../types/guide';
import { MermaidDiagram } from './MermaidDiagram';
import { GuidePrintLayout } from './GuidePrintLayout';
import confetti from 'canvas-confetti';

export const GuideModal: React.FC = () => {
  const {
    isGuideModalOpen,
    setIsGuideModalOpen,
    currentGuide,
    generateGuide,
    isGeneratingGuide,
    appendGuideToNotion,
    isAppendingGuideToNotion
  } = useApp();

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [viewStyle, setViewStyle] = useState<'cards' | 'full'>('cards');
  const [isSeniorFont, setIsSeniorFont] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [notionAppendNotice, setNotionAppendNotice] = useState<string | null>(null);

  if (!isGuideModalOpen || !currentGuide) return null;

  const totalSlides = 5;

  const handleAudienceChange = async (aud: GuideAudience) => {
    if (aud === 'seniors') {
      setIsSeniorFont(true);
    } else {
      setIsSeniorFont(false);
    }
    await generateGuide(aud);
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : prev));
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `📖 [${currentGuide.templateTitle}] 초보자 친절 사용 설명서
헤드라인: ${currentGuide.headline}

📌 3줄 핵심 요약:
${currentGuide.summary.map(s => `- ${s}`).join('\n')}

👉 첫날 딱 3가지만 따라하기:
${currentGuide.firstDaySteps.map(st => `${st.stepNumber}. ${st.title} (${st.actionExample})`).join('\n')}

자세한 설명서는 웹 앱(http://localhost:5173/)에서 확인하실 수 있습니다!`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleAppendToNotion = async () => {
    setNotionAppendNotice(null);
    const result = await appendGuideToNotion();
    if (result.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      setNotionAppendNotice('🟢 노션 페이지 최상단에 [📖 친절한 설명서 (열기)] 토글 블록이 성공적으로 삽입되었습니다!');
    } else {
      setNotionAppendNotice(`⚠️ ${result.message}`);
    }
  };

  // Senior Font Scale Classes
  const titleClass = isSeniorFont ? 'text-xl sm:text-2xl font-black' : 'text-lg sm:text-xl font-bold';
  const bodyClass = isSeniorFont ? 'text-base sm:text-lg leading-relaxed' : 'text-xs sm:text-sm leading-relaxed';
  const smallClass = isSeniorFont ? 'text-sm font-semibold' : 'text-xs';

  return (
    <>
      {/* Print Dedicated Layout (Triggered only during window.print()) */}
      <GuidePrintLayout guide={currentGuide} isSeniorMode={isSeniorFont} />

      {/* Screen Interactive Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden">
        <div 
          className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-2xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-notion-dark-border gap-2.5 bg-neutral-50/80 dark:bg-neutral-900/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    초보자 눈높이 친절 설명서
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    쉬운 가이드
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {currentGuide.templateTitle} • 초등학생/어르신도 바로 따라 하는 가이드
                </p>
              </div>
            </div>

            {/* Audience Switcher & Close */}
            <div className="flex items-center justify-between sm:justify-end space-x-1.5">
              {/* Audience Buttons */}
              <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => handleAudienceChange('general')}
                  disabled={isGeneratingGuide}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                    currentGuide.targetAudience === 'general'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="일반 초보자 눈높이"
                >
                  일반
                </button>
                <button
                  onClick={() => handleAudienceChange('kids')}
                  disabled={isGeneratingGuide}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center space-x-0.5 ${
                    currentGuide.targetAudience === 'kids'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="초등학생/어린이 눈높이 (재미있는 비유)"
                >
                  <Smile className="w-3 h-3 text-amber-500 mr-0.5" />
                  <span>초등학생</span>
                </button>
                <button
                  onClick={() => handleAudienceChange('seniors')}
                  disabled={isGeneratingGuide}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center space-x-0.5 ${
                    currentGuide.targetAudience === 'seniors'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="어르신/시니어 맞춤 (공손한 존댓말)"
                >
                  <Heart className="w-3 h-3 text-rose-500 mr-0.5" />
                  <span>어르신</span>
                </button>
              </div>

              {/* Senior Big Font Toggle */}
              <button
                onClick={() => setIsSeniorFont(!isSeniorFont)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center space-x-1 ${
                  isSeniorFont
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
                title="어르신을 위한 큰 글씨 모드 토글"
              >
                <Type className="w-3.5 h-3.5" />
                <span>{isSeniorFont ? '큰글씨 끄기' : '큰글씨'}</span>
              </button>

              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation: Card News Slider vs Full Document & Print Actions */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-neutral-100 dark:border-neutral-800 text-xs bg-white dark:bg-notion-dark-card">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewStyle('cards')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  viewStyle === 'cards'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                카드 뉴스 넘겨보기
              </button>
              <button
                onClick={() => setViewStyle('full')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  viewStyle === 'full'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                전체 문서로 보기
              </button>
            </div>

            {/* Actions: Notion Append, Share, Print */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleAppendToNotion}
                disabled={isAppendingGuideToNotion}
                className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold flex items-center space-x-1 transition border border-emerald-200 dark:border-emerald-800"
                title="노션 페이지 본문 최상단에 토글 블록으로 삽입"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{isAppendingGuideToNotion ? '노션 삽입 중...' : '노션에 설명서 추가'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
                title="가이드 요약 복사 (카카오톡/문자 전송용)"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
                title="인쇄 및 PDF 다운로드"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Append Notice Banner */}
          {notionAppendNotice && (
            <div className="mx-5 mt-3 p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs flex items-center justify-between">
              <span>{notionAppendNotice}</span>
              <button onClick={() => setNotionAppendNotice(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* VIEW 1: CARD NEWS SLIDER MODE */}
            {viewStyle === 'cards' ? (
              <div className="space-y-4">
                
                {/* Slide 0: 3줄 요약 카드 */}
                {currentSlide === 0 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 dark:from-amber-950/20 dark:via-neutral-900 dark:to-orange-950/10 border border-amber-200/80 dark:border-amber-900/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                        1단계: 핵심 요약
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">1 / 5</span>
                    </div>

                    <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                      {currentGuide.headline}
                    </h2>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        📌 이 템플릿으로 할 수 있는 일 3가지
                      </h4>
                      <div className="space-y-2.5">
                        {currentGuide.summary.map((point, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-3 p-3 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200/70 dark:border-neutral-700/60 shadow-xs"
                          >
                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className={`${bodyClass} text-neutral-800 dark:text-neutral-200`}>
                              {point}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 1: 첫날 딱 3가지만 따라 하기 */}
                {currentSlide === 1 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 dark:from-blue-950/20 dark:via-neutral-900 dark:to-cyan-950/10 border border-blue-200/80 dark:border-blue-900/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                        2단계: 첫날 행동 요령
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">2 / 5</span>
                    </div>

                    <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                      🚀 오늘 딱 3가지만 따라 해보세요!
                    </h2>
                    <p className={`${smallClass} text-neutral-500 dark:text-neutral-400`}>
                      컴퓨터나 노션을 몰라도 괜찮아요. 아래 순서대로 1번부터 차근차근 눌러보세요.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {currentGuide.firstDaySteps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{step.icon}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {step.calloutBadge || `Step ${step.stepNumber}`}
                              </span>
                            </div>
                            <h3 className={`font-bold ${isSeniorFont ? 'text-base' : 'text-sm'} text-neutral-900 dark:text-white`}>
                              {step.stepNumber}. {step.title}
                            </h3>
                            <p className={`${smallClass} text-neutral-600 dark:text-neutral-400 leading-relaxed`}>
                              {step.description}
                            </p>
                          </div>

                          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                            👉 {step.actionExample}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slide 2: 그래픽 순서도 (Mermaid) */}
                {currentSlide === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                        3단계: 그래픽 순서도
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">3 / 5</span>
                    </div>

                    <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                      🔄 데이터가 흘러가는 길 (흐름도)
                    </h2>
                    <p className={`${smallClass} text-neutral-500 dark:text-neutral-400`}>
                      내가 쓴 글이 어디로 가고 어떻게 정리되는지 그림으로 확인해 보세요.
                    </p>

                    <MermaidDiagram chartCode={currentGuide.mermaidFlowchart} isSeniorMode={isSeniorFont} />
                  </div>
                )}

                {/* Slide 3: 캘린더와 함께 보는 법 */}
                {currentSlide === 3 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-neutral-900 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                        4단계: 달력 연동
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">4 / 5</span>
                    </div>

                    <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                      📅 {currentGuide.calendarGuide.title}
                    </h2>
                    <p className={`${bodyClass} text-neutral-600 dark:text-neutral-300`}>
                      {currentGuide.calendarGuide.description}
                    </p>

                    <div className="space-y-2 pt-2">
                      {currentGuide.calendarGuide.steps.map((st, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-3 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-neutral-700/80"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`${smallClass} font-medium text-neutral-800 dark:text-neutral-200`}>
                            {st}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
                      💡 꿀팁: {currentGuide.calendarGuide.proTip}
                    </div>
                  </div>
                )}

                {/* Slide 4: 자주 묻는 질문 FAQ */}
                {currentSlide === 4 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50/60 via-white to-pink-50/40 dark:from-rose-950/20 dark:via-neutral-900 dark:to-pink-950/10 border border-rose-200/80 dark:border-rose-900/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
                        5단계: 자주 묻는 질문
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">5 / 5</span>
                    </div>

                    <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                      ❓ 실수했을 땐 당황하지 마세요!
                    </h2>

                    <div className="space-y-3 pt-2">
                      {currentGuide.faqs.map((faq, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-neutral-700 space-y-2 shadow-xs"
                        >
                          <div className="font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs">
                              질문 {idx + 1}
                            </span>
                            <span className={bodyClass}>{faq.question}</span>
                          </div>
                          <p className={`${smallClass} text-neutral-600 dark:text-neutral-300 leading-relaxed pl-1`}>
                            👉 {faq.answer}
                          </p>
                          {faq.tip && (
                            <span className="inline-block text-[11px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                              {faq.tip}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold text-center">
                      {currentGuide.cheerMessage}
                    </div>
                  </div>
                )}

                {/* Slider Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevSlide}
                    disabled={currentSlide === 0}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>이전</span>
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex items-center space-x-1.5">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2 rounded-full transition-all ${
                          currentSlide === i
                            ? 'w-6 bg-neutral-900 dark:bg-white'
                            : 'w-2 bg-neutral-300 dark:bg-neutral-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextSlide}
                    disabled={currentSlide === totalSlides - 1}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold disabled:opacity-30 transition"
                  >
                    <span>다음</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              /* VIEW 2: FULL DOCUMENT SCROLL VIEW */
              <div className="space-y-6">
                <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <h2 className={`${titleClass} text-neutral-900 dark:text-white`}>
                    {currentGuide.headline}
                  </h2>
                  <p className={`${bodyClass} text-neutral-500 dark:text-neutral-400`}>
                    템플릿: {currentGuide.templateTitle}
                  </p>
                </div>

                {/* 1. 3줄 요약 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    📌 이 템플릿으로 할 수 있는 일
                  </h3>
                  <div className="space-y-1.5">
                    {currentGuide.summary.map((s, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className={bodyClass}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. 첫날 3가지 */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    🚀 첫날 딱 3가지만 따라 하기
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentGuide.firstDaySteps.map((step) => (
                      <div key={step.stepNumber} className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-1.5">
                        <div className="font-bold text-xs flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <span>{step.icon}</span>
                          <span>{step.stepNumber}단계: {step.title}</span>
                        </div>
                        <p className={`${smallClass} text-neutral-600 dark:text-neutral-400`}>
                          {step.description}
                        </p>
                        <div className="text-[11px] font-semibold text-neutral-500">
                          👉 {step.actionExample}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. 순서도 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    🔄 데이터 흐름 순서도
                  </h3>
                  <MermaidDiagram chartCode={currentGuide.mermaidFlowchart} isSeniorMode={isSeniorFont} />
                </div>

                {/* 4. 달력 */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    📅 {currentGuide.calendarGuide.title}
                  </h3>
                  <p className={bodyClass}>{currentGuide.calendarGuide.description}</p>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                    {currentGuide.calendarGuide.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                    💡 {currentGuide.calendarGuide.proTip}
                  </p>
                </div>

                {/* 5. FAQ */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    ❓ 자주 묻는 질문
                  </h3>
                  <div className="space-y-2">
                    {currentGuide.faqs.map((faq, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                        <div className="font-bold mb-1">Q. {faq.question}</div>
                        <div className="text-neutral-600 dark:text-neutral-400">A. {faq.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cheer */}
                <div className="p-3 text-center text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                  {currentGuide.cheerMessage}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-notion-dark-border text-xs">
            <div className="flex items-center space-x-1.5 text-neutral-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gemini 비주얼 가이드 엔진</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium"
              >
                닫기
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
