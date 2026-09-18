// src/components/life/ScheduleView.tsx
// 라이프 허브 스마트일정 3대 뷰(월간, 주간, 일일) 스위처 및 고도화 캘린더

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Video, 
  Edit2, 
  Trash2, 
  MapPin,
  ListOrdered,
  CalendarDays
} from 'lucide-react';
import type { LifeScheduleItem } from '../../services/notionLifeHubSync';
import { ScheduleDrawer } from './ScheduleDrawer';

export type ScheduleViewMode = 'month' | 'week' | 'day';

interface ScheduleViewProps {
  schedules: LifeScheduleItem[];
  onOpenEditModal: (item: LifeScheduleItem) => void;
  onDeleteItem: (item: LifeScheduleItem) => void;
  onQuickCapture: () => void;
  onAddScheduleFromTodo?: (todoData: any, targetDate: string, targetTime: string) => void;
  isCompact?: boolean;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  onOpenEditModal,
  onDeleteItem,
  onQuickCapture,
  onAddScheduleFromTodo,
  isCompact = false
}) => {
  // 1. 뷰 모드: 월간, 주간, 일일
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('month');

  // 기준 날짜 (2026-09-18)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 18)); // 2026년 9월 18일

  // DnD 슬롯 오버 상태 (예: "2026-09-18-14:00")
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // 우측 서랍(Drawer) 상태
  const [selectedEvent, setSelectedEvent] = useState<LifeScheduleItem | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleOpenDrawer = (item: LifeScheduleItem) => {
    setSelectedEvent(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // 날짜 이동 핸들러
  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 18));
  };

  // 날짜 문자열 헬퍼
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const dateNum = currentDate.getDate();

  // 상단 헤더 타이틀 표시
  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `${year}년 ${month + 1}월`;
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay(); // 0: Sun
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      return `${startOfWeek.getMonth() + 1}월 ${startOfWeek.getDate()}일 ~ ${endOfWeek.getMonth() + 1}월 ${endOfWeek.getDate()}일`;
    } else {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return `${year}년 ${month + 1}월 ${dateNum}일 (${days[currentDate.getDay()]}요일)`;
    }
  }, [viewMode, currentDate, year, month, dateNum]);

  // 일정 날짜 매핑 헬퍼 (YYYY-MM-DD)
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = '2026-09-18';

  // 카테고리별 컬러 뱃지 헬퍼
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case '업무':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
      case '건강':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/50';
      case '가족':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/50';
      case '개인':
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
    }
  };

  // -------------------------------------------------------------
  // 1. [월간 뷰 (Month View)] 풀 캘린더 그리드
  // -------------------------------------------------------------
  const renderMonthView = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 이번 달 1일 요일
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate(); // 이번 달 총 일수
    const prevMonthDays = new Date(year, month, 0).getDate(); // 지난 달 총 일수

    const days = [];

    // 지난 달 날짜 패딩
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // 이번 달 날짜
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // 다음 달 날짜 패딩 (총 35 or 42 셀 맞춤)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return (
      <div className="border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-800/60 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-neutral-400">
          <div className="text-rose-500 whitespace-nowrap">일</div>
          <div className="whitespace-nowrap">월</div>
          <div className="whitespace-nowrap">화</div>
          <div className="whitespace-nowrap">수</div>
          <div className="whitespace-nowrap">목</div>
          <div className="whitespace-nowrap">금</div>
          <div className="text-blue-500 whitespace-nowrap">토</div>
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70 dark:divide-neutral-800/80">
          {days.map((cell, idx) => {
            const cellYMD = formatYMD(cell.date);
            const isToday = cellYMD === todayStr;
            const daySchedules = schedules.filter(s => s.date.startsWith(cellYMD));

            const isCellDragOver = dragOverSlot === cellYMD;

            return (
              <div 
                key={idx}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (dragOverSlot !== cellYMD) setDragOverSlot(cellYMD);
                }}
                onDragLeave={() => {
                  if (dragOverSlot === cellYMD) setDragOverSlot(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSlot(null);
                  try {
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                      const data = JSON.parse(raw);
                      if (onAddScheduleFromTodo) {
                        onAddScheduleFromTodo(data, cellYMD, '10:00');
                      }
                    }
                  } catch (err) {
                    console.error('월간 DnD 드롭 파싱 실패:', err);
                  }
                }}
                onClick={() => {
                  if (daySchedules.length > 0) {
                    handleOpenDrawer(daySchedules[0]);
                  }
                }}
                className={`${
                  isCompact ? 'min-h-[56px] sm:min-h-[64px] p-1' : 'min-h-[90px] sm:min-h-[110px] p-2'
                } flex flex-col justify-between transition group cursor-pointer relative overflow-hidden ${
                  isCellDragOver
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500 ring-dashed z-10'
                    : !cell.isCurrentMonth 
                      ? 'bg-slate-50/40 dark:bg-neutral-950/30 text-slate-300 dark:text-neutral-600' 
                      : 'bg-white dark:bg-neutral-900/60 hover:bg-blue-50/30 dark:hover:bg-neutral-800/40 text-slate-700 dark:text-slate-200'
                }`}
              >
                {isCellDragOver && (
                  <div className="absolute inset-x-1 top-1 p-0.5 rounded bg-blue-500 text-white text-[9px] font-bold text-center z-20 shadow-xs animate-pulse">
                    + 일정 드롭
                  </div>
                )}

                {/* 상단 날짜 번호 및 밀집도 뱃지 */}
                <div className="flex items-center justify-between">
                  <span className={`${
                    isCompact ? 'text-[11px] w-5 h-5' : 'text-xs w-6 h-6'
                  } font-bold flex items-center justify-center rounded-full whitespace-nowrap ${
                    isToday 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : ''
                  }`}>
                    {cell.date.getDate()}
                  </span>

                  {daySchedules.length > 0 && (
                    <span className={`${
                      isCompact ? 'text-[9px] px-1 py-0' : 'text-[10px] px-1.5 py-0.2'
                    } rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap`}>
                      {daySchedules.length}건
                    </span>
                  )}
                </div>

                {/* 일정 태그 리스트 */}
                <div className="mt-1 space-y-0.5 flex-1 overflow-hidden">
                  {daySchedules.slice(0, isCompact ? 1 : 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDrawer(item);
                      }}
                      className={`px-1 py-0.5 rounded ${
                        isCompact ? 'text-[9px]' : 'text-[10px]'
                      } font-semibold truncate border transition cursor-pointer flex items-center space-x-0.5 ${getCategoryColor(item.category)}`}
                      title={`${item.title} (${item.date})`}
                    >
                      <span className="shrink-0">{item.icon || '•'}</span>
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}

                  {daySchedules.length > (isCompact ? 1 : 2) && (
                    <div className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 pl-0.5 whitespace-nowrap">
                      +{daySchedules.length - (isCompact ? 1 : 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 2. [주간 뷰 (Week View)] 7일간 시간대별(오전 9시~오후 8시) 타임블록 슬롯
  // -------------------------------------------------------------
  const renderWeekView = () => {
    // 현재 선택된 주 7일 배열
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }

    // 시간대 정의: 오전 9시 ~ 오후 8시 (09:00 ~ 20:00)
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', 
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div className="border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
        {/* 주간 캘린더 상단 요일 헤더 */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-800/60 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-neutral-400">
          <div className="text-slate-400 text-[11px] flex items-center justify-center whitespace-nowrap">
            시간 / 요일
          </div>
          {weekDays.map((d, i) => {
            const isToday = formatYMD(d) === todayStr;
            return (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-[11px] whitespace-nowrap ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : ''}`}>
                  {dayLabels[i]}
                </span>
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-0.5 whitespace-nowrap ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* 타임 슬롯 바디 (09:00 ~ 20:00) */}
        <div className="divide-y divide-slate-100 dark:divide-neutral-800/60 max-h-[560px] overflow-y-auto">
          {timeSlots.map((time) => {
            const hour = parseInt(time.split(':')[0], 10);

            return (
              <div key={time} className="grid grid-cols-8 min-h-[54px] divide-x divide-slate-100 dark:divide-neutral-800/60">
                {/* 좌측 시간 표시 */}
                <div className="px-2 py-1.5 text-[11px] font-mono text-slate-400 dark:text-neutral-500 text-right pr-3 whitespace-nowrap bg-slate-50/40 dark:bg-neutral-950/20">
                  {time}
                </div>

                {/* 7일 컬럼 슬롯 */}
                {weekDays.map((d, dayIdx) => {
                  const ymd = formatYMD(d);
                  const slotKey = `${ymd}-${time}`;
                  const isDragOver = dragOverSlot === slotKey;

                  // 해당 날짜 및 시간대에 해당하는 일정 찾기
                  const slotEvents = schedules.filter(s => {
                    if (!s.date.startsWith(ymd)) return false;
                    const eventTime = s.date.split(' ')[1] || (s.start ? s.start.split(' ')[1] : '');
                    if (!eventTime) return hour === 9; // 시간 미지정 시 09시에 기본 배치
                    const eventHour = parseInt(eventTime.split(':')[0], 10);
                    return eventHour === hour;
                  });

                  return (
                    <div 
                      key={dayIdx}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        if (dragOverSlot !== slotKey) setDragOverSlot(slotKey);
                      }}
                      onDragLeave={() => {
                        if (dragOverSlot === slotKey) setDragOverSlot(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSlot(null);
                        try {
                          const raw = e.dataTransfer.getData('application/json');
                          if (raw) {
                            const data = JSON.parse(raw);
                            if (onAddScheduleFromTodo) {
                              onAddScheduleFromTodo(data, ymd, time);
                            }
                          }
                        } catch (err) {
                          console.error('DnD 드롭 파싱 오류:', err);
                        }
                      }}
                      className={`p-1 relative transition group min-h-[54px] ${
                        isDragOver
                          ? 'bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500 ring-dashed z-10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-neutral-800/30'
                      }`}
                    >
                      {isDragOver && (
                        <div className="p-1 rounded-md bg-blue-500 text-white text-[10px] font-bold text-center animate-pulse mb-1 shadow-xs whitespace-nowrap">
                          + 타임블록 드롭
                        </div>
                      )}

                      {slotEvents.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenDrawer(item)}
                          className={`p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer shadow-xs transition hover:scale-101 ${getCategoryColor(item.category)}`}
                        >
                          <div className="flex items-center space-x-1 truncate font-bold">
                            <span>{item.icon || '💼'}</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                            {item.date.split(' ')[1] || '09:00'} · {item.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 3. [일일 뷰 (Daily View)] 오늘 시간 순서에 맞춘 포커스 리스트
  // -------------------------------------------------------------
  const renderDayView = () => {
    const selectedYMD = formatYMD(currentDate);
    const isToday = selectedYMD === todayStr;

    // 해당 날짜 일정 필터링 및 시간순 정렬
    const daySchedules = schedules
      .filter(s => s.date.startsWith(selectedYMD))
      .sort((a, b) => {
        const timeA = a.date.split(' ')[1] || '00:00';
        const timeB = b.date.split(' ')[1] || '00:00';
        return timeA.localeCompare(timeB);
      });

    return (
      <div className={isCompact ? 'space-y-2.5' : 'space-y-4'}>
        {/* 일일 요약 헤더 */}
        <div className={`${isCompact ? 'p-2.5 rounded-xl' : 'p-4 rounded-2xl'} border border-slate-200 dark:border-neutral-800 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-neutral-900 dark:to-blue-950/20 flex items-center justify-between`}>
          <div className="flex items-center space-x-2.5">
            <div className={`${isCompact ? 'w-8 h-8 rounded-lg text-xs' : 'w-10 h-10 rounded-xl'} bg-blue-600 text-white flex flex-col items-center justify-center font-bold shadow-xs shrink-0`}>
              <span className="text-[9px] uppercase leading-none">{month + 1}월</span>
              <span className={`${isCompact ? 'text-xs' : 'text-base'} leading-tight`}>{dateNum}</span>
            </div>
            <div>
              <h3 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold text-slate-900 dark:text-white flex items-center space-x-1.5`}>
                <span className="truncate">{headerTitle}</span>
                {isToday && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white whitespace-nowrap">
                    오늘
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                총 {daySchedules.length}개의 포커스 일정
              </p>
            </div>
          </div>

          <button
            onClick={onQuickCapture}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition shadow-xs whitespace-nowrap`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCompact ? '등록' : '이 날짜에 등록'}</span>
          </button>
        </div>

        {/* 타임라인 포커스 리스트 */}
        {daySchedules.length === 0 ? (
          <div className="py-16 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              이 날짜에 예정된 일정이 없습니다.
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              상단 '+ 이 날짜에 등록' 버튼을 눌러 여유 시간을 알차게 계획해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-neutral-800 before:z-0">
            {daySchedules.map((item) => {
              const timeText = item.date.split(' ')[1] || '시간 미지정';
              const hasMeeting = Boolean(item.meetingUrl || item.category === '업무');

              return (
                <div 
                  key={item.id}
                  onClick={() => handleOpenDrawer(item)}
                  className={`relative z-10 ${isCompact ? 'pl-7' : 'pl-10'} group cursor-pointer`}
                >
                  {/* 타임라인 닷(Dot) */}
                  <div className={`absolute ${isCompact ? 'left-2 top-4 w-2.5 h-2.5' : 'left-2.5 top-5 w-3.5 h-3.5'} rounded-full border-2 border-white dark:border-neutral-900 bg-blue-600 shadow-xs -translate-x-1/2 group-hover:scale-125 transition`} />

                  <div className={`${isCompact ? 'p-2.5 rounded-lg gap-2' : 'p-4 rounded-xl gap-3'} border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between`}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeText}</span>
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border whitespace-nowrap ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold whitespace-nowrap">
                          {item.dday}
                        </span>
                      </div>

                      <h4 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold text-slate-900 dark:text-white flex items-center space-x-1.5`}>
                        <span className="shrink-0">{item.icon || '📌'}</span>
                        <span className="truncate">{item.title}</span>
                      </h4>

                      {item.location && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-neutral-400">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {hasMeeting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(item);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold border border-blue-200/60 dark:border-blue-800/50 transition whitespace-nowrap"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>화상회의</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditModal(item);
                        }}
                        title="수정"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item);
                        }}
                        title="삭제"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={isCompact ? 'space-y-2.5' : 'space-y-4'}>
      {/* 1. 상단 컨트롤 바 (3대 뷰 스위처 & 날짜 네비게이션) */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-neutral-800`}>
        
        {/* 좌측: [월간 | 주간 | 일일] 세그먼트 버튼 */}
        <div className={`flex items-center ${isCompact ? 'p-0.5' : 'p-1'} rounded-xl bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/60 shadow-xs`}>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              viewMode === 'month'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">월간</span>
          </button>
          
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              viewMode === 'week'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">주간</span>
          </button>

          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              viewMode === 'day'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">일일</span>
          </button>
        </div>

        {/* 중앙: 날짜 네비게이션 */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrev}
            title="이전 기간"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className={`text-xs font-bold text-slate-800 dark:text-slate-100 ${isCompact ? 'min-w-[100px]' : 'min-w-[130px] sm:text-sm'} text-center whitespace-nowrap`}>
            {headerTitle}
          </span>

          <button
            onClick={handleNext}
            title="다음 기간"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToday}
            className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            오늘
          </button>
        </div>

        {/* 우측 액션: 1초 퀵 캡처로 등록 */}
        <button
          onClick={onQuickCapture}
          className={`flex items-center space-x-1 ${isCompact ? 'px-2.5 py-1' : 'px-3.5 py-1.5'} rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">{isCompact ? '등록' : '새 일정 등록'}</span>
        </button>
      </div>

      {/* 2. 뷰 본문 렌더링 */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* 3. 우측 슬라이드오버 서랍 (Slide-over Drawer) */}
      <ScheduleDrawer
        event={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onOpenEdit={onOpenEditModal}
        onDelete={onDeleteItem}
      />
    </div>
  );
};
