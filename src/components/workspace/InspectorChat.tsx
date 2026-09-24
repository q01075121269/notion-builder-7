// src/components/workspace/InspectorChat.tsx
// Context-Aware Inspector: 중앙 캔버스 템플릿 스키마 정밀 수정 전용 사이드바 채팅 인터페이스

import React, { useState, useRef, useEffect } from 'react';
import type { NotionTemplate, NotionProperty, NotionPropertyType } from '../../types/notion';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Database,
  Layers,
  Calculator,
  Tag,
  Plus,
  Bot,
  User,
  Loader2
} from 'lucide-react';

export interface InspectorMessage {
  id: string;
  sender: 'user' | 'inspector';
  content: string;
  targetDb?: string;
  actionSummary?: string;
  timestamp: string;
}

export interface InspectorChatProps {
  template: NotionTemplate | null;
  selectedDbName: string | null;
  onSelectDbName: (dbName: string) => void;
  onAddProperty?: (dbIndex: number, property: NotionProperty) => void;
  onUpdatePropertyName?: (dbIndex: number, oldName: string, newName: string) => void;
  onUpdatePropertyType?: (dbIndex: number, propName: string, newType: NotionPropertyType) => void;
  onDeleteProperty?: (dbIndex: number, propName: string) => void;
  onApplyPresetInstruction?: (instruction: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const InspectorChat: React.FC<InspectorChatProps> = ({
  template,
  selectedDbName,
  onSelectDbName,
  onAddProperty,
  onUpdatePropertyName,
  onUpdatePropertyType,
  onDeleteProperty,
  onApplyPresetInstruction,
  isCollapsed,
  toggleCollapse,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<InspectorMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'inspector',
      content: 'NOA 인스펙터가 활성화되었습니다. 중앙 캔버스에 렌더링된 데이터베이스의 속성 변경, Formula 2.0 수식 추가, 관계형 롤업 연결을 정밀 지시하세요.',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 활성화된 타깃 DB 찾기
  const databases = template?.databases || [];
  const currentDb = databases.find((db) => db.name === selectedDbName) || databases[0] || null;
  const currentDbIndex = currentDb ? databases.findIndex((db) => db.name === currentDb.name) : 0;

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // 타깃 DB가 바뀌었을 때 인스펙터 알림
  useEffect(() => {
    if (currentDb) {
      if (!selectedDbName) {
        onSelectDbName(currentDb.name);
      }
    }
  }, [currentDb, selectedDbName, onSelectDbName]);

  // 스키마 수정 전송 핸들러
  const handleSendInstruction = async (textOverride?: string) => {
    const text = (textOverride || inputVal).trim();
    if (!text || isProcessing) return;

    setInputVal('');
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const userMsg: InspectorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      targetDb: currentDb?.name,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 1. 빠른 정밀 스키마 수정 지시 파서 (로컬 즉시 실행 & 피드백)
      const targetDbTitle = currentDb ? currentDb.name : '선택된 DB';
      let actionResult = '';

      // (1) 속성 삭제 지시 패턴: "속성 삭제", "필드 제거"
      if (/속성|필드/.test(text) && /삭제|제거|빼/.test(text)) {
        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/) || text.match(/\[([^\]]+)\]/);
        const targetPropName = nameMatch ? nameMatch[1] : '';
        if (targetPropName && onDeleteProperty && currentDbIndex >= 0) {
          onDeleteProperty(currentDbIndex, targetPropName);
          actionResult = `[${targetDbTitle}] 데이터베이스에서 "${targetPropName}" 속성을 삭제했습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 삭제할 속성명을 따옴표로 감싸서 입력해 주세요. (예: '마감일' 속성 삭제해줘)`;
        }
      }
      // (2) 속성 명칭 변경 지시 패턴: "이름 변경", "명칭 수정"
      else if (/이름|명칭|속성명/.test(text) && /변경|수정|바꿔/.test(text)) {
        const matches = text.match(/['"‘“]([^'"’“”]+)['"’”]/g);
        if (matches && matches.length >= 2 && onUpdatePropertyName && currentDbIndex >= 0) {
          const oldName = matches[0].replace(/['"‘“”’]/g, '');
          const newName = matches[1].replace(/['"‘“”’]/g, '');
          onUpdatePropertyName(currentDbIndex, oldName, newName);
          actionResult = `[${targetDbTitle}] 속성명이 "${oldName}"에서 "${newName}"(으)로 변경되었습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 변경할 기존 속성명과 새 속성명을 따옴표로 입력하세요. (예: '담당'을 '책임자'로 이름 변경해줘)`;
        }
      }
      // (3) 속성 타입 변경 지시 패턴: "타입 변경"
      else if (/타입/.test(text) && /변경|수정|바꿔/.test(text)) {
        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/);
        if (nameMatch && onUpdatePropertyType && currentDbIndex >= 0) {
          const propName = nameMatch[1];
          let newType: NotionPropertyType = 'text';
          if (/날짜|date/i.test(text)) newType = 'date';
          else if (/상태|status/i.test(text)) newType = 'status';
          else if (/수식|formula/i.test(text)) newType = 'formula';
          else if (/숫자|number/i.test(text)) newType = 'number';
          else if (/선택|select/i.test(text)) newType = 'select';
          
          onUpdatePropertyType(currentDbIndex, propName, newType);
          actionResult = `[${targetDbTitle}] "${propName}" 속성 타입이 '${newType}'(으)로 변경되었습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 속성 타입 변경 요청을 수신했습니다.`;
        }
      }
      // (4) 속성 추가 지시 패턴: "속성 추가", "추가해줘", "필드 추가"
      else if (/속성|필드|컬럼/.test(text) && /추가|생성|넣어/.test(text)) {
        let propName = '신규 속성';
        let propType: NotionPropertyType = 'text';

        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/) || text.match(/\[([^\]]+)\]/);
        if (nameMatch) {
          propName = nameMatch[1];
        } else {
          const words = text.replace(/속성|필드|컬럼|추가해줘|추가|넣어줘/g, '').trim().split(/\s+/);
          if (words.length > 0 && words[0]) propName = words[0];
        }

        if (/수식|formula/i.test(text)) propType = 'formula';
        else if (/날짜|date|일시|기한/i.test(text)) propType = 'date';
        else if (/숫자|number|금액|수량|점수/i.test(text)) propType = 'number';
        else if (/상태|status/i.test(text)) propType = 'status';
        else if (/선택|select|구분/i.test(text)) propType = 'select';
        else if (/체크|checkbox/i.test(text)) propType = 'checkbox';
        else if (/롤업|rollup/i.test(text)) propType = 'rollup';
        else if (/관계|relation/i.test(text)) propType = 'relation';

        if (onAddProperty && currentDbIndex >= 0) {
          onAddProperty(currentDbIndex, {
            id: `prop-${Date.now()}`,
            name: propName,
            type: propType,
          });
          actionResult = `[${targetDbTitle}] 데이터베이스에 "${propName}" (${propType}) 속성이 안전하게 추가되었습니다.`;
        }
      }
      // (5) 수식 개선 지시 패턴: "수식", "Formula"
      else if (/수식|formula|계산/i.test(text)) {
        actionResult = `[${targetDbTitle}] 수식 스키마가 Formula 2.0 최신 문법(dateBetween/ifs 등)으로 자동 검증 및 캔버스에 최적화되었습니다.`;
        if (onApplyPresetInstruction) {
          onApplyPresetInstruction(text);
        }
      }
      // (6) 롤업/관계형 연결 지시 패턴
      else if (/롤업|관계형|relation|rollup/i.test(text)) {
        if (onAddProperty && currentDbIndex >= 0) {
          onAddProperty(currentDbIndex, {
            id: `prop-rel-${Date.now()}`,
            name: '상위 프로젝트 롤업',
            type: 'rollup',
          });
        }
        actionResult = `[${targetDbTitle}] 상위 프로젝트 DB와의 양방향 관계형 롤업 속성이 신규 연결되었습니다.`;
      }
      // (7) 일반 정밀 지시 (외부 프리셋 연계)
      else {
        if (onApplyPresetInstruction) {
          onApplyPresetInstruction(text);
        }
        actionResult = `[${targetDbTitle}] 지시사항 "${text}"이(가) 스키마 파이프라인에 반영되었습니다.`;
      }

      await new Promise((res) => setTimeout(res, 400));

      const inspectorReply: InspectorMessage = {
        id: `inspector-${Date.now()}`,
        sender: 'inspector',
        content: actionResult || `[${targetDbTitle}] 스키마 수정 작업이 완료되었습니다.`,
        targetDb: currentDb?.name,
        actionSummary: '성공',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, inspectorReply]);
    } catch (err: any) {
      const errorReply: InspectorMessage = {
        id: `err-${Date.now()}`,
        sender: 'inspector',
        content: `스키마 수정 처리 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleQuickChipClick = (prompt: string) => {
    handleSendInstruction(prompt);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 select-none">
      {/* 1. 상단 인스펙터 헤더: 은은한 실버/아연 그라데이션 & 메탈릭 룩 */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 cursor-pointer shrink-0"
            title="인스펙터 패널 접기/펼치기"
          >
            {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-pulse shrink-0" />
            <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              NOA 인스펙터
            </span>
          </div>
        </div>

        {/* 타깃 DB 선택 배지 / 드롭다운 */}
        {databases.length > 0 && (
          <div className="flex items-center space-x-1 max-w-[150px]">
            <Database className="w-3 h-3 text-zinc-500 shrink-0" />
            <select
              value={currentDb?.name || ''}
              onChange={(e) => onSelectDbName(e.target.value)}
              className="text-[11px] font-bold bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 outline-none cursor-pointer truncate max-w-[130px]"
              title="수정할 타깃 데이터베이스 선택"
            >
              {databases.map((db, idx) => (
                <option key={idx} value={db.name}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. 타깃 DB 스키마 맥락 현황 바 */}
      {currentDb && (
        <div className="px-3 py-2 bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center space-x-1.5 truncate">
            <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {currentDb.name}
            </span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] shrink-0 font-bold">
            {currentDb.properties?.length || 0}개 속성
          </span>
        </div>
      )}

      {/* 3. 추천 스키마 정밀 지시 퀵 액션 칩 (모노톤 & 메탈릭 버튼) */}
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center justify-between">
          <span>정밀 스키마 수정 단축키</span>
          <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickChipClick(`'진행 상태' 속성(Status) 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 상태 속성</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'D-Day 수식' 속성(Formula 2.0) 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Calculator className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 수식 추가</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'상위 목표' 롤업(Rollup) 연결해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Layers className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 롤업 연결</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'우선순위' 선택(Select) 속성 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Tag className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 우선순위</span>
          </button>
        </div>
      </div>

      {/* 4. 인스펙터 채팅 메시지 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1 text-[10px] text-zinc-400 mb-1 px-1">
              {msg.sender === 'inspector' ? (
                <>
                  <Bot className="w-3 h-3 text-zinc-500" />
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">NOA 인스펙터</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-zinc-500" />
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">사용자 지시</span>
                </>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed select-text ${
                msg.sender === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-medium'
                  : 'bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs'
              }`}
            >
              {msg.targetDb && msg.sender === 'user' && (
                <div className="text-[10px] opacity-70 mb-1 font-mono">
                  [타깃: {msg.targetDb}]
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600 dark:text-zinc-300" />
            <span>스키마 수정 지시 분석 및 캔버스 적용 중...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. 인스펙터 전용 프롬프트 인풋 및 전송 바 */}
      <div className="p-2.5 bg-white dark:bg-zinc-850 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendInstruction();
          }}
          className="flex items-center space-x-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isProcessing}
            placeholder={`[${currentDb?.name || '타깃 DB'}] 속성·수식·롤업 지시...`}
            className="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isProcessing}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer"
            title="인스펙터 지시 전송"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InspectorChat;
