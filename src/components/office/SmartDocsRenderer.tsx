import React, { useState } from 'react';
import { 
  Tag, 
  ExternalLink, 
  Sparkles, 
  List, 
  AlertCircle, 
  Layers, 
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface SmartDocsRendererProps {
  title?: string;
  formMode?: 'free' | 'template';
  onSelectCitation?: (id: number) => void;
}

export const SmartDocsRenderer: React.FC<SmartDocsRendererProps> = ({
  formMode = 'free',
  onSelectCitation
}) => {
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const [isTocSidebarOpen, setIsTocSidebarOpen] = useState<boolean>(true);

  const handleCitationClick = (id: number) => {
    setSelectedCitation(selectedCitation === id ? null : id);
    if (onSelectCitation) {
      onSelectCitation(id);
    }
  };

  const citations = [
    { id: 1, source: 'NotebookLM 2026_Q4_신규사업계획서_최종.pdf (p.14)', text: 'AI 오피스 스튜디오 도입 시 전사 문서 수립 생산성 320% 향상 검증' },
    { id: 2, source: '표준_지출결의서_품의_지침.docx (p.3)', text: '표준 서식 자동 매핑을 통한 결재 상신 오류 0% 실시간 자동 계산 파이프라인' }
  ];

  // 듀얼 모드 타이틀 & 메타
  const docTitle = formMode === 'free' 
    ? '2026년 4분기 신규 사업 기획 및 예산안 보고서'
    : '2026년 4분기 프로젝트 지출결의서 및 기안 품의서';

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 justify-center items-start">
      
      {/* 1. TOC 사이드바 (토글식) */}
      {isTocSidebarOpen && (
        <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm rounded-xl p-4 shrink-0 animate-fadeIn space-y-3 sticky top-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 dark:text-neutral-200">
              <List className="w-4 h-4 text-blue-500" />
              <span>목차 (TOC)</span>
            </div>
            <button 
              onClick={() => setIsTocSidebarOpen(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              닫기 ✕
            </button>
          </div>

          <nav className="space-y-1 text-xs">
            <a href="#section-1" className="block px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition">
              1. 추진 배경 및 개요
            </a>
            <a href="#section-2" className="block px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition">
              2. 주요 실행 전략
            </a>
            <a href="#section-3" className="block px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition">
              3. Napkin AI 프로세스 다이어그램
            </a>
            <a href="#section-4" className="block px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition">
              4. 예산 수집 및 결재 체계
            </a>
          </nav>
        </aside>
      )}

      {/* 2. A4 비즈니스 리포트 컨테이너 (요구 규격: max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md rounded-md border border-slate-200) */}
      <div className="flex-1 max-w-4xl w-full mx-auto bg-white dark:bg-neutral-900 p-6 md:p-12 shadow-md rounded-md border border-slate-200 dark:border-neutral-800 space-y-8 select-text">
        
        {/* 사이드바 열기 버튼 (닫혔을 때 표시) */}
        {!isTocSidebarOpen && (
          <button
            onClick={() => setIsTocSidebarOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold transition mb-2"
          >
            <List className="w-3.5 h-3.5 text-blue-500" />
            <span>목차(TOC) 사이드바 열기</span>
          </button>
        )}

        {/* 메타 헤더 (문서 제목, 작성일, 메타 태그) */}
        <div className="border-b border-slate-200 dark:border-neutral-800 pb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              📄 스마트 독스 (A4 Business Report)
            </span>
            <span className="text-xs text-slate-400 font-medium">작성일: 2026. 09. 20 | 문서번호: DOC-2026-Q4</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {docTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {['#2026사업기획', '#A4보고서', '#AI오피스스튜디오', '#자동화캔버스'].map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                {tag}
              </span>
            ))}
          </div>

          {/* 표준 회사 양식 메타 결재 상자 */}
          {formMode === 'template' && (
            <div className="mt-4 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><span className="text-purple-400">기안자:</span> <strong className="text-purple-900 dark:text-purple-200">김노션 팀장</strong></div>
              <div><span className="text-purple-400">기안부서:</span> <strong className="text-purple-900 dark:text-purple-200">AI 전략기획팀</strong></div>
              <div><span className="text-purple-400">결재상태:</span> <strong className="text-emerald-600 dark:text-emerald-400">승인 완료 ✅</strong></div>
              <div><span className="text-purple-400">합계금액:</span> <strong className="text-purple-900 dark:text-purple-200">₩865,000</strong></div>
            </div>
          )}
        </div>

        {/* 1. 추진 배경 및 개요 */}
        <section id="section-1" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-l-4 border-blue-500 pl-3">
            <span>1. 추진 배경 및 개요</span>
          </h2>
          
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
            <p className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold shrink-0">•</span>
              <span>
                본 보고서는 2026년 4분기 핵심 목표인 **AI 오피스 스튜디오(Docs·Sheets·Slides)** 전면 구축에 따른 전사 디지털 전환 실행 방안을 다룹니다.
                <button
                  onClick={() => handleCitationClick(1)}
                  className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold cursor-pointer hover:underline"
                >
                  [1]
                </button>
              </span>
            </p>

            <p className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold shrink-0">•</span>
              <span>
                표준 결재 서식과 라이브 데이터 캔버스를 결합하여 기안 수식 계산 및 문서 작성 실시간 파이프라인을 완전 자동화합니다.
                <button
                  onClick={() => handleCitationClick(2)}
                  className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold cursor-pointer hover:underline"
                >
                  [2]
                </button>
              </span>
            </p>
          </div>

          {/* 팩트 인용 툴팁 팝오버 */}
          {selectedCitation && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs space-y-1 animate-fadeIn shadow-sm">
              <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-300">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>[각주 {selectedCitation}] NotebookLM Verified Reference</span>
                </span>
                <button onClick={() => setSelectedCitation(null)} className="text-[10px] opacity-70 hover:opacity-100">닫기 ✕</button>
              </div>
              <p className="text-purple-700 dark:text-purple-300 font-medium">
                {citations.find(c => c.id === selectedCitation)?.text}
              </p>
              <p className="text-[10px] text-purple-500 flex items-center space-x-1">
                <ExternalLink className="w-3 h-3" />
                <span>{citations.find(c => c.id === selectedCitation)?.source}</span>
              </p>
            </div>
          )}
        </section>

        {/* 마크다운 스타일 콜아웃 상자 (Callout Box) */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold">💡 핵심 포인트 (Executive Summary)</h4>
            <p className="leading-relaxed">
              Docs에서 작성된 기안 내용은 **Smart Sheets의 =SUM() 연산 그리드** 및 **Smart Slides의 16:9 감마 프레젠테이션 카드**로 손실 없이 100% 실시간 공유됩니다.
            </p>
          </div>
        </div>

        {/* 2. 주요 실행 전략 (3단 비교표) */}
        <section id="section-2" className="space-y-3 pt-2 scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-l-4 border-purple-500 pl-3">
            <span>2. 주요 실행 전략 및 핵심 지표</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300">Phase 1</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">스마트 독스 수립</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400">A4 비즈니스 개조식 기안 작성</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Phase 2</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">스마트 시트 수식 연산</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Rows 기반 =SUM() 검증</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Phase 3</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">스마트 슬라이드 쇼케이스</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400">16:9 발표 장표 자동 생성</p>
            </div>
          </div>
        </section>

        {/* 3. Napkin AI 스타일 SVG 다이어그램 프리뷰 카드 */}
        <section id="section-3" className="space-y-3 pt-2 scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-l-4 border-amber-500 pl-3">
            <span>3. Napkin AI 스타일 SVG 다이어그램 프리뷰</span>
          </h2>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold tracking-wide text-amber-300">Napkin AI Diagram Engine</span>
              </div>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">SVG Interactive Render</span>
            </div>

            {/* SVG 파이프라인 흐름 시각화 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-2 text-center">
                <FileText className="w-6 h-6 text-blue-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Docs (보고서)</h4>
                <p className="text-[10px] text-slate-300">개조식 불렛 & 팩트 RAG</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-2 text-center">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Sheets (수식 연산)</h4>
                <p className="text-[10px] text-slate-300">=SUM() 실시간 수식</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-2 text-center">
                <Layers className="w-6 h-6 text-purple-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Slides (장표)</h4>
                <p className="text-[10px] text-slate-300">16:9 Gamma 덱 렌더링</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
