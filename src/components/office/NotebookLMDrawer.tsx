// src/components/office/NotebookLMDrawer.tsx
// 제3챕터 AI 오피스 스튜디오 지식 소스 보관함 (Source Vault) 서랍 & 2인 대화형 오디오 브리핑

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Paperclip, 
  Plus, 
  Play, 
  Square, 
  Sparkles, 
  Volume2,
  Globe,
  FileCode,
  MessageSquare,
  UploadCloud,
  CheckSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { GroundingSource } from '../../services/groundingService';

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

  // 소스 문서 데이터 상태 ([📄 PDF], [🌐 웹 크롤링 URL], [📝 마크다운], [💬 회의록/음성])
  const [sources, setSources] = useState<GroundingSource[]>([
    {
      id: 1,
      name: '2026_Q4_신규_사업계획서_최종.pdf',
      type: 'PDF',
      selected: true,
      citationText: '[1] 2026 시장 분석 보고서 p.12',
      excerpt: 'AI 오피스 스튜디오 도입 시 전사 문서 수립 생산성이 320% 향상되며 결재 오류율 0%를 달성합니다.'
    },
    {
      id: 2,
      name: 'https://coupang.com/search?q=리뷰데이터',
      type: 'LINK',
      selected: true,
      citationText: '[2] 쿠팡 50개 상품 리뷰 수급',
      excerpt: '스마트 시트 그리드에 주입된 실시간 리뷰 평점 평균 4.85점 및 만족도 최우수 도출.'
    },
    {
      id: 3,
      name: '표준_지출결의서_작성_지침.md',
      type: 'MARKDOWN',
      selected: true,
      citationText: '[3] 사내 지출결의서 규정',
      excerpt: '공급가액 = 수량 * 단가 수식 산출 후 노션 통합 허브 DB에 자동 결재 상신.'
    },
    {
      id: 4,
      name: 'Q4_전략기획_음성회의록_요약.mp3',
      type: 'AUDIO',
      selected: false,
      citationText: '[4] 전략 회의록 음성 텍스트',
      excerpt: '제2챕터 라이프 허브 캘린더와 제3챕터 오피스 캔버스의 양방향 데이터 브릿지 승인 완료.'
    }
  ]);

  const [inputLink, setInputLink] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [speakerTurn, setSpeakerTurn] = useState<'HostA' | 'HostB' | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 스크롤 및 하이라이트 지점 참조
  const sourceRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
    const newSource: GroundingSource = {
      id: newId,
      name: inputLink.trim(),
      type: 'LINK',
      selected: true,
      citationText: `[${sources.length + 1}] 웹 크롤링 소스`,
      excerpt: `${inputLink.trim()} URL에서 파싱 추출된 팩트 검증 RAG 데이터입니다.`
    };
    setSources((prev) => [...prev, newSource]);
    setInputLink('');
    setIsModalOpen(false);
    showToast('🌐 [Source Vault] 웹 크롤링 소스가 성공적으로 추가되었습니다!', 'success');
  };

  // 모의 PDF / 마크다운 파일 업로드
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isMd = file.name.endsWith('.md');
    const isAudio = file.name.endsWith('.mp3') || file.name.endsWith('.wav');
    const newSource: GroundingSource = {
      id: Date.now(),
      name: file.name,
      type: isMd ? 'MARKDOWN' : isAudio ? 'AUDIO' : 'PDF',
      selected: true,
      citationText: `[${sources.length + 1}] ${file.name}`,
      excerpt: `${file.name} 문서 소스에서 추출된 RAG 팩트 텍스트입니다.`
    };
    setSources((prev) => [...prev, newSource]);
    setIsModalOpen(false);
    showToast(`📄 [Source Vault] ${file.name} 문서가 등록되었습니다!`, 'success');
  };

  // 2인 대화형 오디오 브리핑
  const handleToggleAudioOverview = () => {
    if (isAudioPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsAudioPlaying(false);
      setSpeakerTurn(null);
      showToast('⏹️ 2인 오디오 브리핑을 중지했습니다.', 'info');
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('이 브라우저는 음성 합성을 지원하지 않습니다.', 'info');
      return;
    }

    const scriptTurns = [
      { speaker: 'HostA' as const, text: '안녕하세요! 오피스 스튜디오 지식 소스 보관함 2분 브리핑입니다.' },
      { speaker: 'HostB' as const, text: '반갑습니다. 선택된 4개 RAG 검증 소스를 토대로 팩트 기반 문서가 완벽히 수립되었습니다.' },
      { speaker: 'HostA' as const, text: '특히 클릭 가능한 각주 뱃지와 스마트 시트 출처 배지 기능이 돋보이네요.' }
    ];

    setIsAudioPlaying(true);
    let turnIdx = 0;

    const playNextTurn = () => {
      if (turnIdx >= scriptTurns.length) {
        setIsAudioPlaying(false);
        setSpeakerTurn(null);
        showToast('🎉 2인 대화형 브리핑이 완료되었습니다.', 'success');
        return;
      }

      const turn = scriptTurns[turnIdx];
      setSpeakerTurn(turn.speaker);

      const utterance = new SpeechSynthesisUtterance(turn.text);
      utterance.lang = 'ko-KR';
      utterance.rate = turn.speaker === 'HostA' ? 1.05 : 0.98;

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
    showToast('🎙️ 2인 대화형 브리핑 팟캐스트를 재생합니다.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex select-none">
      
      {/* 반투명 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* 좌측 슬라이드 지식 소스 보관함 (Slide-over Drawer) */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl border-r border-slate-200 dark:border-neutral-800 flex flex-col z-10 animate-slideRight">
        
        {/* 서랍 헤더 */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center space-x-1.5">
                <span>지식 소스 보관함 (Source Vault)</span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                NotebookLM RAG 컨테이너 & 팩트 출처 관리자
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 소스 추가 메인 버튼 (모달 오픈) */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-900">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>➕ 신규 소스 추가 (PDF / URL / 마크다운)</span>
          </button>

          {/* 소스 타입 아이콘 패스트태그 설명 */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-1">
            <span className="flex items-center space-x-1 font-semibold">
              <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>체크된 소스만 RAG 맥락 반영</span>
            </span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">
              {sources.filter((s) => s.selected).length} / {sources.length} 선택됨
            </span>
          </div>
        </div>

        {/* 2. 등록된 소스 카드 리스트 (아이콘 패스트태그: PDF, LINK, MARKDOWN, AUDIO) */}
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
                {/* 상단 체크박스 및 소스 타입 패스트태그 */}
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
                      
                      {/* 소스 카드 리스트 패스트태그 아이콘 */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center space-x-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 ml-1 shrink-0">
                        {source.type === 'PDF' && <Paperclip className="w-3 h-3 text-rose-500" />}
                        {source.type === 'LINK' && <Globe className="w-3 h-3 text-blue-500" />}
                        {source.type === 'MARKDOWN' && <FileCode className="w-3 h-3 text-emerald-500" />}
                        {source.type === 'AUDIO' && <MessageSquare className="w-3 h-3 text-amber-500" />}
                        <span>[{source.type}]</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 팩트 인용 뱃지 및 원본 구절 발췌 */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{source.citationText}</span>
                    </span>
                    {isHighlighted && (
                      <button onClick={onClearCitation} className="text-[9px] text-purple-500 hover:underline">
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

        {/* 3. 2분 오디오 브리핑 팟캐스트 위젯 */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">🎙️ 2분 오디오 브리핑</h4>
                <p className="text-[10px] text-slate-400">2인 대화형 팟캐스트 AI 스피치</p>
              </div>
            </div>

            <button
              onClick={handleToggleAudioOverview}
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
            >
              {isAudioPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAudioPlaying ? '정지' : '재생'}</span>
            </button>
          </div>

          {/* 현재 발언 호스트 렌더링 */}
          {isAudioPlaying && (
            <div className="p-2 rounded-xl bg-slate-800 border border-purple-500/40 flex items-center justify-between text-[11px] animate-fadeIn">
              <span className="font-bold text-purple-300">
                {speakerTurn === 'HostA' ? '🎙️ 진행자 A (알렉스)' : '🎙️ 전문가 B (엠마)'}
              </span>
              <span className="text-[10px] text-purple-400 font-mono animate-pulse">발화 중...</span>
            </div>
          )}
        </div>

      </div>

      {/* 4. [➕ 신규 소스 추가] 모달 및 드래그앤드롭 영역 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Source Vault 신규 소스 추가</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 드래그앤드롭 영역 */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); handleFileUpload(e.dataTransfer.files); }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center space-y-2 transition ${
                isDraggingOver
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40'
                  : 'border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/40'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-purple-500 mx-auto animate-bounce" />
              <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                PDF, 마크다운, 음성 파일 드래그 & 드롭
              </p>
              <label className="inline-block px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition">
                파일 선택하기
                <input type="file" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
              </label>
            </div>

            {/* 웹 URL 입력 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">🌐 웹 크롤링 URL 입력</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddLink}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                >
                  추가
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
