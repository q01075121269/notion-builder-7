import React, { useState } from 'react';
import { Tag, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

interface SmartDocsRendererProps {
  title?: string;
  formMode?: 'free' | 'template';
  onSelectCitation?: (id: number) => void;
}

export const SmartDocsRenderer: React.FC<SmartDocsRendererProps> = ({
  title = '2026년 하반기 전략 AI 비즈니스 기획서',
  formMode = 'free',
  onSelectCitation
}) => {
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);

  const handleCitationClick = (id: number) => {
    setSelectedCitation(selectedCitation === id ? null : id);
    if (onSelectCitation) {
      onSelectCitation(id);
    }
  };

  const citations = [
    { id: 1, source: 'NotebookLM 2026_Q3_사업계획서_최종.pdf (p.14)', text: 'AI 오피스 스튜디오 도입 시 전사 업무 처리 속도 평균 320% 향상 검증 데이터' },
    { id: 2, source: '시상식_예산_품의서_양식.docx (p.3)', text: '표준 결재 서식 자동 매핑을 통한 결재 기안 오류 0% 달성' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md rounded-3xl p-6 sm:p-10 space-y-8 select-text">
      
      {/* 1. 메타 헤더 (문서 제목, 작성일, 메타 태그) */}
      <div className="border-b border-slate-200 dark:border-neutral-800 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            📄 AI 스마트 독스 (Napkin AI 규격)
          </span>
          <span className="text-xs text-slate-400 font-medium">작성일: 2026. 09. 19 | 최종 수정: 방금 전</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {['#전략보고서', '#AI오피스', '#2026가이드', '#자동화캔버스'].map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
              {tag}
            </span>
          ))}
        </div>

        {formMode === 'template' && (
          <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div><span className="text-purple-400">기안자:</span> <strong className="text-purple-900 dark:text-purple-200">김노션 팀장</strong></div>
            <div><span className="text-purple-400">기안부서:</span> <strong className="text-purple-900 dark:text-purple-200">AI 전략기획팀</strong></div>
            <div><span className="text-purple-400">결재상태:</span> <strong className="text-emerald-600 dark:text-emerald-400">승인 완료 ✅</strong></div>
            <div><span className="text-purple-400">문서번호:</span> <strong className="text-purple-900 dark:text-purple-200">DOC-2026-0919</strong></div>
          </div>
        )}
      </div>

      {/* 목차 (Table of Contents) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 space-y-2 text-xs">
        <h3 className="font-extrabold text-slate-800 dark:text-neutral-200 flex items-center space-x-1.5">
          <span className="text-blue-500">📑</span>
          <span>목차 (Table of Contents)</span>
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-neutral-400 font-medium pt-1">
          <li className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>1. 핵심 추진 배경 및 도입 효과</span>
          </li>
          <li className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>2. 레거시 vs AI 오피스 비교</span>
          </li>
          <li className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>3. 3단계 자동화 프로세스 흐름도</span>
          </li>
        </ul>
      </div>

      {/* 2. 본문 개조식 기호 & 팩트 인용 뱃지 ([1], [2]) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>1. 핵심 추진 배경 및 AI 오피스 도입 효과</span>
        </h2>
        
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
          <p className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold shrink-0">•</span>
            <span>
              기존의 파편화된 문서 작성 방식을 **Docs·Sheets·Slides 3대 통합 라이브 캔버스**로 전환하여 작성 시간을 80% 이상 단축합니다.
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
              NotebookLM RAG 인용 엔진과의 연동을 통해 원문 출처 데이터에 근거한 100% 팩트 기반 공문서 및 품의서를 즉시 수립합니다.
              <button
                onClick={() => handleCitationClick(2)}
                className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold cursor-pointer hover:underline"
              >
                [2]
              </button>
            </span>
          </p>
        </div>

        {/* 팩트 인용 툴팁 패널 */}
        {selectedCitation && (
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-300">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>[인용 출처 {selectedCitation}] 레퍼런스 검증 팩트</span>
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

      {/* 3. 시각적 3단 비교표 (Napkin AI 벤치마크) */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>2. 기존 업무 체제 vs AI 오피스 스튜디오 비교</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-400">구분</span>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">문서 작성 속도</h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400">평균 120분 소요 (수동 서식 및 수식 작성)</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">기존 레거시</span>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">비효율 파편화</h4>
            <p className="text-xs text-rose-600 dark:text-rose-400">수식 계산 오류 및 템플릿 서식 작성 누락 다수</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 ring-2 ring-emerald-500/20">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">AI 오피스 체제</span>
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">실시간 자동 결재</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">평균 3분 내 완결 & 수식 실시간 검증</p>
          </div>
        </div>
      </section>

      {/* 4. 프로세스 화살표 다이어그램 카드 블록 */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>3. 3단계 자동화 프로세스 흐름도</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 relative overflow-hidden">
            <div className="text-xs font-black text-blue-600 dark:text-blue-400">Step 1</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">자연어 메모 & 소스 수집</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">NotebookLM 문서 및 옴니 챗 메모 수집</p>
            <ArrowRight className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 z-10" />
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2 relative overflow-hidden">
            <div className="text-xs font-black text-purple-600 dark:text-purple-400">Step 2</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI 수식 & 서식 매핑</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">Docs/Sheets/Slides 3대 라이브 캔버스 생성</p>
            <ArrowRight className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 z-10" />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="text-xs font-black text-amber-600 dark:text-amber-400">Step 3</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">노션 워크스페이스 전송</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">DB 저장소에 내보내기 완결</p>
          </div>
        </div>
      </section>

    </div>
  );
};
