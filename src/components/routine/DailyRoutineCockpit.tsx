import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  CheckCircle2, 
  Circle, 
  Settings, 
  Zap, 
  RefreshCw, 
  Play, 
  Radio, 
  Sparkles, 
  X,
  Volume2,
  CalendarCheck
} from 'lucide-react';
import { 
  loadMasterConfig, 
  saveMasterConfig, 
  loadTodayOverrideConfig, 
  saveTodayOverrideConfig, 
  clearTodayOverrideConfig, 
  loadRoutineState, 
  saveRoutineState,
  DEFAULT_MASTER_CONFIG,
  type MasterRoutineConfig,
  type TodayOverrideConfig,
  type RoutineItemState
} from '../../services/dailyRoutineStorage';
import { useApp } from '../../context/AppContext';

export const DailyRoutineCockpit: React.FC = () => {
  const { showToast, setCurrentView } = useApp();

  const [masterConfig, setMasterConfig] = useState<MasterRoutineConfig>(DEFAULT_MASTER_CONFIG);
  const [todayOverride, setTodayOverride] = useState<TodayOverrideConfig | null>(null);
  const [routineState, setRoutineState] = useState<RoutineItemState>({
    dateStr: '',
    morningCompleted: false,
    middayCompleted: false,
    nightCompleted: false
  });

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isTodayModalOpen, setIsTodayModalOpen] = useState(false);

  // 모달 폼 상태
  const [tempMaster, setTempMaster] = useState<MasterRoutineConfig>(DEFAULT_MASTER_CONFIG);
  const [tempOverride, setTempOverride] = useState<{
    skipMorning: boolean;
    skipMidday: boolean;
    skipNight: boolean;
    isSkippedAll: boolean;
    overrideMorningTime: string;
    overrideMiddayTime: string;
    overrideNightTime: string;
  }>({
    skipMorning: false,
    skipMidday: false,
    skipNight: false,
    isSkippedAll: false,
    overrideMorningTime: '08:00',
    overrideMiddayTime: '12:30',
    overrideNightTime: '23:00'
  });

  // 초기화 & 자정 롤백 검증
  useEffect(() => {
    const loadedMaster = loadMasterConfig();
    const loadedOverride = loadTodayOverrideConfig();
    const loadedState = loadRoutineState();

    setMasterConfig(loadedMaster);
    setTodayOverride(loadedOverride);
    setRoutineState(loadedState);

    setTempMaster(loadedMaster);
    if (loadedOverride) {
      setTempOverride({
        skipMorning: loadedOverride.skipMorning,
        skipMidday: loadedOverride.skipMidday,
        skipNight: loadedOverride.skipNight,
        isSkippedAll: loadedOverride.isSkippedAll,
        overrideMorningTime: loadedOverride.overrideMorningTime || loadedMaster.commuteTime,
        overrideMiddayTime: loadedOverride.overrideMiddayTime || loadedMaster.middayTime,
        overrideNightTime: loadedOverride.overrideNightTime || loadedMaster.nighttimeTime
      });
    } else {
      setTempOverride({
        skipMorning: false,
        skipMidday: false,
        skipNight: false,
        isSkippedAll: false,
        overrideMorningTime: loadedMaster.commuteTime,
        overrideMiddayTime: loadedMaster.middayTime,
        overrideNightTime: loadedMaster.nighttimeTime
      });
    }
  }, []);

  // 표시용 최종 시각 결합 (오늘 1일 설정이 적용되어 있으면 마스터 룰 오버라이드)
  const morningTime = (todayOverride?.overrideMorningTime) || masterConfig.commuteTime;
  const middayTime = (todayOverride?.overrideMiddayTime) || masterConfig.middayTime;
  const nightTime = (todayOverride?.overrideNightTime) || masterConfig.nighttimeTime;

  // 마스터 고정 룰 저장
  const handleSaveMaster = () => {
    saveMasterConfig(tempMaster);
    setMasterConfig(tempMaster);
    setIsMasterModalOpen(false);
    showToast('⚙️ 마스터 고정 룰이 영구 저장되었습니다.', 'success');
  };

  // 오늘 1일 설정 저장
  const handleSaveTodayOverride = () => {
    const updated = saveTodayOverrideConfig(tempOverride);
    setTodayOverride(updated);
    setIsTodayModalOpen(false);
    showToast('⚡ 오늘 1일 설정이 적용되었습니다. (자정 00:00 마스터 룰 자동 복구)', 'info');
  };

  // 마스터 룰로 즉시 복귀
  const handleResetToMaster = () => {
    clearTodayOverrideConfig();
    setTodayOverride(null);
    setIsTodayModalOpen(false);
    showToast('🔄 당일 오버라이드가 해제되고 마스터 고정 룰로 즉시 복귀했습니다.', 'success');
  };

  // 루틴 완료 토글
  const toggleRoutineItem = (key: 'morningCompleted' | 'middayCompleted' | 'nightCompleted') => {
    const updatedState = saveRoutineState({ [key]: !routineState[key] });
    setRoutineState(updatedState);
    const itemLabel = key === 'morningCompleted' ? '출근길 오디오 브리프' : key === 'middayCompleted' ? '미드데이 체크' : '취침 전 듀얼 AI 팟캐스트';
    if (updatedState[key]) {
      showToast(`🎉 [${itemLabel}] 완료 처리되었습니다!`, 'success');
    }
  };

  // 오디오 브리프 실행
  const handleRunAudioBrief = () => {
    const omniInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (omniInput) {
      omniInput.value = '☀️ 출근길 브리핑: 오늘 이메일 요약, 주요 테크 뉴스, 잔잔한 오디오 재생해 줘';
      omniInput.focus();
      omniInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    showToast('☀️ 출근길 오디오 브리프 생성이 시작되었습니다.', 'info');
  };

  // 미드데이 체크 실행
  const handleRunMiddayCheck = () => {
    setCurrentView('life');
    showToast('☕ 라이프 허브로 이동했습니다. 오전 할일과 점심 지출을 체크하세요!', 'info');
  };

  // 팟캐스트 실행
  const handleRunPodcast = () => {
    const omniInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (omniInput) {
      omniInput.value = '🌙 취침 전 팟캐스트: 오늘 최신 AI 모델 동향과 비즈니스 아이디어로 2인 토론 대화를 들려줘';
      omniInput.focus();
      omniInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    showToast('🌙 취침 전 듀얼 AI 팟캐스트 토론이 시작되었습니다.', 'info');
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* 콕핏 헤더 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center space-x-2">
              <span>⏰ 24시간 데일리 루틴 관제 콕핏</span>
            </h2>

            {/* 자정 자동 롤백 안내 뱃지 */}
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span>오늘 변경 사항은 자정(00:00)에 마스터 룰로 자동 복구됩니다</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            하루 3대 자율 루틴이 정해진 시각에 자동 작동하며, 당일 오버라이드는 자정에 원복됩니다.
          </p>
        </div>

        {/* 듀얼 설정 토글 버튼 */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsMasterModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-slate-300 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-500 transition shadow-2xs cursor-pointer"
            title="출퇴근 시각, 관심사 영구 저장"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>⚙️ 마스터 고정 룰</span>
          </button>

          <button
            onClick={() => setIsTodayModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
              todayOverride
                ? 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-600 animate-pulse'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-slate-300 dark:border-neutral-700 hover:border-blue-400'
            }`}
            title="오늘 일회성 시간 변경 또는 건너뛰기"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{todayOverride ? '⚡ 오늘 1일 설정 중' : '⚡ 오늘 1일 설정'}</span>
          </button>
        </div>
      </div>

      {/* 3대 데일리 루틴 타임라인 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ① ☀️ 출근길 오디오 브리프 */}
        <div className={`relative bg-white dark:bg-notion-dark-card rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
          todayOverride?.skipMorning || todayOverride?.isSkippedAll
            ? 'opacity-50 border-slate-200 dark:border-neutral-800'
            : routineState.morningCompleted
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
            : 'border-slate-200 dark:border-neutral-800 hover:border-amber-400 shadow-2xs'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  ☀️
                </div>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                  [{morningTime} 출근길]
                </span>
              </div>

              <button
                onClick={() => toggleRoutineItem('morningCompleted')}
                className="cursor-pointer transition hover:scale-110"
                title={routineState.morningCompleted ? '대기로 변경' : '완료로 표시'}
              >
                {routineState.morningCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                )}
              </button>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                <span>08:00 출근길 오디오 브리프</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                메일 요약 ➔ 테크 뉴스 ➔ 맞춤형 생성 음원 스트리밍
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-neutral-800/60 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex items-center space-x-1 font-medium">
                <Radio className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
                <span className="truncate">키워드: {masterConfig.keywords.join(', ')}</span>
              </div>
              <div className="flex items-center space-x-1 text-neutral-400">
                <Volume2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>장르: {masterConfig.musicGenre}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              routineState.morningCompleted 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
            }`}>
              {routineState.morningCompleted ? '✅ 완료됨' : '⏳ 대기 중'}
            </span>

            <button
              onClick={handleRunAudioBrief}
              disabled={todayOverride?.skipMorning || todayOverride?.isSkippedAll}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>브리프 재생</span>
            </button>
          </div>
        </div>

        {/* ② ☕ 미드데이 체크 */}
        <div className={`relative bg-white dark:bg-notion-dark-card rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
          todayOverride?.skipMidday || todayOverride?.isSkippedAll
            ? 'opacity-50 border-slate-200 dark:border-neutral-800'
            : routineState.middayCompleted
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
            : 'border-slate-200 dark:border-neutral-800 hover:border-emerald-400 shadow-2xs'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ☕
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  [{middayTime} 점심]
                </span>
              </div>

              <button
                onClick={() => toggleRoutineItem('middayCompleted')}
                className="cursor-pointer transition hover:scale-110"
                title={routineState.middayCompleted ? '대기로 변경' : '완료로 표시'}
              >
                {routineState.middayCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                )}
              </button>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                <span>12:30 미드데이 체크</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                오전 할일 달성률 및 점심 가계부 지출 내역 점검
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-neutral-800/60 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex items-center space-x-1 font-medium">
                <CalendarCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>투두 상태: 오전 우선순위 점검</span>
              </div>
              <div className="flex items-center space-x-1 text-neutral-400">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>가계부: 식비 영수증 자동 집계</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              routineState.middayCompleted 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
            }`}>
              {routineState.middayCompleted ? '✅ 완료됨' : '⏳ 대기 중'}
            </span>

            <button
              onClick={handleRunMiddayCheck}
              disabled={todayOverride?.skipMidday || todayOverride?.isSkippedAll}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>라이프 점검</span>
            </button>
          </div>
        </div>

        {/* ③ 🌙 취침 전 듀얼 AI 팟캐스트 */}
        <div className={`relative bg-white dark:bg-notion-dark-card rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
          todayOverride?.skipNight || todayOverride?.isSkippedAll
            ? 'opacity-50 border-slate-200 dark:border-neutral-800'
            : routineState.nightCompleted
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
            : 'border-slate-200 dark:border-neutral-800 hover:border-blue-400 shadow-2xs'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  🌙
                </div>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                  [{nightTime} 취침 전]
                </span>
              </div>

              <button
                onClick={() => toggleRoutineItem('nightCompleted')}
                className="cursor-pointer transition hover:scale-110"
                title={routineState.nightCompleted ? '대기로 변경' : '완료로 표시'}
              >
                {routineState.nightCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                )}
              </button>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                <span>23:00 취침 전 듀얼 AI 팟캐스트</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                AI 모델/비즈니스 아이디어 2인 대화형 음성 토론
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-neutral-800/60 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex items-center space-x-1 font-medium">
                <Radio className="w-3 h-3 text-blue-500 shrink-0" />
                <span>형식: 호스트 A & 딥다이브 B 듀얼 대화</span>
              </div>
              <div className="flex items-center space-x-1 text-neutral-400">
                <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>시간: 15분 이완 팟캐스트 세션</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              routineState.nightCompleted 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
            }`}>
              {routineState.nightCompleted ? '✅ 완료됨' : '⏳ 대기 중'}
            </span>

            <button
              onClick={handleRunPodcast}
              disabled={todayOverride?.skipNight || todayOverride?.isSkippedAll}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>팟캐스트 재생</span>
            </button>
          </div>
        </div>

      </div>

      {/* ⚙️ [모달 A]: 마스터 고정 룰 설정 모달 */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-notion-dark-card rounded-3xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <span>⚙️ 마스터 고정 룰 설정</span>
              </h3>
              <button 
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">☀️ 출근 브리프</label>
                  <input
                    type="time"
                    value={tempMaster.commuteTime}
                    onChange={(e) => setTempMaster({ ...tempMaster, commuteTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">☕ 미드데이</label>
                  <input
                    type="time"
                    value={tempMaster.middayTime}
                    onChange={(e) => setTempMaster({ ...tempMaster, middayTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">🌙 팟캐스트</label>
                  <input
                    type="time"
                    value={tempMaster.nighttimeTime}
                    onChange={(e) => setTempMaster({ ...tempMaster, nighttimeTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">관심 키워드 (쉼표 구분)</label>
                <input
                  type="text"
                  value={tempMaster.keywords.join(', ')}
                  onChange={(e) => setTempMaster({ 
                    ...tempMaster, 
                    keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">선호 오디오 장르</label>
                <select
                  value={tempMaster.musicGenre}
                  onChange={(e) => setTempMaster({ ...tempMaster, musicGenre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-medium"
                >
                  <option value="Lo-Fi 비트 & 백색소음">Lo-Fi 비트 & 백색소음</option>
                  <option value="차분한 클래식 인스트루멘탈">차분한 클래식 인스트루멘탈</option>
                  <option value="모던 앰비언트 사운드">모던 앰비언트 사운드</option>
                  <option value="에너지 어쿠스틱 팝">에너지 어쿠스틱 팝</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                취소
              </button>
              <button
                onClick={handleSaveMaster}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
              >
                영구 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ [모달 B]: 오늘 1일 설정 모달 */}
      {isTodayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-notion-dark-card rounded-3xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>⚡ 오늘 1일 설정 (임시 변경)</span>
                </h3>
                <p className="text-[11px] text-neutral-400">자정(00:00)에 마스터 룰로 자동 롤백됩니다.</p>
              </div>
              <button 
                onClick={() => setIsTodayModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-amber-800 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={tempOverride.isSkippedAll}
                    onChange={(e) => setTempOverride({ ...tempOverride, isSkippedAll: e.target.checked })}
                    className="w-4 h-4 rounded-md accent-amber-500"
                  />
                  <span>🚫 [오늘 전체 루틴 건너뛰기]</span>
                </label>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 pl-6">
                  오늘 하루 동안 데일리 루틴 알림과 수동 동작을 일시 정지합니다.
                </p>
              </div>

              {!tempOverride.isSkippedAll && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-500 font-semibold mb-1">☀️ 오늘 출근 시각</label>
                      <input
                        type="time"
                        value={tempOverride.overrideMorningTime}
                        onChange={(e) => setTempOverride({ ...tempOverride, overrideMorningTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-500 font-semibold mb-1">☕ 오늘 점심 시각</label>
                      <input
                        type="time"
                        value={tempOverride.overrideMiddayTime}
                        onChange={(e) => setTempOverride({ ...tempOverride, overrideMiddayTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-500 font-semibold mb-1">🌙 오늘 취침 시각</label>
                      <input
                        type="time"
                        value={tempOverride.overrideNightTime}
                        onChange={(e) => setTempOverride({ ...tempOverride, overrideNightTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={tempOverride.skipMorning}
                        onChange={(e) => setTempOverride({ ...tempOverride, skipMorning: e.target.checked })}
                        className="w-3.5 h-3.5 rounded-md accent-amber-500"
                      />
                      <span>☀️ 오늘 출근길 브리프 건너뛰기</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={tempOverride.skipMidday}
                        onChange={(e) => setTempOverride({ ...tempOverride, skipMidday: e.target.checked })}
                        className="w-3.5 h-3.5 rounded-md accent-emerald-500"
                      />
                      <span>☕ 오늘 미드데이 점검 건너뛰기</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={tempOverride.skipNight}
                        onChange={(e) => setTempOverride({ ...tempOverride, skipNight: e.target.checked })}
                        className="w-3.5 h-3.5 rounded-md accent-blue-500"
                      />
                      <span>🌙 오늘 취침 전 팟캐스트 건너뛰기</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleResetToMaster}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                🔄 마스터 룰로 복귀
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsTodayModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTodayOverride}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                >
                  오늘만 적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyRoutineCockpit;
