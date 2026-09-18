import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  BarChart2, 
  Layers
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

  // 5대 슬라이드 데이터
  const slides: SlideData[] = [
    {
      id: 1,
      title: '01. AI 오피스 스튜디오 혁신 비전',
      subtitle: 'Gamma 벤치마크 기반의 16:9 감성 카드 프레젠테이션',
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

  const currentSlide = slides[currentIdx];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 select-none">
      
      {/* 1. 슬라이드 덱 네비게이션 컨트롤 상단 바 */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-4 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            📑 AI 스마트 슬라이드 (Gamma 벤치마크)
          </span>
          {formMode === 'template' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              공식 발표 장표 덱
            </span>
          )}
        </div>

        {/* [1 / 5 장표] 페이지네이션 버튼 */}
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
        </div>
      </div>

      {/* 2. 16:9 반응형 가로 카드 메인 프레젠테이션 쇼케이스 */}
      <div className="aspect-video w-full bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-slate-100 dark:to-neutral-900 border-2 border-amber-400/50 dark:border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden">
        
        {/* 장표 헤더 & 제목 */}
        <div className="space-y-1.5 z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              SLIDE {currentSlide.id}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">16:9 Wide Presentation</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 z-10">
          
          {/* 3분할 본문 블록 (3칸) */}
          <div className="md:col-span-3 grid grid-cols-3 gap-2 sm:gap-3">
            {currentSlide.threeBlocks.map((block) => (
              <div key={block.num} className="p-3.5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-700 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] flex items-center justify-center">
                  {block.num}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{block.head}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight mt-0.5 line-clamp-2">{block.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 추천 Visual 도해 영역 (1칸) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center text-center space-y-1.5 shadow-md">
            {currentSlide.visualType === 'pie' ? (
              <PieChart className="w-6 h-6 text-amber-300 animate-pulse" />
            ) : currentSlide.visualType === 'bar' ? (
              <BarChart2 className="w-6 h-6 text-emerald-300 animate-pulse" />
            ) : (
              <Layers className="w-6 h-6 text-blue-300 animate-pulse" />
            )}
            <span className="text-[10px] font-extrabold tracking-wider">추천 도해 시각화</span>
            <span className="text-[9px] text-purple-100">Visual Diagram</span>
          </div>

        </div>

      </div>

      {/* 3. 장표 하단 접이식 [🎙️ 발표자 발표 스크립트(Presenter Notes)] 서랍 */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setIsNoteOpen(!isNoteOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold text-amber-400">
              🎙️ 발표자 스크립트 (Presenter Notes)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-[11px] font-mono">Slide {currentSlide.id} 전용 아나운서 노하우</span>
            {isNoteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isNoteOpen && (
          <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 animate-fadeIn space-y-1">
            <p className="italic text-slate-200 font-medium">
              "{currentSlide.presenterNote}"
            </p>
            <p className="text-[10px] text-amber-400/80">
              💡 팁: 해당 멘트를 음성(STT) 발표 시 자연스러운 스피치 톤으로 전달하면 효과적입니다.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
