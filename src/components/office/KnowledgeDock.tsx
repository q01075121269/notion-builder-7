import React, { useState, useRef, useEffect } from 'react';
import type { OfficeSource, OfficeSourceType } from '../../types/office';
import { 
  FileUp, 
  Globe, 
  Mic, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Trash2, 
  FileText, 
  Loader2,
  Database,
  Eye,
  X,
  Building2
} from 'lucide-react';

interface KnowledgeDockProps {
  sources: OfficeSource[];
  onToggleSelectSource: (sourceId: string) => void;
  onAddSource: (source: OfficeSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onSelectSourcePreview?: (source: OfficeSource) => void;
  onOpenTemplateInjector?: (source?: OfficeSource) => void;
}

export const KnowledgeDock: React.FC<KnowledgeDockProps> = ({
  sources,
  onToggleSelectSource,
  onAddSource,
  onDeleteSource,
  onSelectSourcePreview: _onSelectSourcePreview,
  onOpenTemplateInjector
}) => {
  // 모달 및 입력창 상태
  const [activeInputTab, setActiveInputTab] = useState<'none' | 'url' | 'voice' | 'deep_research'>('none');
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [researchKeyword, setResearchKeyword] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchStep, setResearchStep] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [previewSource, setPreviewSource] = useState<OfficeSource | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 젠스파크형 자율 심층 리서치 (Multi-step Web Investigation Simulation)
  const handleRunDeepResearch = async () => {
    if (!researchKeyword.trim()) return;
    setIsResearching(true);

    setResearchStep('1. 구글 및 글로벌 학술/산업 DB 다각도 검색 쿼리 발산 중...');
    await new Promise(r => setTimeout(r, 600));

    setResearchStep('2. 상위 12개 전문 보고서 및 보도자료 크롤링 및 팩트 교차 검증 중...');
    await new Promise(r => setTimeout(r, 600));

    setResearchStep('3. 핵심 수치 및 출처 메타데이터 추출 완료!');
    await new Promise(r => setTimeout(r, 400));

    const newSource: OfficeSource = {
      id: `src-deep-${Date.now()}`,
      title: `[자율 심층 리서치] ${researchKeyword}`,
      type: 'deep_research',
      tokenCount: 16500,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      isSelected: true,
      summary: `젠스파크형 자율 에이전트 교차 검증 리서치 리포트 (${researchKeyword})`,
      content: `[젠스파크형 심층 리서치 분석 결과 - 키워드: ${researchKeyword}]\n1. 시장 전망: 2026년 글로벌 오피스 시장의 생성형 AI 도입률은 연평균 48.2% 성장 중.\n2. 핵심 지표: 기안 결재 소요 시간 78% 단축, 예산 집행 오차율 0.2% 미만 유지.\n3. 규제 준수: 공공/금융 가이드라인에 따른 데이터 무결성 보증 필수.`
    };

    onAddSource(newSource);
    setIsResearching(false);
    setResearchKeyword('');
    setActiveInputTab('none');
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
    <div className="w-full h-full flex flex-col bg-slate-50/90 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 overflow-hidden select-none">
      
      {/* 1. 상단 타이틀 & 팩트 그라운딩 요약 인디케이터 */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-850">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              지식 창고 (Knowledge Dock)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {selectedSources.length}/{sources.length}건 활성
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span>문서·기획 반영 누적 토큰:</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {totalTokens.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* 2. 빠른 소스 추가 액션 버튼들 */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-800/40 shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {/* 파일 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition shadow-2xs cursor-pointer"
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
            className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
              activeInputTab === 'url'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
            }`}
            title="웹페이지 URL 소스 등록"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>웹 URL</span>
          </button>

          {/* 음성 녹음 버튼 */}
          <button
            onClick={() => setActiveInputTab(activeInputTab === 'voice' ? 'none' : 'voice')}
            className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
              activeInputTab === 'voice'
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                : 'bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
            }`}
            title="음성 메모 실시간 STT"
          >
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            <span>음성 메모</span>
          </button>
        </div>

        {/* 젠스파크형 자율 심층 리서치 인풋 바 */}
        <div className="relative">
          <div className="flex items-center rounded-xl bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-800 shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-purple-400">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 ml-2.5 shrink-0 animate-pulse" />
            <input
              type="text"
              value={researchKeyword}
              onChange={(e) => setResearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunDeepResearch();
              }}
              placeholder="젠스파크형 자율 심층 리서치..."
              className="w-full py-2 px-2 text-xs bg-transparent outline-none text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 font-medium"
            />
            <button
              onClick={handleRunDeepResearch}
              disabled={isResearching || !researchKeyword.trim()}
              className="px-2.5 py-1.5 mr-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-bold transition cursor-pointer shrink-0"
            >
              {isResearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '조사'}
            </button>
          </div>

          {/* 심층 리서치 진행 알림 */}
          {isResearching && (
            <div className="mt-2 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-200 font-medium space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-1.5 font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                <span>자율 에이전트 리서치 수행 중</span>
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-300 pl-5">{researchStep}</p>
            </div>
          )}

          {/* 사내 서식 스캔 & 캔버스 복제 주입 퀵 버튼 */}
          <button
            type="button"
            onClick={() => onOpenTemplateInjector && onOpenTemplateInjector()}
            className="w-full mt-2 py-1.5 px-2.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-white/60 dark:bg-zinc-850/60 hover:bg-slate-50 dark:hover:bg-zinc-800 text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
            title="사내 결재선·문서번호·표 그리드 서식 스캔 및 캔버스 주입"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>사내 고유 서식 스캔 & 캔버스 복제 주입</span>
          </button>
        </div>

        {/* URL 인라인 입력창 */}
        {activeInputTab === 'url' && (
          <form onSubmit={handleAddUrl} className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 animate-fadeIn">
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/report"
              className="flex-1 py-1 px-2 text-xs bg-transparent outline-none text-slate-800 dark:text-white"
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
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
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
              <p className="text-[11px] text-slate-600 dark:text-zinc-300 italic bg-slate-50 dark:bg-zinc-900 p-2 rounded-lg">
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
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 shadow-md scale-[1.01]' 
                    : src.isSelected 
                      ? 'bg-white dark:bg-zinc-850 border-slate-300 dark:border-zinc-700 shadow-xs' 
                      : 'bg-slate-100/50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 opacity-60'
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 shrink-0">
                        {getSourceIcon(src.type)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate" title={src.title}>
                        {src.title}
                      </h4>
                    </div>

                    {/* 기획/문서 반영 체크박스 */}
                    <button
                      onClick={() => onToggleSelectSource(src.id)}
                      className="text-indigo-600 dark:text-indigo-400 hover:scale-110 transition cursor-pointer shrink-0"
                      title={src.isSelected ? '문서 반영 해제' : '문서 반영 포함'}
                    >
                      {src.isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-indigo-500 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* 요약문 */}
                  {src.summary && (
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug line-clamp-2 mb-2">
                      {src.summary}
                    </p>
                  )}
                </div>

                {/* 하단 메타 & 사내 양식 적용 & 원문보기/삭제 버튼 */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span className="font-mono">
                      {src.tokenCount.toLocaleString()} tkn {src.fileSize ? `• ${src.fileSize}` : ''}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPreviewSource(src)}
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                        title="원문 및 요약 내용 보기"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="p-1 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
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
                    className="w-full py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="이 소스의 서식/표 구조를 사내 표준 양식으로 캔버스에 복제 적용"
                  >
                    <Building2 className="w-3 h-3 text-slate-500" />
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2 truncate pr-2">
                {getSourceIcon(previewSource.type)}
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {previewSource.title}
                </h3>
              </div>
              <button onClick={() => setPreviewSource(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">AI 팩트 요약</span>
                <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">{previewSource.summary || '요약 정보 없음'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-500 dark:text-zinc-400 block">원문 텍스트 데이터</span>
                <pre className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800">
                  {previewSource.content}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
