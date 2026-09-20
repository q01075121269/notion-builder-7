import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  BarChart2, 
  Layers,
  X,
  Play,
  Monitor
} from 'lucide-react';

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  keyMessage: string;
  threeBlocks: Array<{ num: string; head: string; desc: string }>;
  visualType: 'pie' | 'bar' | 'process';
  presenterNote: string;
}

interface SmartSlidesRendererProps {
  formMode?: 'free' | 'template';
}

export const SmartSlidesRenderer: React.FC<SmartSlidesRendererProps> = ({
  formMode = 'free'
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [isFullscreenShow, setIsFullscreenShow] = useState(false);

  // 샘플 데이터 1 (자유 기획 모드 - AI 오피스 마스터 빌더 핵심 피치덱 5 Pages)
  const freeSlides: SlideData[] = [
    {
      id: 1,
      title: '01. AI 오피스 스튜디오 혁신 비전',
      subtitle: 'Gamma 벤치마크 기반의 16:9 감성 카드 프레젠테이션 피치덱',
      keyMessage: '💡 Docs · Sheets · Slides가 원스톱으로 연결되는 차세대 멀티 캔버스 생태계 구축',
      threeBlocks: [
        { num: '01', head: 'Docs 냅킨 AI', desc: '개조식 보고서 & 팩트 인용 마크업 지원' },
        { num: '02', head: 'Sheets 로우즈', desc: '=SUM() 및 =AVERAGE() 실시간 수식 연산' },
        { num: '03', head: 'Slides 감마', desc: '16:9 비주얼 도해 및 발표자 스크립트 동기화' }
      ],
      visualType: 'pie',
      presenterNote: '청중의 관심을 유도하며 3대 오피스 모듈의 융합 시너지를 핵심 키워드로 발표를 시작하세요.'
    },
    {
      id: 2,
      title: '02. 표준 결재 양식 자동화 파이프라인',
      subtitle: '지출결의서 및 품의서 원클릭 생성 프로세스',
      keyMessage: '⚡ 기안자·부서·합계 금액 수식이 사전 매핑된 결재용 공문서 규격 지원',
      threeBlocks: [
        { num: '01', head: '자유 기획 모드', desc: 'AI 아이디어 브레인스토밍 및 자유 서식 작성' },
        { num: '02', head: '표준 회사 양식', desc: '결재란 및 총 금액 자동 수식 탑재 서식' },
        { num: '03', head: '노션 즉시 내보내기', desc: '클릭 한 번으로 노션 DB에 최종 승인 건 반영' }
      ],
      visualType: 'process',
      presenterNote: '기업 사용자의 결재 오류율 0% 달성 및 평균 기안 작성 시간 단축 지표를 강조하세요.'
    },
    {
      id: 3,
      title: '03. NotebookLM RAG 팩트 인용 기반 구축',
      subtitle: '환각(Hallucination) 없는 100% 검증 근거 제시',
      keyMessage: '📚 참고 PDF 및 웹 링크 문맥을 실시간 추출하여 본문 인용 뱃지로 렌더링',
      threeBlocks: [
        { num: '01', head: 'PDF 소스 업로드', desc: '사내 사업계획서 및 규정 집합 벡터화' },
        { num: '02', head: '인용 뱃지 [1], [2]', desc: '문장 단위 원문 출처 자동 툴팁 매핑' },
        { num: '03', head: '신뢰도 보장', desc: '허위 사실 배제 및 사실에 기반한 보고서 생성' }
      ],
      visualType: 'bar',
      presenterNote: 'NotebookLM RAG 인용 뱃지 기능이 임원 보고 시 신뢰성을 보장함을 언급하세요.'
    },
    {
      id: 4,
      title: '04. 크로스 챕터 데이터 원클릭 브릿지',
      subtitle: '1·2·4챕터와의 유기적인 데이터 교환',
      keyMessage: '🔄 노션 커버 반영, 라이프 캘린더 마감 등록, 미디어 랩 에셋 장표 삽입 연동',
      threeBlocks: [
        { num: '01', head: '제1챕터 노션 커버', desc: '대표 표지 비주얼 이미지로 자동 세팅' },
        { num: '02', head: '제2챕터 일정 등록', desc: '업로드 마감일을 라이프 캘린더에 적재' },
        { num: '03', head: '제4챕터 미디어 삽입', desc: 'AI가 생성한 모션 영상 및 BGM 믹서 결합' }
      ],
      visualType: 'process',
      presenterNote: '단순 오피스 툴을 넘어 4대 챕터 전체가 연결되는 통합 생산성 허브임을 알리세요.'
    },
    {
      id: 5,
      title: '05. 결론 및 향후 기대 효과',
      subtitle: '전사 생산성 300% 향상 및 스마트 워크 완결',
      keyMessage: '🚀 Notion Architect v2.0 AI 오피스 스튜디오로 완성되는 업무 디지털 전환',
      threeBlocks: [
        { num: '01', head: '작성 시간 절감', desc: '기존 120분 -> 3분 미만으로 획기적 단축' },
        { num: '02', head: '수식 자동화', desc: '=SUM() 등의 수식 오류 제로화' },
        { num: '03', head: '글로벌 내보내기', desc: 'CSV, PDF, 클립보드 원클릭 내보내기' }
      ],
      visualType: 'pie',
      presenterNote: '마무리 멘트: 1초 퀵 캡처부터 오피스 슬라이드까지 하나의 흐름으로 완성됨을 전달하며 마칩니다.'
    }
  ];

  // 샘플 데이터 2 (표준 회사 양식 모드)
  const templateSlides: SlideData[] = [
    {
      id: 1,
      title: '01. 2026년 4분기 지출결의서 및 프로젝트 기안',
      subtitle: '표준 부서 결재 안건 최종 의결 장표',
      keyMessage: '📋 총 집행 예정 금액 ₩865,000 사전 수식 검증 완료 건',
      threeBlocks: [
        { num: '01', head: '기안 부서', desc: 'AI 전략기획팀 (팀장 김노션)' },
        { num: '02', head: '결재 상태', desc: '최종 승인 완료 (DOC-2026-Q4)' },
        { num: '03', head: '집행 일자', desc: '2026년 10월 01일 예정' }
      ],
      visualType: 'process',
      presenterNote: '사전 승인된 예산 항목에 맞춰 지출이집행됨을 결재권자에게 설명하십시오.'
    },
    {
      id: 2,
      title: '02. 세부 지출 항목 및 =SUM() 수식 명세',
      subtitle: 'API 라이선스 및 미디어 호스팅 비용 집계',
      keyMessage: '📊 스마트 시트 자동 연동으로 1원 단위 오차 없는 정확도 보장',
      threeBlocks: [
        { num: '01', head: 'API 라이선스', desc: 'Gemini 3.6 Flash (10건) - ₩1,500,000' },
        { num: '02', head: '노션 팀 구독', desc: '연간 계정 할인 - ₩225,000' },
        { num: '03', head: 'GPU 호스팅', desc: '미디어 렌더링 서버 - ₩640,000' }
      ],
      visualType: 'bar',
      presenterNote: '항목별 투입 비용과 시트 자동 연산 결과를 시각적으로 안내하십시오.'
    },
    {
      id: 3,
      title: '03. 사업 집행 기대 성과 및 ROI 분석',
      subtitle: '투자 대비 업무 생산성 및 결재 효율성',
      keyMessage: '💡 공문서 자동화로 부서 간 업무 협의 속도 400% 대폭 증가',
      threeBlocks: [
        { num: '01', head: '결재 처리 시간', desc: '평균 24시간 -> 5분 이내 완결' },
        { num: '02', head: '문서 누락률', desc: '기존 12% -> 0%로 오차 방지' },
        { num: '03', head: '데이터 보존', desc: '노션 워크스페이스 DB 실시간 보관' }
      ],
      visualType: 'pie',
      presenterNote: '도입 시 기대되는 정량적 효율 수치를 임원진에게 공유하십시오.'
    }
  ];

  const slides = formMode === 'template' ? templateSlides : freeSlides;
  const currentSlide = slides[Math.min(currentIdx, slides.length - 1)] || slides[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 select-none">
      
      {/* 1. 슬라이드 덱 네비게이션 컨트롤 상단 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            📑 AI 스마트 슬라이드 (Gamma Style Deck)
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {formMode === 'template' ? '표준 결재 장표 덱' : '핵심 피치덱 (5 Pages)'}
          </span>
        </div>

        {/* 컨트롤 버튼 묶음: 이전/다음 & 슬라이드쇼 버튼 */}
        <div className="flex items-center space-x-3">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black text-slate-800 dark:text-neutral-200">
            {currentIdx + 1} / {slides.length} 장표
          </span>

          <button
            disabled={currentIdx === slides.length - 1}
            onClick={() => setCurrentIdx((prev) => Math.min(slides.length - 1, prev + 1))}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* [전체 화면 슬라이드 쇼 모드] */}
          <button
            onClick={() => setIsFullscreenShow(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>슬라이드 쇼</span>
          </button>
        </div>
      </div>

      {/* 2. 좌측 썸네일 피드 + 우측 메인 16:9 장표 카드의 Split 뷰 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        
        {/* 좌측: 16:9 썸네일 슬라이드 리스트 피드 */}
        <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-neutral-400 px-1 uppercase tracking-wider">
            Slide List ({slides.length})
          </h3>
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between aspect-video space-y-1 ${
                currentIdx === idx
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                  : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>SLIDE 0{s.id}</span>
                {currentIdx === idx && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {s.title}
              </h4>
              <p className="text-[10px] text-slate-500 line-clamp-1">
                {s.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* 우측 메인: 선택된 슬라이드 16:9 고해상도 장표 카드 */}
        <div className="md:col-span-3 space-y-4">
          <div className="aspect-video w-full bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-slate-100 dark:to-neutral-900 border-2 border-amber-400/50 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
            
            {/* 장표 헤더 & 제목 */}
            <div className="space-y-1.5 z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  SLIDE {currentSlide.id}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">16:9 High-Res Gamma Card</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-medium">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* 핵심 한 줄 메시지 바 */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-800/90 border border-amber-200 dark:border-amber-900/60 shadow-xs z-10">
              <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
                {currentSlide.keyMessage}
              </p>
            </div>

            {/* 3분할 본문 카드 블록 + 추천 Visual 도해 영역 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 z-10">
              <div className="sm:col-span-3 grid grid-cols-3 gap-2">
                {currentSlide.threeBlocks.map((block) => (
                  <div key={block.num} className="p-3 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-700 space-y-1">
                    <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] flex items-center justify-center">
                      {block.num}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{block.head}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight line-clamp-2">{block.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center text-center space-y-1 shadow-md">
                {currentSlide.visualType === 'pie' ? (
                  <PieChart className="w-5 h-5 text-amber-300 animate-pulse" />
                ) : currentSlide.visualType === 'bar' ? (
                  <BarChart2 className="w-5 h-5 text-emerald-300 animate-pulse" />
                ) : (
                  <Layers className="w-5 h-5 text-blue-300 animate-pulse" />
                )}
                <span className="text-[10px] font-black">Visual Diagram</span>
              </div>
            </div>

          </div>

          {/* 발표자 노트 (Speaker Notes) 접이식 영역 */}
          <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <button
              onClick={() => setIsNoteOpen(!isNoteOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition cursor-pointer text-left"
            >
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold text-amber-400">
                  🎙️ 발표자 노트 (Speaker Notes)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <span className="text-[10px] font-mono">Slide {currentSlide.id} 전용 스크립트</span>
                {isNoteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isNoteOpen && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 animate-fadeIn space-y-1">
                <p className="italic text-slate-200 font-medium">
                  "{currentSlide.presenterNote}"
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. 전체 화면 슬라이드 쇼 모달 팝업 */}
      {isFullscreenShow && (
        <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between p-6 md:p-12 animate-fadeIn">
          {/* 상단 툴바 */}
          <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Full-Screen Presentation Show</span>
            </div>
            <button
              onClick={() => setIsFullscreenShow(false)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>닫기 (Esc)</span>
            </button>
          </div>

          {/* 중앙 슬라이드 뷰 */}
          <div className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto w-full space-y-6">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
              SLIDE {currentSlide.id} / {slides.length}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white text-center">
              {currentSlide.title}
            </h1>
            <p className="text-lg text-slate-300 text-center font-medium">
              {currentSlide.subtitle}
            </p>

            <div className="w-full p-6 rounded-2xl bg-white/10 border border-white/20 text-amber-200 text-center text-lg font-bold">
              {currentSlide.keyMessage}
            </div>
          </div>

          {/* 하단 탐색 */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold transition"
            >
              ◀ 이전 슬라이드
            </button>
            <span className="text-xs text-slate-400 font-mono">
              {currentIdx + 1} of {slides.length}
            </span>
            <button
              disabled={currentIdx === slides.length - 1}
              onClick={() => setCurrentIdx((prev) => Math.min(slides.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold transition"
            >
              다음 슬라이드 ▶
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
