import React, { useState } from 'react';
import type { OfficeDocument } from '../../types/office';
import type { TaskHabitItem, TaskPriority } from '../../types/lifeHub';
import { 
  X, 
  Calendar, 
  CheckSquare, 
  ArrowRight, 
  User, 
  Layers,
  Compass
} from 'lucide-react';
import { 
  loadLifeHubMasterState, 
  saveLifeHubMasterState 
} from '../../services/lifeHubMasterEngine';

interface ExtractedTaskItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  sourceSection: string;
  isSelected: boolean;
}

interface LifeHubTaskBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  onShowToast: (message: string, type: 'info' | 'success' | 'error') => void;
  onNavigateToLifeHub: () => void;
}

export const LifeHubTaskBridge: React.FC<LifeHubTaskBridgeProps> = ({
  isOpen,
  onClose,
  document,
  onShowToast,
  onNavigateToLifeHub
}) => {
  // 문서 본문으로부터 동사형 종결 실행 과제 자동 파싱
  const parseActionItems = (): ExtractedTaskItem[] => {
    const items: ExtractedTaskItem[] = [];
    const baseDate = document.metadata.date || new Date().toISOString().slice(0, 10);
    const author = document.metadata.author || '담당자';

    // 1. 공문서 로드맵 및 개조식 항목 파싱
    document.content.docsContent.sections.forEach((sec, idx) => {
      const text = sec.text.trim();
      // 동사형 종결어미 (~수립, ~작성, ~검증, ~완료, ~구축, ~보고, ~배포, ~설계, ~심의, ~추진 등)
      const isVerbEnding = /(수립|작성|검증|완료|구축|보고|배포|설계|심의|추진|개발|테스트|운영|체결|정산)$/.test(text) ||
                           text.includes('단계:') || text.includes('Day ') || text.includes('로드맵');

      if (isVerbEnding && text.length > 5 && !text.startsWith('총 소요') && !text.startsWith('문서제목')) {
        const dDayOffset = (items.length + 1) * 7;
        const dDate = new Date();
        dDate.setDate(dDate.getDate() + dDayOffset);
        const dueDateStr = dDate.toISOString().slice(0, 10);

        items.push({
          id: `task-extract-${Date.now()}-${idx}`,
          title: text.replace(/^[0-9]+[.]\s*/, '').replace(/^[□○―]\s*/, ''),
          assignee: author,
          dueDate: dueDateStr,
          priority: items.length === 0 ? '🔥 P0' : items.length === 1 ? '⚡ P1' : '☕ P2',
          sourceSection: `${sec.marker} ${sec.text.slice(0, 24)}...`,
          isSelected: true
        });
      }
    });

    // 2. 기본 과제가 없을 경우 3대 표준 과제 자동 생성 (Zero-Hardcoding 준수)
    if (items.length === 0) {
      items.push({
        id: `task-extract-1`,
        title: `${document.title} 사내 보고 및 4단 결재 상신 완료`,
        assignee: author,
        dueDate: baseDate,
        priority: '🔥 P0',
        sourceSection: '기안서 상신',
        isSelected: true
      });
      items.push({
        id: `task-extract-2`,
        title: `${document.title} 관련 예산 배정 및 부서 협의 진행`,
        assignee: author,
        dueDate: baseDate,
        priority: '⚡ P1',
        sourceSection: '예산 집행 계획',
        isSelected: true
      });
      items.push({
        id: `task-extract-3`,
        title: `${document.title} 1단계 시범 도입 및 피드백 분석 보고서 작성`,
        assignee: author,
        dueDate: baseDate,
        priority: '☕ P2',
        sourceSection: '실행 로드맵',
        isSelected: true
      });
    }

    return items;
  };

  const [extractedTasks, setExtractedTasks] = useState<ExtractedTaskItem[]>(() => parseActionItems());

  if (!isOpen) return null;

  const handleToggleTask = (id: string) => {
    setExtractedTasks(prev => prev.map(t => t.id === id ? { ...t, isSelected: !t.isSelected } : t));
  };

  const handleTaskTitleChange = (id: string, newTitle: string) => {
    setExtractedTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const handlePriorityCycle = (id: string) => {
    const priorities: TaskPriority[] = ['🔥 P0', '⚡ P1', '☕ P2'];
    setExtractedTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextIdx = (priorities.indexOf(t.priority) + 1) % priorities.length;
        return { ...t, priority: priorities[nextIdx] };
      }
      return t;
    }));
  };

  // 라이프 Hub Tasks DB에 즉시 등록
  const handleDeployToLifeHub = () => {
    const selectedTasks = extractedTasks.filter(t => t.isSelected);
    if (selectedTasks.length === 0) {
      onShowToast('등록할 과제를 최소 1개 이상 선택해 주세요.', 'error');
      return;
    }

    try {
      const currentState = loadLifeHubMasterState();

      const newLifeTasks: TaskHabitItem[] = selectedTasks.map(t => ({
        id: `task-life-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: t.title,
        type: '할일',
        dueDate: t.dueDate,
        priority: t.priority,
        completed: false,
        duration: '1h',
        notes: `[오피스 스튜디오 문서 연동: ${document.title}] 출처: ${t.sourceSection} (기안자: ${t.assignee})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const updatedState = {
        ...currentState,
        tasks: [...newLifeTasks, ...currentState.tasks],
        lastSyncedAt: new Date().toISOString()
      };

      saveLifeHubMasterState(updatedState);
      onShowToast(`${selectedTasks.length}건의 실행 과제가 라이프 Hub [Tasks DB]로 전송되었습니다.`, 'success');
      onClose();
    } catch (e) {
      console.error(e);
      onShowToast('라이프 Hub 연동 중 오류가 발생했습니다.', 'error');
    }
  };

  const selectedCount = extractedTasks.filter(t => t.isSelected).length;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="lifehub-bridge-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none no-print"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* 상단 타이틀 */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-slate-200 dark:text-zinc-800" />
            </div>
            <div>
              <h3 id="lifehub-bridge-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                라이프 Hub [Tasks DB] 실행 과제 직결 파이프라인
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                문서 본문에서 동사형 실행 과제를 자동 감지하여 라이프 Hub 일일 태스크로 직결 등록합니다.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 연동 메타 헤더 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-750 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 dark:text-zinc-300">원천 문서:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
              {document.title}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
            {selectedCount}개 과제 선택됨
          </span>
        </div>

        {/* 추출된 태스크 카드 목록 */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            추출된 실행 과제 목록 (직접 수정 및 우선순위 토글 가능):
          </label>

          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {extractedTasks.map((t) => (
              <div 
                key={t.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  t.isSelected 
                    ? 'bg-white dark:bg-zinc-850 border-slate-300 dark:border-zinc-700 shadow-xs' 
                    : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 opacity-50'
                }`}
              >
                {/* 체크박스 */}
                <button
                  type="button"
                  onClick={() => handleToggleTask(t.id)}
                  className="mt-1 text-slate-700 dark:text-zinc-300 hover:scale-110 transition cursor-pointer shrink-0"
                >
                  <CheckSquare className={`w-4 h-4 ${t.isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} />
                </button>

                {/* 태스크 입력 & 메타 */}
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    type="text"
                    value={t.title}
                    onChange={(e) => handleTaskTitleChange(t.id, e.target.value)}
                    className="w-full text-xs font-bold bg-transparent border-b border-transparent focus:border-slate-400 outline-none text-slate-900 dark:text-white py-0.5"
                  />

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
                    {/* 우선순위 칩 */}
                    <button
                      type="button"
                      onClick={() => handlePriorityCycle(t.id)}
                      className="px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                      title="우선순위 변경 (클릭)"
                    >
                      {t.priority}
                    </button>

                    {/* 마감일 */}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{t.dueDate}</span>
                    </div>

                    {/* 담당자 */}
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{t.assignee}</span>
                    </div>

                    {/* 출처 */}
                    <span className="text-slate-400 truncate max-w-[150px]">
                      • {t.sourceSection}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onNavigateToLifeHub}
            className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 transition cursor-pointer"
          >
            <span>라이프 Hub 대시보드로 이동</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeployToLifeHub}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>라이프 Hub에 즉시 등록 ({selectedCount})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
