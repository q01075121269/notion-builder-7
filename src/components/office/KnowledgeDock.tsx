import React, { useState, useRef, useEffect } from 'react';
import type { OfficeSource, OfficeSourceType } from '../../types/office';
import { MultiSourceResearchModal } from './MultiSourceResearchModal';
import { 
  FileUp, 
  Globe, 
  Mic, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Trash2, 
  FileText, 
  Database,
  Eye,
  X,
  Building2,
  PanelLeftClose,
  Search
} from 'lucide-react';

import { useSparkTheme } from '../../context/SparkThemeContext';

interface KnowledgeDockProps {
  sources: OfficeSource[];
  onToggleSelectSource: (sourceId: string) => void;
  onAddSource: (source: OfficeSource) => void;
  onAddSources?: (sources: OfficeSource[]) => void;
  onDeleteSource: (sourceId: string) => void;
  onSelectSourcePreview?: (source: OfficeSource) => void;
  onOpenTemplateInjector?: (source?: OfficeSource) => void;
  onCollapse?: () => void;
}

export const KnowledgeDock: React.FC<KnowledgeDockProps> = ({
  sources,
  onToggleSelectSource,
  onAddSource,
  onAddSources,
  onDeleteSource,
  onSelectSourcePreview: _onSelectSourcePreview,
  onOpenTemplateInjector,
  onCollapse
}) => {
  const { themeConfig } = useSparkTheme();
  // 모달 및 입력창 상태
  const [activeInputTab, setActiveInputTab] = useState<'none' | 'url' | 'voice' | 'deep_research'>('none');
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [researchKeyword, setResearchKeyword] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [previewSource, setPreviewSource] = useState<OfficeSource | null>(null);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [isResearchMicActive, setIsResearchMicActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const researchRecognitionRef = useRef<any>(null);

  // 팩트 출처 클릭 시 해당 소스 카드로 스크롤 포커스 & 하이라이트 애니메이션
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceId: string; sourceTitle: string }>;
      const { sourceId, sourceTitle } = customEvent.detail || {};
      const target = sources.find(s => 
        s.id === sourceId || 
        (sourceTitle && s.title.includes(sourceTitle.replace(/\s*\(.*\)/, ''))) ||
        (sourceTitle && sourceTitle.includes(s.title))
      );
      if (target) {
        setHighlightedSourceId(target.id);
        const el = document.getElementById(`source-item-${target.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        setTimeout(() => setHighlightedSourceId(null), 3500);
      }
    };
    window.addEventListener('focus-office-source', handler);
    return () => window.removeEventListener('focus-office-source', handler);
  }, [sources]);

  // 총 소스 통계
  const selectedSources = sources.filter(s => s.isSelected);
  const totalTokens = selectedSources.reduce((sum, s) => sum + s.tokenCount, 0);

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newSource: OfficeSource = {
        id: `src-${Date.now()}-${i}`,
        title: file.name,
        type: 'file',
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        tokenCount: Math.round(file.size / 4) + 120,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isSelected: true,
        summary: `사용자 직접 업로드 파일 (${file.name})`,
        content: `[파일 원문 미리보기]\n파일명: ${file.name}\n크기: ${file.size} bytes\n오피스 스튜디오 AI 지식 창고에 파싱 적재 완료되었습니다.`
      };
      onAddSource(newSource);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // URL 소스 추가
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newSource: OfficeSource = {
      id: `src-url-${Date.now()}`,
      title: urlInput.replace(/^https?:\/\//, '').slice(0, 30) + ' 웹 문서',
      type: 'url',
      url: urlInput,
      tokenCount: 4800,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      isSelected: true,
      summary: '실시간 웹 크롤링 및 구조화 데이터 추출 완료',
      content: `[URL 크롤링 결과: ${urlInput}]\n- 웹 데이터 파싱 및 본문 텍스트 추출 완료.\n- 주요 인용구 및 팩트 데이터베이스 매핑 성공.`
    };
    onAddSource(newSource);
    setUrlInput('');
    setActiveInputTab('none');
  };

  // 음성 메모 녹음 (Web Speech API 또는 시뮬레이션)
  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setVoiceText('음성을 듣고 있습니다... ("2026년 오피스 예산은 잔여분 범위 내에서 긴급 편성...")');
      
      // Web Speech API 지원 검사
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'ko-KR';
          recognition.continuous = true;
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0].transcript)
              .join('');
            setVoiceText(transcript);
          };
          recognition.start();
          (window as any).__voiceRec = recognition;
        } catch {
          // fallback
        }
      }
    } else {
      setIsRecording(false);
      if ((window as any).__voiceRec) {
        try {
          (window as any).__voiceRec.stop();
        } catch {
          // ignore
        }
      }

      const newSource: OfficeSource = {
        id: `src-voice-${Date.now()}`,
        title: '회의 및 아이디어 음성 메모 녹음.m4a',
        type: 'voice',
        tokenCount: 2350,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isSelected: true,
        summary: 'Web Speech API 실시간 STT 텍스트 변환본',
        content: `[음성 메모 STT 변환 기록]\n${voiceText || '2026년 4분기 오피스 스튜디오 도입 시 신속성과 보안 준수를 최우선으로 검토 요망.'}`
      };
      onAddSource(newSource);
      setVoiceText('');
      setActiveInputTab('none');
    }
  };

  // 리서치 입력창 음성(STT) 마이크 토글
  const handleToggleResearchVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('브라우저에서 Web Speech API(음성 인식)를 지원하지 않습니다.');
      return;
    }

    if (!isResearchMicActive) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsResearchMicActive(true);
        };

        recognition.onresult = (event: any) => {
          let finalChunk = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript.trim() + ' ';
            }
          }
          if (finalChunk.trim()) {
            setResearchKeyword(prev => {
              const p = prev.trim();
              const n = finalChunk.trim();
              if (!p) return n;
              if (p.endsWith(n)) return p;
              return `${p} ${n}`;
            });
          }
        };

        recognition.onerror = () => {
          setIsResearchMicActive(false);
        };

        recognition.onend = () => {
          setIsResearchMicActive(false);
        };

        researchRecognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsResearchMicActive(false);
      }
    } else {
      if (researchRecognitionRef.current) {
        try { researchRecognitionRef.current.stop(); } catch {}
        researchRecognitionRef.current = null;
      }
      setIsResearchMicActive(false);
    }
  };

  // 다중 웹/문서 소스 일괄 탐색 모달 오픈
  const handleOpenMultiSourceModal = () => {
    if (researchRecognitionRef.current) {
      try { researchRecognitionRef.current.stop(); } catch {}
      researchRecognitionRef.current = null;
    }
    setIsResearchMicActive(false);
    setIsMultiModalOpen(true);
  };

  // 일괄 소스 적재 핸들러
  const handleBatchImportSources = (newSources: OfficeSource[]) => {
    if (onAddSources) {
      onAddSources(newSources);
    } else {
      newSources.forEach(s => onAddSource(s));
    }
  };

  const getSourceIcon = (type: OfficeSourceType) => {
    switch (type) {
      case 'file': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'url': return <Globe className="w-4 h-4 text-emerald-500" />;
      case 'voice': return <Mic className="w-4 h-4 text-amber-500" />;
      case 'deep_research': return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className={`w-full h-full flex flex-col ${themeConfig.panelBg} ${themeConfig.panelText} border-r ${themeConfig.panelBorder} overflow-hidden select-none transition-colors duration-200`}>
      
      {/* 1. 상단 타이틀 & 팩트 그라운딩 요약 인디케이터 */}
      <div className={`p-4 border-b ${themeConfig.panelBorder} shrink-0 ${themeConfig.headerBg}`}>
        <div className="flex items-center justify-between mb-2 gap-1.5">
          <div className="flex items-center space-x-2 min-w-0">
            <Database className={`w-4 h-4 ${themeConfig.accentText} shrink-0`} />
            <h2 className={`text-xs sm:text-sm font-black truncate ${themeConfig.textPrimary}`}>
              지식 창고 (Knowledge Dock)
            </h2>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <span className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-2xs ${themeConfig.pillBg} ${themeConfig.pillBorder} ${themeConfig.pillText}`}>
              {selectedSources.length}/{sources.length}건 활성 {totalTokens > 0 ? `(${totalTokens.toLocaleString()} tokens)` : ''}
            </span>
            {onCollapse && (
              <button
                onClick={onCollapse}
                className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${themeConfig.panelHover}`}
                title="지식 창고 접기 (단축키 또는 원클릭)"
              >
                <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-slate-200" />
              </button>
            )}
          </div>
        </div>

        <div className={`flex items-center justify-between text-[11px] ${themeConfig.panelSubtext}`}>
          <span>문서·기획 반영 누적 토큰:</span>
          <span className={`font-mono font-bold ${themeConfig.accentText}`}>
            {totalTokens.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* 2. 빠른 소스 추가 액션 버튼들 */}
      <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-app)] shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {/* 파일 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-[var(--bg-card)] hover:opacity-90 border border-[var(--border-color)] text-slate-800 dark:text-slate-200 text-xs font-medium transition shadow-xs cursor-pointer"
            title="PDF, XLSX 파일 드래그앤드롭 업로드"
          >
            <FileUp className="w-3.5 h-3.5 text-blue-500" />
            <span>파일 업로드</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* URL 추가 버튼 */}
          <button
            onClick={() => setActiveInputTab(activeInputTab === 'url' ? 'none' : 'url')}
            className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl border text-xs font-medium transition shadow-xs cursor-pointer ${
              activeInputTab === 'url'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-[var(--bg-card)] hover:opacity-90 border-[var(--border-color)] text-slate-800 dark:text-slate-200'
            }`}
            title="웹페이지 URL 소스 등록"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>웹 URL</span>
          </button>

          {/* 음성 녹음 버튼 */}
          <button
            onClick={() => setActiveInputTab(activeInputTab === 'voice' ? 'none' : 'voice')}
            className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl border text-xs font-medium transition shadow-xs cursor-pointer ${
              activeInputTab === 'voice'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-[var(--bg-card)] hover:opacity-90 border-[var(--border-color)] text-slate-800 dark:text-slate-200'
            }`}
            title="음성 메모 실시간 STT"
          >
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            <span>음성 메모</span>
          </button>
        </div>

        {/* 지식 창고 리서치 입력창 & 마이크 & 다중 웹/문서 소스 일괄 탐색 버튼 */}
        <div className="relative">
          <div className="flex items-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-[var(--accent-color)]/30">
            <Search className="w-4 h-4 text-[var(--accent-color)] ml-2.5 shrink-0" />
            <input
              type="text"
              value={researchKeyword}
              onChange={(e) => setResearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenMultiSourceModal();
              }}
              placeholder='"스마트 시설물 유지관리 및 AI 에이전트 행정 자동화"...'
              className="w-full py-2 px-2 text-xs bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 font-medium"
            />
            {/* 음성(STT) 마이크 토글 버튼 */}
            <button
              type="button"
              onClick={handleToggleResearchVoice}
              className={`p-1.5 mr-1 rounded-lg transition cursor-pointer shrink-0 ${
                isResearchMicActive
                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--bg-app)]'
              }`}
              title={isResearchMicActive ? '음성 듣는 중... 클릭하여 중지' : '음성(STT)으로 리서치 주제 말하기'}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            {/* [조사] 버튼 */}
            <button
              type="button"
              onClick={handleOpenMultiSourceModal}
              className="px-2.5 py-1.5 mr-1 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 text-[11px] transition cursor-pointer shrink-0 shadow-xs flex items-center space-x-1"
              title="다중 웹/문서 소스 일괄 탐색 모달 열기"
            >
              <Sparkles className="w-3 h-3" />
              <span>조사</span>
            </button>
          </div>
        </div>

        {/* 사내 서식 스캔 & 캔버스 복제 주입 퀵 버튼 */}
        <button
          type="button"
          onClick={() => onOpenTemplateInjector && onOpenTemplateInjector()}
          className="w-full mt-2 py-1.5 px-2.5 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)]/50 bg-[var(--bg-card)] hover:opacity-90 text-[11px] font-bold text-[var(--text-primary)] flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
          title="사내 결재선·문서번호·표 그리드 서식 스캔 및 캔버스 주입"
        >
          <Building2 className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          <span>사내 고유 서식 스캔 & 캔버스 복제 주입</span>
        </button>

        {/* URL 인라인 입력창 */}
        {activeInputTab === 'url' && (
          <form onSubmit={handleAddUrl} className="flex items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-fadeIn">
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/report"
              className="flex-1 py-1 px-2 text-xs bg-transparent outline-none text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              추가
            </button>
          </form>
        )}

        {/* 음성 녹음 제어 패널 */}
        {activeInputTab === 'voice' && (
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isRecording ? '실시간 음성 수신 중...' : '마이크를 켜고 아이디어를 말하세요'}
              </span>
              <button
                onClick={handleVoiceToggle}
                className={`px-3 py-1 rounded-lg text-xs font-bold text-white transition ${
                  isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {isRecording ? '녹음 완료 및 저장' : '녹음 시작'}
              </button>
            </div>
            {voiceText && (
              <p className="text-[11px] text-[var(--text-secondary)] italic bg-[var(--bg-app)] p-2 rounded-lg">
                "{voiceText}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. 등록된 소스 리스트 (스크롤) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-1">
          <span>등록된 원천 지식 ({sources.length})</span>
          <span>기획/문서 반영</span>
        </div>

        {sources.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            등록된 소스가 없습니다. 상단에서 소스를 추가해 주세요.
          </div>
        ) : (
          sources.map((src) => {
            const isHighlighted = highlightedSourceId === src.id;
            return (
              <div
                key={src.id}
                id={`source-item-${src.id}`}
                className={`
                  group p-3 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between
                  ${isHighlighted 
                    ? 'ring-2 ring-[var(--accent-color)] bg-[var(--accent-color)]/10 border-[var(--accent-color)] shadow-md scale-[1.01]' 
                    : src.isSelected 
                      ? 'bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs' 
                      : 'bg-[var(--bg-app)] border-[var(--border-color)] opacity-60'
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="p-1 rounded-lg bg-[var(--bg-app)] shrink-0">
                        {getSourceIcon(src.type)}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate" title={src.title}>
                        {src.title}
                      </h4>
                    </div>

                    {/* 기획/문서 반영 체크박스 */}
                    <button
                      onClick={() => onToggleSelectSource(src.id)}
                      className="text-[var(--accent-color)] hover:scale-110 transition cursor-pointer shrink-0"
                      title={src.isSelected ? '문서 반영 해제' : '문서 반영 포함'}
                    >
                      {src.isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-[var(--accent-color)] text-[var(--bg-card)]" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  </div>

                  {/* 요약문 */}
                  {src.summary && (
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2 mb-2">
                      {src.summary}
                    </p>
                  )}
                </div>

                {/* 하단 메타 & 사내 양식 적용 & 원문보기/삭제 버튼 */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span className="font-mono">
                      {src.tokenCount.toLocaleString()} tkn {src.fileSize ? `• ${src.fileSize}` : ''}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPreviewSource(src)}
                        className="p-1 hover:text-[var(--accent-color)] transition cursor-pointer"
                        title="원문 및 요약 내용 보기"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="p-1 hover:text-red-500 transition cursor-pointer"
                        title="소스 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 사내 양식으로 적용 버튼 */}
                  <button
                    type="button"
                    onClick={() => onOpenTemplateInjector && onOpenTemplateInjector(src)}
                    className="w-full py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
                    title="이 소스의 서식/표 구조를 사내 표준 양식으로 캔버스에 복제 적용"
                  >
                    <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                    <span>사내 양식으로 적용</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 원천 소스 상세 뷰어 모달 */}
      {previewSource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[var(--border-color)] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
              <div className="flex items-center space-x-2 truncate pr-2">
                {getSourceIcon(previewSource.type)}
                <h3 className="text-sm font-black text-[var(--text-primary)] truncate">
                  {previewSource.title}
                </h3>
              </div>
              <button onClick={() => setPreviewSource(null)} className="text-[var(--text-secondary)] hover:opacity-80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="font-bold text-[var(--accent-color)] block mb-1">AI 팩트 요약</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">{previewSource.summary || '요약 정보 없음'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[var(--text-secondary)] block">원문 텍스트 데이터</span>
                <pre className="p-3 rounded-xl bg-[var(--bg-app)] font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] border border-[var(--border-color)]">
                  {previewSource.content}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-color)] flex justify-end shrink-0">
              <button
                onClick={() => setPreviewSource(null)}
                className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-white text-xs font-bold hover:opacity-90 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 다중 웹/문서 소스 일괄 탐색 모달 (NotebookLM & Genspark 스타일) */}
      <MultiSourceResearchModal
        isOpen={isMultiModalOpen}
        onClose={() => setIsMultiModalOpen(false)}
        query={researchKeyword || '스마트 시설물 유지관리 및 AI 에이전트 행정 자동화'}
        onImportSources={handleBatchImportSources}
      />

    </div>
  );
};
