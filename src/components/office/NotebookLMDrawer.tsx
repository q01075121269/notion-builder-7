// src/components/office/NotebookLMDrawer.tsx
// 제3챕터 AI 오피스 스튜디오 노트북LM형 지식 소스 서랍 & 2인 대화형 오디오 브리핑 위젯

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Paperclip, 
  Plus, 
  Mail, 
  Play, 
  Square, 
  Sparkles, 
  Volume2,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface SourceItem {
  id: number;
  name: string;
  type: 'PDF' | 'DOCX' | 'LINK' | 'EMAIL';
  size: string;
  selected: boolean;
  citationText: string;
  excerpt: string;
}

interface NotebookLMDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCitationId: number | null;
  onClearCitation: () => void;
}

export const NotebookLMDrawer: React.FC<NotebookLMDrawerProps> = ({
  isOpen,
  onClose,
  activeCitationId,
  onClearCitation
}) => {
  const { showToast } = useApp();

  // 소스 문서 데이터 상태
  const [sources, setSources] = useState<SourceItem[]>([
    {
      id: 1,
      name: '2026_Q3_전략_사업계획서_최종.pdf',
      type: 'PDF',
      size: '2.4 MB',
      selected: true,
      citationText: '[1] 오피스 스튜디오 도입 생산성 지표',
      excerpt: 'AI 오피스 스튜디오 도입 시 전사 문서 작성 처리 속도가 평균 320% 향상되며 수식 계산 오류율이 0%로 감소합니다.'
    },
    {
      id: 2,
      name: '시상식_예산_품의서_표준_서식.docx',
      type: 'DOCX',
      size: '512 KB',
      selected: true,
      citationText: '[2] 결재 공문서 수식 서식 100% 매핑',
      excerpt: '표준 결재 서식 자동 매핑을 통해 지출결의서 및 품의서의 기안 오류율 0% 달성 및 결재 승인 시간 단축.'
    },
    {
      id: 3,
      name: 'https://notion.so/wiki/office-guide',
      type: 'LINK',
      size: '웹 위키',
      selected: false,
      citationText: '[3] 노션 워크스페이스 양방향 커넥터',
      excerpt: 'Docs/Sheets/Slides 3대 라이브 캔버스 작성 문서의 노션 워크스페이스 DB 원클릭 내보내기 규격 가이드.'
    }
  ]);

  const [inputLink, setInputLink] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [speakerTurn, setSpeakerTurn] = useState<'HostA' | 'HostB' | null>(null);

  // 스크롤 및 하이라이트 지점 참조
  const sourceRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 각주 뱃지 클릭으로 서랍 열렸을 때 해당 소스로 스크롤
  useEffect(() => {
    if (isOpen && activeCitationId && sourceRefs.current[activeCitationId]) {
      sourceRefs.current[activeCitationId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, activeCitationId]);

  if (!isOpen) return null;

  // 체크박스 토글
  const handleToggleSelect = (id: number) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // 소스 추가 (웹 링크)
  const handleAddLink = () => {
    if (!inputLink.trim()) return;
    const newId = Date.now();
    const newSource: SourceItem = {
      id: newId,
      name: inputLink.trim(),
      type: 'LINK',
      size: '웹 링크',
      selected: true,
      citationText: `[${sources.length + 1}] 신규 웹 소스`,
      excerpt: `${inputLink.trim()} 웹 페이지에서 추출된 RAG 맥락 데이터입니다.`
    };
    setSources((prev) => [...prev, newSource]);
    setInputLink('');
    showToast('🔗 웹 참고 소스가 성공적으로 추가되었습니다!', 'success');
  };

  // 모의 PDF 파일 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newSource: SourceItem = {
      id: Date.now(),
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'PDF' : 'DOCX',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      selected: true,
      citationText: `[${sources.length + 1}] 업로드 문서 소스`,
      excerpt: `${file.name} 문서에서 추출한 RAG 팩트 베이스 데이터입니다.`
    };
    setSources((prev) => [...prev, newSource]);
    showToast(`📎 [${file.name}] 업로드 소스가 추가되었습니다!`, 'success');
  };

  // 제2챕터 연동: [✉️ 라이프 허브 회의록/이메일 요약에서 가져오기]
  const handleImportLifeHubData = () => {
    const emailSource: SourceItem = {
      id: Date.now(),
      name: '✉️ [라이프 허브] 2026 하반기 전략 회의록 및 이메일 요약.msg',
      type: 'EMAIL',
      size: '라이프 허브',
      selected: true,
      citationText: `[${sources.length + 1}] 라이프 허브 업무 회의록`,
      excerpt: '제2챕터 라이프 허브 이메일/회의록 요약: AI 오피스 스튜디오 도입 시 전사 예산 절감 및 4대 챕터 양방향 연결 승인.'
    };
    setSources((prev) => [...prev, emailSource]);
    showToast('✉️ 제2챕터 라이프 허브 회의록 및 이메일 요약 소스가 등록되었습니다!', 'success');
  };

  // Web Speech API 기반 2인 대화형 2분 오디오 브리핑 (Audio Overview)
  const handleToggleAudioOverview = () => {
    if (isAudioPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsAudioPlaying(false);
      setSpeakerTurn(null);
      showToast('⏹️ 2인 오디오 브리핑 재생을 중지했습니다.', 'info');
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('이 브라우저는 음성 합성(SpeechSynthesis)을 지원하지 않습니다.', 'info');
      return;
    }

    // 2인 대화 스크립트
    const scriptTurns = [
      { speaker: 'HostA' as const, text: '안녕하세요! 오늘 AI 오피스 스튜디오 브리핑에 오신 것을 환영합니다.' },
      { speaker: 'HostB' as const, text: '반갑습니다. 이번 브리핑에서는 스마트 독스, 시트, 슬라이드의 핵심 혁신 포인트를 짚어드립니다.' },
      { speaker: 'HostA' as const, text: '네, 냅킨 AI 방식의 독스와 로우즈 수식 연산 시트, 그리고 감마 스타일의 슬라이드가 원스톱으로 연결되었죠?' },
      { speaker: 'HostB' as const, text: '맞습니다. 특히 NotebookLM 기반의 팩트 출처 인용 뱃지로 100% 검증된 문서만 작성된다는 점이 인상적입니다.' },
      { speaker: 'HostA' as const, text: '정말 기대되네요. 원클릭으로 노션 워크스페이스에 내보내기까지 완벽하게 지원되는 최고의 AI 오피스입니다!' }
    ];

    setIsAudioPlaying(true);
    let turnIdx = 0;

    const playNextTurn = () => {
      if (turnIdx >= scriptTurns.length) {
        setIsAudioPlaying(false);
        setSpeakerTurn(null);
        showToast('🎉 2인 대화형 2분 오디오 브리핑 재생이 완료되었습니다.', 'success');
        return;
      }

      const turn = scriptTurns[turnIdx];
      setSpeakerTurn(turn.speaker);

      const utterance = new SpeechSynthesisUtterance(turn.text);
      utterance.lang = 'ko-KR';
      utterance.rate = turn.speaker === 'HostA' ? 1.05 : 0.98;
      utterance.pitch = turn.speaker === 'HostA' ? 1.1 : 0.9;

      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.includes('ko'));
      if (koVoice) utterance.voice = koVoice;

      utterance.onend = () => {
        turnIdx++;
        playNextTurn();
      };

      utterance.onerror = () => {
        setIsAudioPlaying(false);
        setSpeakerTurn(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    playNextTurn();
    showToast('🎙️ 2인 대화형 2분 오디오 브리핑 팟캐스트가 시작되었습니다.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex select-none">
      
      {/* 반투명 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* 좌측 슬라이드 지식 소스 서랍 (NotebookLM Source Vault) */}
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 h-full shadow-2xl border-r border-slate-200 dark:border-neutral-800 flex flex-col z-10 animate-slideRight">
        
        {/* 서랍 헤더 */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                <span>📚 NotebookLM 소스 보관함</span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                컨텍스트 고정 RAG 팩트 브리핑
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            aria-label="서랍 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 소스 추가 액션 버튼들 */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-900">
          
          <div className="grid grid-cols-2 gap-2">
            {/* 📎 PDF/문서 업로드 */}
            <label className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center justify-center space-x-1.5 cursor-pointer transition truncate">
              <Paperclip className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">📎 PDF/문서 업로드</span>
              <input type="file" onChange={handleFileUpload} accept=".pdf,.docx,.txt" className="hidden" />
            </label>

            {/* ✉️ 라이프 허브 연동 가져오기 */}
            <button
              onClick={handleImportLifeHubData}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center space-x-1.5 transition cursor-pointer truncate"
              title="제2챕터 라이프 허브 회의록/이메일 가져오기"
            >
              <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">✉️ 2챕터 회의록</span>
            </button>
          </div>

          {/* 🔗 웹 링크 등록 */}
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              value={inputLink}
              onChange={(e) => setInputLink(e.target.value)}
              placeholder="🔗 웹 링크 또는 노션 URL 입력..."
              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={handleAddLink}
              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
            <span>체크된 소스만 AI 근거로 컨텍스트 제한</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {sources.filter((s) => s.selected).length} / {sources.length} 개 활성
            </span>
          </div>
        </div>

        {/* 2. 등록된 소스 및 팩트 출처 인용 하이라이트 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sources.map((source) => {
            const isHighlighted = activeCitationId === source.id;
            return (
              <div
                key={source.id}
                ref={(el) => { sourceRefs.current[source.id] = el; }}
                className={`
                  p-3.5 rounded-2xl border transition space-y-2 relative
                  ${isHighlighted
                    ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-500 ring-2 ring-purple-400/50 shadow-md animate-pulse'
                    : source.selected
                    ? 'bg-slate-50 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700'
                    : 'bg-slate-100/50 dark:bg-neutral-900 border-slate-200/50 dark:border-neutral-800 opacity-60'
                  }
                `}
              >
                {/* 상단 체크박스 및 소스명 */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={source.selected}
                    onChange={() => handleToggleSelect(source.id)}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {source.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 ml-1 shrink-0">
                        {source.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{source.size}</span>
                  </div>
                </div>

                {/* 팩트 인용 뱃지 및 문단 발췌 */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{source.citationText}</span>
                    </span>
                    {isHighlighted && (
                      <button
                        onClick={onClearCitation}
                        className="text-[9px] text-purple-500 hover:underline"
                      >
                        하이라이트 해제
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-relaxed italic">
                    "{source.excerpt}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. 2분 오디오 브리핑 (Audio Overview) 팟캐스트 위젯 바 */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center space-x-1">
                  <span>🎙️ 2분 오디오 브리핑 (Audio Overview)</span>
                </h4>
                <p className="text-[10px] text-slate-400">2인 대화형 팟캐스트 AI 음성 스피치</p>
              </div>
            </div>

            {/* 재생/정지 버튼 */}
            <button
              onClick={handleToggleAudioOverview}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 transition cursor-pointer shadow-xs
                ${isAudioPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                }
              `}
            >
              {isAudioPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>정지</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>▶ 재생</span>
                </>
              )}
            </button>
          </div>

          {/* 현재 발언중인 호스트 시각화 */}
          {isAudioPlaying && (
            <div className="p-2.5 rounded-xl bg-slate-800 border border-purple-500/40 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-300">
                  {speakerTurn === 'HostA' ? '🎙️ 진행자 A (알렉스)' : '🎙️ 전문가 B (엠마)'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-3 bg-purple-500 animate-bounce" />
                <span className="w-1.5 h-4 bg-purple-400 animate-bounce delay-100" />
                <span className="w-1.5 h-2 bg-purple-300 animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
