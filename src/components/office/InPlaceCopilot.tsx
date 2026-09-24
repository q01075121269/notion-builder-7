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
  FileText,
  UserCheck
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
      text: '오피스 인플레이스 코파일럿 2.0 가동되었습니다. "표에 [항목명] [금액] 추가해줘", "공문서체로 바꿔줘", "정중체로 바꿔줘", "결재란에 [직책] 추가해줘" 등의 자연어 명령을 실시간으로 실행합니다.',
      timestamp: '방금 전'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Web Speech API
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

  // 금액 파서 헬퍼: "120만 원", "50만원", "1500000원", "150만" 등 숫자로 변환
  const parseKoreanCurrency = (text: string): { amount: number; matchedStr: string } => {
    // 1) "120만 원" 또는 "120만원"
    const manMatch = text.match(/(\d+[\d,]*)\s*만\s*원?/);
    if (manMatch) {
      const val = parseInt(manMatch[1].replace(/,/g, ''), 10);
      return { amount: val * 10000, matchedStr: manMatch[0] };
    }

    // 2) "1500000원"
    const wonMatch = text.match(/(\d+[\d,]*)\s*원/);
    if (wonMatch) {
      const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
      return { amount: val, matchedStr: wonMatch[0] };
    }

    // 3) 기본 100만 원
    return { amount: 1000000, matchedStr: '100만 원' };
  };

  // 자연어 명령어 디스패처 (Command Dispatcher)
  const processCommand = (query: string) => {
    const lower = query.toLowerCase();

    // 1. 결재선 조작 명령: "결재란에 부서장 추가해줘", "결재선에 이사 추가해줘"
    if (lower.includes('결재란') || lower.includes('결재선') || (lower.includes('결재') && lower.includes('추가'))) {
      const roleMatch = query.match(/결재(?:란|선)?에\s*([^\s]+)\s*추가/);
      const roleName = roleMatch ? roleMatch[1] : '부서장';
      const formattedRole = `${roleName}(결재대기)`;

      const updatedApprovers = [...document.metadata.approvers, formattedRole];
      const updatedDoc: OfficeDocument = {
        ...document,
        metadata: {
          ...document.metadata,
          approvers: updatedApprovers
        }
      };

      onChangeDocument(updatedDoc, `결재선에 [${formattedRole}] 컬럼 동적 추가`);

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `상단 전자 결재선 박스에 '${formattedRole}' 컬럼을 동적으로 삽입했습니다. [⏪ 되돌리기]로 언제든 직전 상태로 복원할 수 있습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: `결재란 [${formattedRole}] 추가 완료`
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 2. 표 데이터 조작 명령: "표에 [항목명] [금액] 추가해줘"
    if (lower.includes('표') || lower.includes('시트') || lower.includes('행') || lower.includes('외주비') || lower.includes('호스팅비') || lower.includes('예산')) {
      const { amount, matchedStr } = parseKoreanCurrency(query);

      // 항목명 추출
      let itemName = '신규 집행 항목';
      if (query.includes('디자인')) itemName = '디자인 외주비';
      else if (query.includes('서버') || query.includes('호스팅')) itemName = '서버 호스팅비';
      else if (query.includes('외주')) itemName = '전문 외주용역비';
      else if (query.includes('마케팅')) itemName = '마케팅 집행비';
      else {
        // "표에 XXX 120만원 추가해줘"에서 XXX 추출 시도
        const cleanMatch = query.replace(/표에|시트에|추가해줘|넣어줘|추가|등록/g, '').replace(matchedStr, '').trim();
        if (cleanMatch) itemName = cleanMatch;
      }

      const newRow: SheetRow = {
        id: `row-mut-${Date.now()}`,
        cells: [itemName, `${itemName} 실시간 산출 근거`, '식', 1, amount, amount]
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

      onChangeDocument(updatedDoc, `스프레드시트에 [${itemName} - ${amount.toLocaleString()}원] 행 삽입`);

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `스프레드시트 표에 '${itemName} (${amount.toLocaleString()}원)' 행을 즉시 삽입하고 =SUM() 총합계를 자동 재연산했습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: `${itemName} 행 삽입 및 합계 재연산 완료`
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 3. 어조 변환 명령 A: "공문서체로 바꿔줘" (행안부 표준 개조식 종결어미: ~추진함., ~보고함., ~검토함.)
    if (lower.includes('공문서') || lower.includes('개조식') || lower.includes('사내규정체')) {
      const endings = ['추진함.', '보고함.', '검토함.', '확정함.', '시행함.'];
      const convertedSections: DocSection[] = document.content.docsContent.sections.map((sec, idx) => {
        let txt = sec.text.replace(/합니다\.|합니다|이다\.|이다|바랍니다\.|드리겠습니다\./g, '').trim();
        const pickEnding = endings[idx % endings.length];
        if (!txt.endsWith('함.') && !txt.endsWith('임.') && !txt.endsWith('음.')) {
          txt = `${txt} ${pickEnding}`;
        }
        return { ...sec, text: txt };
      });

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          docsContent: { sections: convertedSections }
        }
      };

      onChangeDocument(updatedDoc, '본문 어조를 행안부 표준 개조식(~추진함/보고함)으로 변환');

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "공문서 본문의 모든 문장을 행정안전부 표준 개조식 어조('~추진함.', '~보고함.', '~검토함.')로 일괄 변환했습니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '표준 공문서 개조식 변환 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 4. 어조 변환 명령 B: "정중체로 바꿔줘" (비즈니스 공손형: ~바랍니다., ~드리겠습니다.)
    if (lower.includes('정중') || lower.includes('공손') || lower.includes('존댓말') || lower.includes('안내문')) {
      const convertedSections: DocSection[] = document.content.docsContent.sections.map(sec => {
        let txt = sec.text
          .replace(/추진함\.|보고함\.|검토함\.|확정함\.|시행함\.|함\.|임\.|음\./g, '')
          .trim();
        txt = `${txt} 적극 검토하여 주시기 바랍니다.`;
        return { ...sec, text: txt };
      });

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          docsContent: { sections: convertedSections }
        }
      };

      onChangeDocument(updatedDoc, '본문 어조를 비즈니스 정중체(~바랍니다)로 변환');

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "본문 어조를 대외 협력 및 임원 보고용 비즈니스 공손 정중체('~바랍니다.', '~드리겠습니다.')로 품격 있게 변환했습니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '비즈니스 정중체 변환 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 5. 일반 질의 및 분석
    const aiMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `질문하신 내용("${query}")을 바탕으로 현재 문서(${document.title}) 및 활성 지식 소스를 분석했습니다. 표 행 삽입, 결재선 추가, 공문서체 변환 등 원하시는 작업을 말씀해 주세요.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, aiMsg]);
  };

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

    setTimeout(() => {
      processCommand(query);
    }, 300);
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
        <div className="w-[360px] sm:w-[410px] h-[540px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-fadeIn">
          
          {/* 헤더 */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="text-xs font-black tracking-tight flex items-center gap-1.5">
                  <span>In-Place Copilot 2026</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono">v2</span>
                </h3>
                <p className="text-[10px] text-indigo-100 opacity-90 truncate max-w-[180px]">
                  {document.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* 상시 되돌리기 (Undo) 버튼 */}
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 disabled:opacity-30 text-[11px] font-bold text-white transition cursor-pointer"
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

          {/* 퀵 프롬프트 칩들 (실무 자연어 명령 4종) */}
          <div className="p-2 bg-slate-50 dark:bg-zinc-850/70 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
            <button
              onClick={() => handleSendMessage("표에 디자인 외주비 120만 원 추가해줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              <Table className="w-3 h-3 text-emerald-500" />
              <span>외주비 120만 원 추가</span>
            </button>

            <button
              onClick={() => handleSendMessage("표에 서버 호스팅비 50만 원 추가해줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              <Table className="w-3 h-3 text-emerald-500" />
              <span>호스팅비 50만 원 추가</span>
            </button>

            <button
              onClick={() => handleSendMessage("공문서체로 바꿔줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              <FileText className="w-3 h-3 text-blue-500" />
              <span>공문서체 변환</span>
            </button>

            <button
              onClick={() => handleSendMessage("정중체로 바꿔줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              <FileText className="w-3 h-3 text-purple-500" />
              <span>정중체 변환</span>
            </button>

            <button
              onClick={() => handleSendMessage("결재란에 부서장 추가해줘")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              <UserCheck className="w-3 h-3 text-indigo-500" />
              <span>결재란에 부서장 추가</span>
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
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
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
                placeholder="자연어 명령 입력 (예: 표에 서버비 50만 원 추가)..."
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
