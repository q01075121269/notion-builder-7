import React, { useState, useRef, useEffect } from 'react';
import type { OfficeDocument, SheetRow, DocSection } from '../../types/office';
import { 
  Sparkles, 
  Send, 
  Mic, 
  RotateCcw, 
  ChevronDown, 
  Bot, 
  CheckCircle2,
  Table,
  FileText
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  appliedAction?: string;
}

interface InPlaceCopilotProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  lastActionName?: string;
}

export const InPlaceCopilot: React.FC<InPlaceCopilotProps> = ({
  document,
  onChangeDocument,
  onUndo,
  canUndo,
  lastActionName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: '안녕하세요! 오피스 인플레이스 코파일럿입니다. 문서 요약, 시트 표 항목 추가, 공문서 개조식 어조 변환 등을 실시간으로 처리해 드릴 수 있습니다.',
      timestamp: '방금 전'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // 음성 STT 핸들러
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('브라우저에서 Web Speech API를 지원하지 않습니다.');
      return;
    }

    if (!isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setInputText(text);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  // 명령어 및 프롬프트 처리
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // 시뮬레이션 명령어 라우팅
    setTimeout(() => {
      processCommand(query);
    }, 400);
  };

  const processCommand = (query: string) => {
    const lower = query.toLowerCase();

    // 1. "표에 '외주비 150만 원' 추가해줘" 또는 시트 행 추가 명령어
    if (lower.includes('외주비') || (lower.includes('표') && lower.includes('추가')) || lower.includes('시트')) {
      const newRow: SheetRow = {
        id: `row-copilot-${Date.now()}`,
        cells: ['전문 외주용역비', 'AI 오피스 캔버스 커스텀 개발 외주비', '건', 1, 1500000, 1500000]
      };

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          sheetsContent: {
            ...document.content.sheetsContent,
            rows: [...document.content.sheetsContent.rows, newRow]
          }
        }
      };

      onChangeDocument(updatedDoc, "스프레드시트에 '외주비 150만 원' 실시간 행 추가");

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "스프레드시트에 '전문 외주용역비 (1,500,000원)' 행을 즉시 추가하고 =SUM() 총액을 자동 재연산했습니다. [⏪ 되돌리기] 버튼으로 언제든 롤백 가능합니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '시트 행 추가 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 2. "공문서 말투로 바꿔줘" 또는 어조 변환 명령어
    if (lower.includes('말투') || lower.includes('공문서') || lower.includes('어조') || lower.includes('개조식')) {
      const convertedSections: DocSection[] = document.content.docsContent.sections.map(sec => {
        let txt = sec.text;
        // 문장 끝을 ~함., ~보고함., ~추진함. 으로 정형화
        if (!txt.endsWith('함.') && !txt.endsWith('임.') && !txt.endsWith('음.')) {
          txt = txt.replace(/합니다\.|합니다|이다\.|이다/g, '함.').trim();
          if (!txt.endsWith('.') && !txt.endsWith(']')) txt += '함.';
        }
        return { ...sec, text: txt };
      });

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          docsContent: {
            sections: convertedSections
          }
        }
      };

      onChangeDocument(updatedDoc, '공문서 개조식 어조(~함) 일괄 변환');

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "공문서 본문의 모든 문장을 공공 표준 개조식 종결어미('~함.', '~보고함.')로 정밀 변환 완료했습니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '공문서 어조 변환 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 3. 일반 질의 및 분석
    const aiMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `질문하신 내용("${query}")을(를) 현재 활성 지식 창고 3건과 대조 분석했습니다. 필요 시 3-Way 기획안과 기안서 양식에 즉시 반영할 수 있습니다. 추가 작업을 지시해 주세요.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      
      {/* 1. 접혀있을 때 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold shadow-2xl border border-indigo-400/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          title="인플레이스 코파일럿 열기"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-xs sm:text-sm tracking-tight">AI 오피스 코파일럿</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* 2. 열려있을 때 구글 닥스/시트 Gemini 패널 스타일 대화창 */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-fadeIn">
          
          {/* 헤더 */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="text-xs font-black tracking-tight flex items-center gap-1.5">
                  <span>In-Place Copilot</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono">2026</span>
                </h3>
                <p className="text-[10px] text-indigo-100 opacity-90 truncate">
                  {document.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* 상시 되돌리기 (Undo) 버튼 */}
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30 disabled:opacity-30 text-[11px] font-bold text-white transition cursor-pointer"
                title={canUndo ? `되돌리기: ${lastActionName}` : '되돌릴 작업 없음'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>되돌리기</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
                title="패널 접기"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 추천 퀵 프롬프트 칩들 */}
          <div className="p-2 bg-slate-50 dark:bg-zinc-850/70 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <button
              onClick={() => handleSendMessage("표에 '외주비 150만 원' 추가해줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer"
            >
              <Table className="w-3 h-3 text-emerald-500" />
              <span>외주비 150만원 추가</span>
            </button>

            <button
              onClick={() => handleSendMessage("공문서 말투로 바꿔줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer"
            >
              <FileText className="w-3 h-3 text-blue-500" />
              <span>공문서 말투 변환</span>
            </button>
          </div>

          {/* 대화 내역 (스크롤) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-zinc-900/50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-xs border border-slate-200 dark:border-zinc-750'
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {msg.appliedAction && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-700/80 flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{msg.appliedAction}</span>
                    </div>
                  )}

                  <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 하단 입력 폼 */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600'
                }`}
                title="음성으로 명령하기"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="명령어 또는 AI 수정 요청 입력..."
                className="flex-1 py-2 px-3 text-xs bg-slate-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
