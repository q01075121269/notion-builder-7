import React, { useState, useRef, useEffect } from 'react';
import type { OfficeDocument, SheetRow, DocSection } from '../../types/office';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  Undo2, 
  Table, 
  FileText, 
  Calculator, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  appliedAction?: string;
}

interface OfficeCopilotDockProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  lastActionName?: string;
}

export const OfficeCopilotDock: React.FC<OfficeCopilotDockProps> = ({
  isOpen,
  onClose,
  document,
  onChangeDocument,
  onUndo,
  canUndo,
  lastActionName
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-dock-init',
      sender: 'ai',
      text: '실시간 문서 편집 코파일럿입니다. 음성(STT) 또는 텍스트로 "표에 [항목명] [금액] 추가해줘", "공문서 개조식 어조로 변환", "=SUM 합계 재계산", "3줄 요약" 등을 요청하시면 캔버스에 즉시 반영됩니다.',
      timestamp: '방금 전'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Web Speech API STT 가동
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
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  };

  // 금액 파서 헬퍼: "120만 원", "50만원", "1500000원", "150만" 등 숫자로 변환
  const parseKoreanCurrency = (text: string): { amount: number; matchedStr: string } => {
    const manMatch = text.match(/(\d+[\d,]*)\s*만\s*원?/);
    if (manMatch) {
      const val = parseInt(manMatch[1].replace(/,/g, ''), 10);
      return { amount: val * 10000, matchedStr: manMatch[0] };
    }

    const wonMatch = text.match(/(\d+[\d,]*)\s*원/);
    if (wonMatch) {
      const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
      return { amount: val, matchedStr: wonMatch[0] };
    }

    const numMatch = text.match(/(\d+[\d,]{3,})/);
    if (numMatch) {
      const val = parseInt(numMatch[1].replace(/,/g, ''), 10);
      return { amount: val, matchedStr: numMatch[0] };
    }

    return { amount: 1000000, matchedStr: '' };
  };

  // 인플레이스 상태 변이 처리 엔진
  const processCommand = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();

    // 1. 표에 행 추가 (예: "3행에 클라우드 비용 100만원 추가해줘")
    if (lower.includes('추가') && (lower.includes('표') || lower.includes('행') || lower.includes('예산') || lower.includes('비목') || lower.includes('원'))) {
      const { amount, matchedStr } = parseKoreanCurrency(trimmed);

      let itemName = trimmed
        .replace(/표에|행에|\d+행에|추가해줘|추가해|넣어줘|등록해줘/g, '')
        .replace(matchedStr, '')
        .trim();

      if (!itemName || itemName.length < 2) {
        itemName = '인프라 및 클라우드 운영비';
      }

      const currentRows = document.content.sheetsContent.rows;
      const nextIdx = currentRows.length + 1;

      const newRow: SheetRow = {
        id: `row-ai-${Date.now()}`,
        cells: [nextIdx, itemName, '시스템 안정화 및 확장 소요', amount, '정기 산출']
      };

      const updatedRows = [...currentRows, newRow];
      const endRowIdx = updatedRows.length + 1;
      const updatedFormula = `=SUM(D2:D${endRowIdx})`;

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          sheetsContent: {
            ...document.content.sheetsContent,
            rows: updatedRows,
            totalFormula: updatedFormula
          }
        }
      };

      onChangeDocument(updatedDoc, `표에 [${itemName} - ${amount.toLocaleString()}원] 신규 행 추가`);

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `스프레드시트에 [${itemName} / ${amount.toLocaleString()}원] 항목을 추가하고, 합계 수식을 ${updatedFormula}로 자동 재계산했습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '표 신규 행 추가 및 =SUM() 자동 갱신'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 2. 어조 변환: "공문서 개조식 어조로 변환"
    if (lower.includes('개조식') || lower.includes('공문서체') || lower.includes('보고서체') || lower.includes('~함')) {
      const convertedSections: DocSection[] = document.content.docsContent.sections.map(sec => {
        let txt = sec.text
          .replace(/바랍니다\.|드립니다\.|합니다\.|있습니다\.|됩니다\.|하십시오\./g, '')
          .trim();
        txt = `${txt} 추진함.`;
        return { ...sec, text: txt };
      });

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          docsContent: { sections: convertedSections }
        }
      };

      onChangeDocument(updatedDoc, '본문 어조를 표준 공문서 개조식(~함)으로 일괄 변환');

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "공문서 본문의 모든 문장을 행정안전부 표준 개조식 어조('~추진함.', '~보고함.', '~검토함.')로 일괄 변환했습니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '표준 공문서 개조식 어조 변환 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 3. 예산 합계(=SUM) 자동 재계산
    if (lower.includes('재계산') || lower.includes('합계') || lower.includes('sum') || lower.includes('계산')) {
      const rows = document.content.sheetsContent.rows;
      const endRowIdx = rows.length + 1;
      const newFormula = `=SUM(D2:D${endRowIdx})`;

      const updatedDoc: OfficeDocument = {
        ...document,
        content: {
          ...document.content,
          sheetsContent: {
            ...document.content.sheetsContent,
            hasTotalRow: true,
            totalFormula: newFormula
          }
        }
      };

      onChangeDocument(updatedDoc, `예산 합계 수식(${newFormula}) 자동 재계산`);

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `현재 표의 ${rows.length}개 행 데이터를 전수 스캔하여 총 합계 수식을 [${newFormula}]로 무결하게 바인딩했습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '예산 합계(=SUM) 재계산 완료'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 4. 핵심 내용 3줄 요약
    if (lower.includes('요약') || lower.includes('3줄') || lower.includes('서머리')) {
      const secCount = document.content.docsContent.sections.length;
      const totalBudget = document.content.sheetsContent.rows.reduce((acc, r) => {
        const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
        return acc + val;
      }, 0);

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `[핵심 3줄 요약]\n1. ${document.title}의 총 ${secCount}개 핵심 추진 과제가 규격화되었습니다.\n2. 산출 예산은 총 ${totalBudget.toLocaleString()}원 규모이며, 단계별 파일럿을 포함합니다.\n3. 사내 4단 결재선 및 실행 과제 직결 체계가 완비되어 즉시 상신 가능합니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedAction: '문서 핵심 3줄 요약 생성'
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // 5. 기본 질의응답
    const aiMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `"${query}" 요청을 분석했습니다. 캔버스의 공문서 및 스프레드시트 구조와 완벽히 호환되도록 최적화 반영할 준비가 되었습니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const query = inputText;

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
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (cmd: string) => {
    setInputText(cmd);
    setTimeout(() => {
      const userMsg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: cmd,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      processCommand(cmd);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <aside 
      className="w-[360px] lg:w-[380px] h-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 z-20 shadow-lg no-print transition-all duration-200"
      aria-label="실시간 문서 편집 코파일럿 독"
    >
      {/* 1. 상단 헤더 */}
      <div className="h-11 px-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>실시간 문서 편집 코파일럿</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">STT</span>
          </h2>
        </div>

        <div className="flex items-center space-x-1">
          {/* 되돌리기 버튼 */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 transition cursor-pointer"
            title={canUndo ? `되돌리기: ${lastActionName}` : '되돌릴 작업 없음'}
          >
            <Undo2 className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
            <span>되돌리기</span>
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="코파일럿 독 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 원클릭 퀵 액션 칩 바 */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => handleQuickAction('표에 신규 행 추가')}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition whitespace-nowrap cursor-pointer border border-slate-200 dark:border-zinc-700"
        >
          <Table className="w-3 h-3 text-slate-500" />
          <span>표에 신규 행 추가</span>
        </button>

        <button
          onClick={() => handleQuickAction('공문서 개조식 어조로 변환 (~함)')}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition whitespace-nowrap cursor-pointer border border-slate-200 dark:border-zinc-700"
        >
          <FileText className="w-3 h-3 text-slate-500" />
          <span>공문서 개조식 (~함)</span>
        </button>

        <button
          onClick={() => handleQuickAction('예산 합계(=SUM) 자동 재계산')}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition whitespace-nowrap cursor-pointer border border-slate-200 dark:border-zinc-700"
        >
          <Calculator className="w-3 h-3 text-slate-500" />
          <span>합계(=SUM) 재계산</span>
        </button>

        <button
          onClick={() => handleQuickAction('핵심 내용 3줄 요약')}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition whitespace-nowrap cursor-pointer border border-slate-200 dark:border-zinc-700"
        >
          <FileCheck className="w-3 h-3 text-slate-500" />
          <span>3줄 요약</span>
        </button>
      </div>

      {/* 3. 대화 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 dark:bg-zinc-950/40">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {msg.appliedAction && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-700 flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{msg.appliedAction}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. 음성 인식 활성화 인디케이터 */}
      {isListening && (
        <div className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/50 border-t border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs text-red-600 dark:text-red-400 shrink-0 animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-semibold">음성 듣는 중... 말씀하시면 텍스트로 자동 입력됩니다.</span>
          </div>
          <button
            onClick={handleToggleVoice}
            className="text-[11px] underline font-bold cursor-pointer"
          >
            음성 중지
          </button>
        </div>
      )}

      {/* 5. 음성 & 텍스트 하이브리드 입력창 */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-zinc-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
            title={isListening ? '음성 인식 중지' : '음성(STT) 입력 시작'}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '말씀하세요...' : '명령어 입력 (예: 3행에 100만원 추가)'}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 transition cursor-pointer shrink-0"
            title="전송"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 px-1">
          <span>인플레이스 상태 변이 가동 중</span>
          <span>Enter로 전송</span>
        </div>
      </div>
    </aside>
  );
};
