import React, { useState, useRef, useEffect } from 'react';
import type { OfficeDocument, OfficeDocumentFormat, OfficeSource } from '../../types/office';
import { classifyOfficeIntent, executeOfficeIntent } from '../../lib/office/intentRouter';
import { 
  Sparkles, 
  ChevronRight, 
  Headphones, 
  Presentation, 
  GitFork, 
  LayoutGrid, 
  FileText, 
  Table, 
  Mic, 
  FileCheck,
  Send,
  Undo2,
  CheckCircle2,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useSparkTheme } from '../../context/SparkThemeContext';

interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  appliedAction?: string;
}

import type { SparkVisualStyle } from '../../types/visualStyle';

interface NotebookStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormat: OfficeDocumentFormat;
  onChangeFormat: (format: OfficeDocumentFormat) => void;
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onOpenAudioBriefing: () => void;
  onUndo: () => void;
  canUndo: boolean;
  lastActionName?: string;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
  sources?: OfficeSource[];
  onSelectStyle?: (style: SparkVisualStyle) => void;
}

export const NotebookStudioPanel: React.FC<NotebookStudioPanelProps> = ({
  isOpen,
  onClose,
  currentFormat,
  onChangeFormat,
  document,
  onChangeDocument,
  onOpenAudioBriefing,
  onUndo,
  canUndo,
  lastActionName,
  onShowToast,
  sources = [],
  onSelectStyle
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratorsCollapsed, setIsGeneratorsCollapsed] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: '스튜디오 코파일럿입니다. 상단 8대 생성기로 문서를 시각화하거나, "마인드맵 3번째 가지에 보안 정책 추가해줘", "인포그래픽에 예산 수치 강조해줘" 등 말이나 글로 요청하시면 즉시 반영됩니다.',
      timestamp: '방금 전'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const toast = onShowToast || ((_m: string) => {});

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Web Speech API STT (무중단 연속 인식 & 단어 중복 방지)
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('브라우저에서 Web Speech API(음성 인식)를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.');
      return;
    }

    if (!isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const piece = event.results[i][0].transcript.trim();
              if (piece) {
                finalTranscript += (finalTranscript ? ' ' : '') + piece;
              }
            }
          }
          if (finalTranscript.trim()) {
            setInputText(prev => {
              const trimmedPrev = prev.trim();
              const trimmedNew = finalTranscript.trim();
              if (!trimmedPrev) return trimmedNew;
              if (trimmedPrev.endsWith(trimmedNew)) return trimmedPrev;
              return `${trimmedPrev} ${trimmedNew}`;
            });
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (recognitionRef.current && isListening) {
            try {
              recognition.start();
              return;
            } catch {}
          }
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    } else {
      if (recognitionRef.current) {
        const rec = recognitionRef.current;
        recognitionRef.current = null;
        try { rec.stop(); } catch {}
      }
      setIsListening(false);
    }
  };

  // Jev형 지능형 의도 분류기(Intent Classifier) 및 Gemini 실무 작문 엔진 연동
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    // 0. 음성 녹음 중이면 전송 시 안전하게 마이크 중단
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch {}
      setIsListening(false);
    }

    // 1. 입력창 즉시 초기화 (누락 버그 완전 해결)
    setInputText('');

    const userMsg: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: '방금 전'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // 2. Jev형 인텐트 판단기 호출 (단순 키워드 매칭이 아닌 명확한 의도 구조체 분류)
      const classifiedIntent = classifyOfficeIntent(text, document);

      // 3. Gemini 심층 작문 및 백엔드 실연동 캔버스 변이 실행
      const result = await executeOfficeIntent(classifiedIntent, text, document, sources);

      // 4. 캔버스 상태 즉각 갱신 및 Undo 히스토리 바인딩
      onChangeDocument(result.updatedDoc, result.actionName);
      toast(result.actionName, 'success');

      // 5. 캔버스 하이라이트 애니메이션 발송
      if (result.highlightTarget) {
        window.dispatchEvent(new CustomEvent('anti-office-highlight', { detail: { target: result.highlightTarget } }));
      }

      // 6. 필요한 경우 포맷 자동 동기화
      if (result.targetFormat && result.targetFormat !== currentFormat) {
        onChangeFormat(result.targetFormat);
      }

      // 6-1. 자연어 지시에 의한 비주얼 스타일 즉시 변환
      if (result.targetStyle && onSelectStyle) {
        onSelectStyle(result.targetStyle);
      }

      // 7. 실무 브리핑 응답 메시지 반환
      const aiMsg: CopilotMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: result.replyText,
        timestamp: '방금 전',
        appliedAction: result.actionName
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('[Copilot Error]:', err);
      const errMsg: CopilotMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: `오류가 발생했습니다: ${err.message || '요청 처리 중 오류가 발생했습니다.'}`,
        timestamp: '방금 전'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // 8대 출력 생성기 정의
  const STUDIO_GENERATORS = [
    {
      id: 'audio',
      label: 'AI 오디오 오버뷰',
      desc: '2분 팟캐스트 요약',
      icon: Headphones,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      isFormat: false,
      onClick: onOpenAudioBriefing
    },
    {
      id: 'slides',
      format: 'slides' as OfficeDocumentFormat,
      label: '슬라이드 자료',
      desc: '16:9 발표 카드 슬라이드',
      icon: Presentation,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      activeColor: 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      isFormat: true,
      onClick: () => onChangeFormat('slides')
    },
    {
      id: 'mindmap',
      format: 'mindmap' as OfficeDocumentFormat,
      label: '마인드맵',
      desc: '시각적 인터랙티브 트리',
      icon: GitFork,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
      isFormat: true,
      onClick: () => onChangeFormat('mindmap')
    },
    {
      id: 'infographic',
      format: 'infographic' as OfficeDocumentFormat,
      label: '인포그래픽',
      desc: '고해상도 비주얼 벤토',
      icon: LayoutGrid,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
      activeColor: 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      isFormat: true,
      onClick: () => onChangeFormat('infographic')
    },
    {
      id: 'docs',
      format: 'docs' as OfficeDocumentFormat,
      label: '공문서/기안서',
      desc: '행안부 표준 결재선 규격',
      icon: FileText,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      isFormat: true,
      onClick: () => onChangeFormat('docs')
    },
    {
      id: 'sheets',
      format: 'sheets' as OfficeDocumentFormat,
      label: '데이터 표',
      desc: '=SUM() 인터랙티브 시트',
      icon: Table,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      activeColor: 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
      isFormat: true,
      onClick: () => onChangeFormat('sheets')
    },
    {
      id: 'minutes',
      format: 'minutes' as OfficeDocumentFormat,
      label: '회의록 및 할 일',
      desc: 'STT 전사 및 액션 아이템',
      icon: Mic,
      color: 'from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
      activeColor: 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      isFormat: true,
      onClick: () => onChangeFormat('minutes')
    },
    {
      id: 'briefing',
      format: 'briefing' as OfficeDocumentFormat,
      label: '브리핑 리포트',
      desc: '경영진 1-Page 핵심 요약',
      icon: FileCheck,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
      activeColor: 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
      isFormat: true,
      onClick: () => onChangeFormat('briefing')
    }
  ];

  const { themeConfig } = useSparkTheme();

  return (
    <div className={`w-[340px] sm:w-[380px] h-full flex flex-col ${themeConfig.panelBg} ${themeConfig.panelText} border-l ${themeConfig.panelBorder} shrink-0 z-20 shadow-xl select-none transition-colors duration-200`}>
      
      {/* 1. 스튜디오 헤더: "스튜디오" 타이틀 + 접기 아이콘 */}
      <div className={`h-12 px-4 border-b ${themeConfig.panelBorder} flex items-center justify-between shrink-0 ${themeConfig.headerBg}`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${themeConfig.accentBg} ${themeConfig.accentBorder} border`}>
            <Sparkles className={`w-4 h-4 ${themeConfig.accentText}`} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm font-extrabold ${themeConfig.textPrimary}`}>스튜디오</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${themeConfig.pillBg} ${themeConfig.accentText} border ${themeConfig.pillBorder}`}>
                NotebookLM
              </span>
            </div>
            <p className={`text-[10px] ${themeConfig.panelSubtext}`}>통합 멀티모달 산출물 생성 허브</p>
          </div>
        </div>

        {/* 접기 버튼 */}
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition cursor-pointer ${themeConfig.panelHover}`}
          title="스튜디오 패널 접기"
        >
          <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-200" />
        </button>
      </div>

      {/* 2. 스튜디오 8대 출력 생성기 아코디언 (접기/펼치기 토글) */}
      <div className={`border-b ${themeConfig.panelBorder} ${themeConfig.pillBg} shrink-0`}>
        <button
          onClick={() => setIsGeneratorsCollapsed(!isGeneratorsCollapsed)}
          className="w-full p-3 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider hover:bg-slate-100/70 dark:hover:bg-zinc-900/60 transition cursor-pointer"
          title={isGeneratorsCollapsed ? '8대 포맷 펼치기' : '8대 포맷 접기 (대화창 공간 극대화)'}
        >
          <div className="flex items-center space-x-1.5">
            <span>출력물 원클릭 변환기 (8대 포맷)</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-200/50 dark:border-indigo-800/50">
              {isGeneratorsCollapsed ? '미니바' : '1:1 동기화'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400 dark:text-zinc-500">
            <span className="text-[10px] font-normal">{isGeneratorsCollapsed ? '펼치기' : '접기'}</span>
            {isGeneratorsCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {isGeneratorsCollapsed ? (
          /* 접힘 상태: 1줄 컴팩트 미니 아이콘 바 */
          <div className="px-3 pb-2.5 pt-0.5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-fadeIn">
            {STUDIO_GENERATORS.map(gen => {
              const Icon = gen.icon;
              const isActive = gen.isFormat && currentFormat === gen.format;
              return (
                <button
                  key={gen.id}
                  onClick={gen.onClick}
                  className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] border-[var(--accent-color)] shadow-xs font-bold ring-1 ring-[var(--accent-color)]/30' 
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]'
                  }`}
                  title={`${gen.label} (${gen.desc})`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        ) : (
          /* 펼침 상태: 2열 카드 그리드 */
          <div className="px-3 pb-3 pt-0.5 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              {STUDIO_GENERATORS.map(gen => {
                const Icon = gen.icon;
                const isActive = gen.isFormat && currentFormat === gen.format;

                return (
                  <button
                    key={gen.id}
                    onClick={gen.onClick}
                    className={`
                      p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden
                      ${isActive
                        ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] border-[var(--accent-color)] shadow-sm font-bold'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-color)]/40 hover:shadow-xs'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1.5 rounded-xl border ${gen.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30" />
                      )}
                    </div>

                    <div>
                      <div className={`text-xs font-semibold truncate ${isActive ? 'text-[var(--accent-color)]' : 'text-slate-900 dark:text-slate-100'}`}>
                        {gen.label}
                      </div>
                      <div className={`text-xs truncate mt-0.5 ${isActive ? 'text-[var(--accent-color)]/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        {gen.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 코파일럿 대화창 및 실시간 조작부 (스크롤 메시지 + 음성 STT + 채팅 인풋) */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* 상단 액션바: 되돌리기 & 자동 저장 상태 */}
        <div className="px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-app)] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-secondary)]">
            <Bot className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            <span>실시간 캔버스 편집 조율</span>
          </div>

          {canUndo && (
            <button
              onClick={onUndo}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer"
              title={`되돌리기: ${lastActionName || ''}`}
            >
              <Undo2 className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
              <span>되돌리기</span>
            </button>
          )}
        </div>

        {/* 메시지 히스토리 스크롤 영역 */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-2.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[var(--accent-color)] text-white rounded-br-xs shadow-xs'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-xs border border-[var(--border-color)] shadow-xs'
                }`}
              >
                {msg.text}
              </div>
              {msg.appliedAction && (
                <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{msg.appliedAction}</span>
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center space-x-2 p-2.5 bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-2xl rounded-bl-xs text-xs w-fit animate-pulse border border-[var(--border-color)] shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)] shrink-0" />
              <span>캔버스 상태 분석 및 실시간 변이 중...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 빠른 추천 프롬프트 칩들 */}
        <div className="px-3 py-1.5 border-t border-[var(--border-color)] flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0 bg-[var(--bg-app)]">
          {[
            '지금 서류 내용을 스마트 시설 유지 관리로 바꿔줘',
            '지금 내용을 AI 에이전트 도입으로 바꿔봐',
            '제목을 아래 내용에 맞게 적당하게 해줘',
            '제목 두 줄로 나눠줘',
            '결재란 팀장 대신 본부장으로 바꿔줘',
            '표에 비목 추가 및 =SUM 계산'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)]/40 transition cursor-pointer whitespace-nowrap shrink-0 border border-[var(--border-color)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* 입력 및 음성 컨트롤 풋터 */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-1.5"
          >
            {/* 음성(STT) 마이크 토글 */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 border ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                  : 'bg-[var(--bg-card)] hover:opacity-80 text-[var(--text-secondary)] border-[var(--border-color)]'
              }`}
              title={isListening ? '음성 듣는 중... 클릭하여 중지' : '음성(STT)으로 말하기'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* 텍스트 입력창 */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isThinking ? '캔버스 변이 진행 중...' : '스튜디오에 질문하거나 캔버스 변경 요청...'}
              disabled={isThinking}
              className="flex-1 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 text-xs px-3 py-2 rounded-xl border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent-color)] disabled:opacity-60"
            />

            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2 rounded-xl bg-[var(--accent-color)] hover:opacity-90 disabled:opacity-30 text-white transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="전송"
            >
              {isThinking ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
