import React, { useState } from 'react';
import type { OfficeDocument } from '../../../types/office';
import { Mic, CheckSquare, Plus, Trash2, Calendar, Users, Zap, CheckCircle2 } from 'lucide-react';

interface MinutesCanvasProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onSyncToLifeHub?: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  done: boolean;
}

export const MinutesCanvas: React.FC<MinutesCanvasProps> = ({
  document: _document,
  onChangeDocument: _onChangeDocument,
  onSyncToLifeHub
}) => {
  const [meetingTheme, setMeetingTheme] = useState('2026 하반기 오피스 스튜디오 도입 킥오프 회의');
  const [attendees, setAttendees] = useState('김전략 수석, 박팀장, 이본부장, 정개발 선임');
  const [summary, setSummary] = useState(
    'AI 기반 3-Way 기획 도입과 캔버스 실시간 결재 시스템을 4분기 파일럿으로 확정함. 보안 가이드라인 준수를 위해 사내 프록시 게이트웨이 구성을 차주까지 마칠 것.'
  );

  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: 'act-1',
      title: '사내 규정 제45조 보안성 검토 신청서 접수',
      assignee: '김기획',
      dueDate: '2026-09-30',
      done: true
    },
    {
      id: 'act-2',
      title: '3분기 잔여 예산 4,200만 원 집행 품의 올리기',
      assignee: '박팀장',
      dueDate: '2026-10-05',
      done: false
    },
    {
      id: 'act-3',
      title: '라이프 Hub 및 노션 마스터 DB API 테스트 완료',
      assignee: '정개발',
      dueDate: '2026-10-12',
      done: false
    }
  ]);

  const toggleActionDone = (id: string) => {
    setActionItems(items =>
      items.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
  };

  const handleAddAction = () => {
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      title: '새로운 회의 후속 실행 과제',
      assignee: '담당자',
      dueDate: '2026-10-15',
      done: false
    };
    setActionItems([...actionItems, newItem]);
  };

  const handleDeleteAction = (id: string) => {
    setActionItems(items => items.filter(i => i.id !== id));
  };

  return (
    <div className="w-full flex justify-center py-4 px-2 sm:px-6">
      <div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-10 space-y-6">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              AI 회의록 및 액션 아이템
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
            음성 AI 분석 완료
          </span>
        </div>

        {/* 회의 안건 및 참석자 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>회의 주제</span>
            </label>
            <input
              type="text"
              value={meetingTheme}
              onChange={(e) => setMeetingTheme(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>참석자</span>
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 핵심 결정 요약 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            주요 결정 사항 및 합의 내용
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full p-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500 leading-relaxed resize-none"
          />
        </div>

        {/* 액션 아이템 (할 일 목록) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                후속 조치 할 일 (To-Do List)
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {onSyncToLifeHub && (
                <button
                  onClick={onSyncToLifeHub}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>할 일 ➔ 라이프 Hub 연동</span>
                </button>
              )}
              <button
                onClick={handleAddAction}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>할 일 추가</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {actionItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  item.done 
                    ? 'bg-slate-50/60 dark:bg-zinc-850/40 border-slate-200 dark:border-zinc-800 opacity-60' 
                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                  <button
                    onClick={() => toggleActionDone(item.id)}
                    className="cursor-pointer text-emerald-600 dark:text-emerald-400 shrink-0"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-zinc-600 hover:border-emerald-500" />
                    )}
                  </button>

                  <span className={`text-xs sm:text-sm font-medium truncate ${item.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500 shrink-0">
                  <span className="bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 rounded font-bold">
                    {item.assignee}
                  </span>
                  <span>{item.dueDate}</span>
                  <button
                    onClick={() => handleDeleteAction(item.id)}
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
