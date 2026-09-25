import React, { useState, useEffect } from 'react';
import type { OfficeDocument, DocSection, OfficeCitation } from '../../../types/office';
import { Plus, Trash2, Info, Sparkles, Building2 } from 'lucide-react';
import { FactCitationPopover } from '../FactCitationPopover';

interface GovDocsCanvasProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onSelectCitation?: (citation: OfficeCitation) => void;
}

export const GovDocsCanvas: React.FC<GovDocsCanvasProps> = ({
  document,
  onChangeDocument,
  onSelectCitation
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [popoverCitation, setPopoverCitation] = useState<OfficeCitation | null>(null);
  const [approverStatus, setApproverStatus] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: false }); // [기안, 팀장, 본부장, 대표이사]
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // 코파일럿 인플레이스 변이 시 해당 캔버스 영역 1.5초간 하이라이트 애니메이션
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ target: string }>;
      const target = customEvent.detail?.target;
      if (target) {
        setHighlightedField(target);
        const timer = setTimeout(() => {
          setHighlightedField(null);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('anti-office-highlight', handler);
    return () => window.removeEventListener('anti-office-highlight', handler);
  }, []);

  const toggleApproval = (index: number) => {
    setApproverStatus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleMetadataChange = (key: 'docNumber' | 'department' | 'author' | 'date', value: string) => {
    onChangeDocument({
      ...document,
      metadata: {
        ...document.metadata,
        [key]: value
      }
    }, `문서 ${key} 수정`);
  };

  const handleApproverRoleChange = (idx: number, newRole: string) => {
    const newApprovers = [...(document.metadata.approvers || ['기획(기안)', '박팀장(검토)', '이본부장(결재)'])];
    newApprovers[idx] = newRole;
    onChangeDocument({
      ...document,
      metadata: {
        ...document.metadata,
        approvers: newApprovers
      }
    }, `결재선 직급 수정`);
  };

  const handleSectionTextChange = (id: string, newText: string) => {
    const updatedSections = document.content.docsContent.sections.map(sec => 
      sec.id === id ? { ...sec, text: newText } : sec
    );
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        docsContent: { sections: updatedSections }
      }
    }, '본문 내용 직접 편집');
  };

  const handleAddSection = (afterIndex: number, level: 1 | 2 | 3 | 4) => {
    const markers: Record<1 | 2 | 3 | 4, string> = {
      1: `${document.content.docsContent.sections.filter(s => s.level === 1).length + 1}.`,
      2: '□',
      3: '○',
      4: '―'
    };
    const newSection: DocSection = {
      id: `sec-${Date.now()}`,
      level,
      marker: markers[level],
      text: '신규 기안 항목 내용을 입력하세요.'
    };
    const updatedSections = [...document.content.docsContent.sections];
    updatedSections.splice(afterIndex + 1, 0, newSection);

    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        docsContent: { sections: updatedSections }
      }
    }, '공문서 항목 추가');
  };

  const handleDeleteSection = (id: string) => {
    if (document.content.docsContent.sections.length <= 1) return;
    const updatedSections = document.content.docsContent.sections.filter(s => s.id !== id);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        docsContent: { sections: updatedSections }
      }
    }, '공문서 항목 삭제');
  };

  // 출처 렌더링 헬퍼: [출처: X] 패턴을 뱃지로 치환
  const renderTextWithCitations = (section: DocSection) => {
    const parts = section.text.split(/(\[출처:\s*\d+\])/g);
    return (
      <div className="flex-1 flex flex-wrap items-center gap-1.5 group">
        <textarea
          value={section.text}
          onChange={(e) => handleSectionTextChange(section.id, e.target.value)}
          rows={Math.max(1, Math.ceil(section.text.length / 50))}
          className="w-full text-slate-800 dark:text-zinc-100 bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/40 focus:bg-white dark:focus:bg-zinc-800 p-1.5 rounded-lg border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition resize-none text-xs sm:text-sm leading-relaxed"
        />
        {/* 인용 뱃지 바로가기 목록 */}
        {parts.map((part, pIdx) => {
          const match = part.match(/\[출처:\s*(\d+)\]/);
          if (match) {
            const citNum = match[1];
            const citation = document.content.citations.find(c => c.id.endsWith(citNum) || c.id.includes(citNum)) || document.content.citations[0];
            return (
              <div key={pIdx} className="relative inline-block my-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (citation) {
                      setPopoverCitation(citation);
                      if (onSelectCitation) onSelectCitation(citation);
                    }
                  }}
                  onMouseEnter={() => setActiveTooltip(`cit-${section.id}-${pIdx}`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                  title="원천 출처 확인 및 팩트 팝오버 열기"
                >
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>출처: {citNum}</span>
                </button>

                {/* 각주 호버 툴팁 */}
                {activeTooltip === `cit-${section.id}-${pIdx}` && citation && (
                  <div className="absolute left-0 bottom-full mb-1 z-30 w-72 p-2.5 bg-zinc-900 text-white rounded-xl shadow-xl text-[11px] border border-zinc-700 pointer-events-none animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-700 font-bold text-indigo-300">
                      <span className="truncate">{citation.sourceTitle}</span>
                      <span className="text-[9px] text-zinc-400">{citation.pageOrLine}</span>
                    </div>
                    <p className="text-zinc-200 leading-snug line-clamp-3">
                      "{citation.textQuote}"
                    </p>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center py-4 px-2 sm:px-6">
      {/* A4 표준 공문서 카드 컨테이너 */}
      <div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-12 relative transition-all">
        
        {/* 상단 공문서 워터마크 & 헤더 (다중 행 줄바꿈 완전 개방) */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-zinc-100 pb-4 mb-6 gap-4">
          <div className="flex items-start space-x-2.5 flex-1 min-w-0 pr-4">
            <Building2 className="w-6 h-6 text-slate-800 dark:text-zinc-200 shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase block mb-1">
                Enterprise Official Document
              </span>
              <textarea
                value={document.title}
                onChange={(e) => onChangeDocument({ ...document, title: e.target.value }, '문서 제목 변경')}
                placeholder="문서 제목을 입력하세요 (두 줄 이상 자유 줄바꿈 지원)"
                title="클릭하여 문서 제목 직접 수정 (Enter로 줄바꿈 가능)"
                rows={Math.max(1, (document.title || '').split('\n').length)}
                className={`w-full text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight bg-transparent hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 focus:bg-white dark:focus:bg-zinc-850 px-1.5 py-1 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 outline-none transition resize-none whitespace-pre-wrap break-keep leading-tight ${
                  highlightedField === 'title' ? 'ring-2 ring-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50' : ''
                }`}
              />
            </div>
          </div>

          {/* 3단 전자 결재선 (기안 - 검토 - 결재) */}
          <div className="flex items-center border border-slate-300 dark:border-zinc-700 rounded-lg overflow-hidden text-center text-xs shrink-0 shadow-xs">
            <div className="bg-slate-100 dark:bg-zinc-800 px-2 py-6 font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center border-r border-slate-300 dark:border-zinc-700 w-8 text-[11px] leading-tight">
              결<br/>재
            </div>

            {document.metadata.approvers.map((role, idx) => (
              <div 
                key={idx} 
                onClick={() => toggleApproval(idx)}
                className="w-18 sm:w-20 border-r last:border-r-0 border-slate-300 dark:border-zinc-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition relative"
                title="하단 서명란 클릭 시 서명/승인 토글, 상단 텍스트 클릭 시 직급 수정"
              >
                <div 
                  className="bg-slate-50 dark:bg-zinc-800/80 p-0.5 border-b border-slate-300 dark:border-zinc-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleApproverRoleChange(idx, e.target.value)}
                    className="w-full text-center bg-transparent hover:bg-white dark:hover:bg-zinc-700/60 focus:bg-white dark:focus:bg-zinc-800 text-[10px] font-semibold text-slate-700 dark:text-zinc-300 border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none rounded py-0.5 transition"
                    title="클릭하여 직급/성함 직접 수정"
                  />
                </div>
                <div className="h-12 flex flex-col items-center justify-center p-1">
                  {approverStatus[idx] ? (
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-[10px] font-bold rotate-[-12deg] shadow-xs">
                        승인
                      </div>
                      <span className="text-[8px] text-red-600 dark:text-red-400 mt-0.5">서명완료</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">결재대기</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 문서 메타데이터 표 (인라인 직접 타이핑 편집 지원) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 px-4 bg-slate-50 dark:bg-zinc-850/70 rounded-xl border border-slate-200 dark:border-zinc-750 text-xs mb-8">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium mb-0.5">문서 번호</span>
            <input
              type="text"
              value={document.metadata.docNumber}
              onChange={(e) => handleMetadataChange('docNumber', e.target.value)}
              placeholder="문서 번호"
              className={`w-full font-bold text-slate-800 dark:text-zinc-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition text-xs ${
                highlightedField === 'metadata-docNumber' || highlightedField === 'metadata' ? 'ring-2 ring-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50' : ''
              }`}
              title="클릭하여 문서 번호 직접 수정"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium mb-0.5">기안 부서</span>
            <input
              type="text"
              value={document.metadata.department}
              onChange={(e) => handleMetadataChange('department', e.target.value)}
              placeholder="기안 부서"
              className={`w-full font-bold text-slate-800 dark:text-zinc-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition text-xs ${
                highlightedField === 'metadata-department' || highlightedField === 'metadata' ? 'ring-2 ring-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50' : ''
              }`}
              title="클릭하여 기안 부서 직접 수정"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium mb-0.5">기안자</span>
            <input
              type="text"
              value={document.metadata.author}
              onChange={(e) => handleMetadataChange('author', e.target.value)}
              placeholder="기안자 성명"
              className={`w-full font-bold text-slate-800 dark:text-zinc-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition text-xs ${
                highlightedField === 'metadata-author' || highlightedField === 'metadata' ? 'ring-2 ring-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50' : ''
              }`}
              title="클릭하여 기안자 직접 수정"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium mb-0.5">시행 일자</span>
            <input
              type="text"
              value={document.metadata.date}
              onChange={(e) => handleMetadataChange('date', e.target.value)}
              placeholder="시행 일자"
              className={`w-full font-bold text-slate-800 dark:text-zinc-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition text-xs ${
                highlightedField === 'metadata-date' || highlightedField === 'metadata' ? 'ring-2 ring-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50' : ''
              }`}
              title="클릭하여 시행 일자 직접 수정"
            />
          </div>
        </div>

        {/* 본문 섹션: 개조식 WYSIWYG 계층 렌더링 */}
        <div className={`space-y-3 rounded-xl p-2 transition-all duration-300 ${
          highlightedField === 'sections' ? 'ring-2 ring-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30' : ''
        }`}>
          {document.content.docsContent.sections.map((section, index) => {
            const indentClass = {
              1: 'pl-0 font-extrabold text-slate-950 dark:text-white mt-4 border-b border-slate-100 dark:border-zinc-800 pb-1',
              2: 'pl-4 font-bold text-slate-900 dark:text-zinc-100 mt-2',
              3: 'pl-8 font-medium text-slate-800 dark:text-zinc-200',
              4: 'pl-12 font-normal text-slate-700 dark:text-zinc-300'
            }[section.level];

            return (
              <div 
                key={section.id} 
                className={`flex items-start gap-2 group/row transition-colors rounded-lg p-1 hover:bg-slate-50/80 dark:hover:bg-zinc-850/50 ${indentClass}`}
              >
                {/* 개조식 마커 (1., □, ○, ―) */}
                <span className="w-5 shrink-0 text-center font-bold text-indigo-600 dark:text-indigo-400 select-none pt-1 text-sm">
                  {section.marker}
                </span>

                {/* 텍스트 및 각주 인라인 렌더러 */}
                {renderTextWithCitations(section)}

                {/* 항목 조작 버튼 (호버 시 표시) */}
                <div className="opacity-0 group-hover/row:opacity-100 transition flex items-center space-x-1 shrink-0 pt-1">
                  <button
                    onClick={() => handleAddSection(index, (section.level < 4 ? (section.level + 1) as any : 4))}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition"
                    title="하위 항목 추가"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition"
                    title="항목 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 공문서 꼬리말 및 끝 표기 */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <div className="flex items-center space-x-1">
            <Info className="w-3.5 h-3.5" />
            <span>본 문서는 사내 공문서 표준 규격에 따라 자동 서식이 적용되었습니다.</span>
          </div>
          <span className="font-bold tracking-widest text-slate-600 dark:text-zinc-300">끝.</span>
        </div>

      </div>

      {/* NotebookLM급 팩트 출처 각주 팝오버 */}
      <FactCitationPopover
        citation={popoverCitation}
        onClose={() => setPopoverCitation(null)}
        onFocusSource={(_sourceId, _sourceTitle) => {
          if (onSelectCitation && popoverCitation) onSelectCitation(popoverCitation);
        }}
      />
    </div>
  );
};
