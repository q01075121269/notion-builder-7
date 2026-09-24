import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Trash2, 
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { ChatSession } from '../../services/chatStorage';
import { groupSessionsByDate } from '../../services/chatStorage';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const { today, past7Days, past30Days, older } = groupSessionsByDate(sessions);

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 (오버레이) */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 좌측 슬라이드 서랍 패널 */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 select-none">
        {/* 서랍 헤더 */}
        <div className="p-4 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-950/40">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">대화 기록</h3>
              <p className="text-[10px] text-neutral-500">Co-Thinking 히스토리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 최상단: [+ 새 대화 시작] 버튼 */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            <span>+ 새 대화 시작</span>
          </button>
        </div>

        {/* 본문 세션 히스토리 목록 (날짜별 그룹화) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p>저장된 대화 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 오늘 */}
              {today.length > 0 && (
                <SessionGroupSection
                  title="오늘"
                  icon={Sparkles}
                  sessions={today}
                  activeSessionId={activeSessionId}
                  onSelectSession={onSelectSession}
                  onDeleteSession={onDeleteSession}
                />
              )}

              {/* 지난 7일 */}
              {past7Days.length > 0 && (
                <SessionGroupSection
                  title="지난 7일"
                  icon={Clock}
                  sessions={past7Days}
                  activeSessionId={activeSessionId}
                  onSelectSession={onSelectSession}
                  onDeleteSession={onDeleteSession}
                />
              )}

              {/* 지난 30일 */}
              {past30Days.length > 0 && (
                <SessionGroupSection
                  title="지난 30일"
                  icon={Calendar}
                  sessions={past30Days}
                  activeSessionId={activeSessionId}
                  onSelectSession={onSelectSession}
                  onDeleteSession={onDeleteSession}
                />
              )}

              {/* 이전 */}
              {older.length > 0 && (
                <SessionGroupSection
                  title="이전 대화"
                  icon={Calendar}
                  sessions={older}
                  activeSessionId={activeSessionId}
                  onSelectSession={onSelectSession}
                  onDeleteSession={onDeleteSession}
                />
              )}
            </>
          )}
        </div>

        {/* 서랍 하단 정보 */}
        <div className="p-3 border-t border-slate-200/80 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/40 text-center">
          <p className="text-[10px] text-neutral-400">
            대화는 브라우저 localStorage에 안전하게 보관됩니다.
          </p>
        </div>
      </aside>
    </>
  );
};

interface SessionGroupSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const SessionGroupSection: React.FC<SessionGroupSectionProps> = ({
  title,
  icon: IconComp,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-1.5 px-2 py-1 text-[11px] font-bold text-neutral-400 tracking-wider">
        <IconComp className="w-3 h-3 text-amber-500" />
        <span>{title}</span>
      </div>

      <div className="space-y-0.5">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-500' : 'text-neutral-400'}`} />
                <span className="truncate max-w-[150px]">{session.title || '대화 기획'}</span>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  title="대화 삭제"
                  className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
