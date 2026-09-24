import React, { useState } from 'react';
import {
  Activity,
  CreditCard,
  Utensils,
  ShoppingBag,
  Home,
  Dumbbell,
  Moon,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import type { LifeLogItem, LifeLogCategory } from '../../types/lifeHub';

interface LifeLogMasterViewProps {
  logs: LifeLogItem[];
  onAddLog: (log: {
    title: string;
    category: LifeLogCategory;
    amount?: number | null;
    date: string;
    note: string;
  }) => void;
  onDeleteLog: (logId: string) => void;
  isCompact?: boolean;
}

export const LifeLogMasterView: React.FC<LifeLogMasterViewProps> = ({
  logs,
  onAddLog,
  onDeleteLog,
  isCompact = false
}) => {

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 모달 상태
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LifeLogCategory>('식비');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDate, setNewDate] = useState('2026-09-24 12:00');
  const [newNote, setNewNote] = useState('');

  const filteredLogs = logs.filter(l => {
    if (filterCategory === 'ALL') return true;
    return l.category === filterCategory;
  });

  // 소비 지출 합계
  const totalExpense = logs
    .filter(l => l.amount !== null && l.amount !== undefined)
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  // 운동 및 수면 로깅 건수
  const workoutCount = logs.filter(l => l.category === '운동').length;
  const sleepCount = logs.filter(l => l.category === '수면').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedAmount = newCategory === '운동' || newCategory === '수면'
      ? null
      : newAmount.trim() ? parseInt(newAmount.replace(/,/g, ''), 10) : null;

    onAddLog({
      title: newTitle.trim(),
      category: newCategory,
      amount: parsedAmount,
      date: newDate,
      note: newNote.trim() || '내용 없음'
    });

    setNewTitle('');
    setNewAmount('');
    setNewNote('');
    setIsAddModalOpen(false);
  };

  const getCategoryIcon = (category: LifeLogCategory) => {
    switch (category) {
      case '식비':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case '쇼핑':
        return <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />;
      case '고정지출':
        return <Home className="w-3.5 h-3.5 text-blue-500" />;
      case '운동':
        return <Dumbbell className="w-3.5 h-3.5 text-rose-500" />;
      case '수면':
        return <Moon className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getCategoryBadgeColor = (category: LifeLogCategory) => {
    switch (category) {
      case '식비':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      case '쇼핑':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
      case '고정지출':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      case '운동':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      case '수면':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60';
    }
  };

  return (
    <div className={`flex flex-col h-full ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
      {/* 헤더 및 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Life Log DB (스마트 지출 & 일상 컨디션)
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {logs.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              소비 지출 · 운동 및 수면 컨디션 올인원 라이프 로깅
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 카테고리 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            {(['ALL', '식비', '쇼핑', '고정지출', '운동', '수면'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'ALL' ? '전체' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기록 추가</span>
          </button>
        </div>
      </div>

      {/* 요약 KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-850/60 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">총 기록 지출</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              ₩{totalExpense.toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-850/60 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">운동 로깅</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {workoutCount}회 기록
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 text-rose-600">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-850/60 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">수면 컨디션</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {sleepCount}일 기록
            </div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-600">
            <Moon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 라이프 로그 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">등록된 일상 로그가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map(log => {
            const hasAmount = log.amount !== null && log.amount !== undefined;

            return (
              <div
                key={log.id}
                className="group flex items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-white dark:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-neutral-700 transition-all duration-200 shadow-xs"
              >
                <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0 mr-3">
                  <div className={`p-2 rounded-lg border ${getCategoryBadgeColor(log.category)} shrink-0`}>
                    {getCategoryIcon(log.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeColor(log.category)}`}>
                        {log.category}
                      </span>

                      {/* 금액 또는 컨디션 뱃지 */}
                      {hasAmount ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ₩{log.amount?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                          일상 로깅
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{log.date}</span>
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {log.title}
                    </h4>

                    {log.note && (
                      <p className="text-[11px] text-slate-600 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => {
                    if (window.confirm(`'${log.title}' 로그를 삭제하시겠습니까?`)) {
                      onDeleteLog(log.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 신규 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>신규 Life Log 등록</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  항목명 (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 팀 회식 또는 야간 러닝 5km"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    카테고리 (Category)
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LifeLogCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="식비">식비</option>
                    <option value="쇼핑">쇼핑</option>
                    <option value="고정지출">고정지출</option>
                    <option value="운동">운동</option>
                    <option value="수면">수면</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    금액 (지출 항목인 경우)
                  </label>
                  <input
                    type="number"
                    disabled={newCategory === '운동' || newCategory === '수면'}
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder={newCategory === '운동' || newCategory === '수면' ? '해당 없음' : '원 단위 (예: 12000)'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  일시 (Date)
                </label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  비고 / 인사이트 (Text) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="지출 세부 내역 또는 운동 페이스, 수면 점수를 기록하세요."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs cursor-pointer"
                >
                  기록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
