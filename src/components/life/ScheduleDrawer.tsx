// src/components/life/ScheduleDrawer.tsx
// 라이프 허브 스마트일정 상세 우측 슬라이드오버 서랍 (Slide-over Drawer)

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  FileText, 
  ExternalLink, 
  Zap, 
  Check, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Copy,
  CalendarPlus,
  Share2
} from 'lucide-react';
import type { LifeScheduleItem } from '../../services/notionLifeHubSync';
import { 
  createNotionMeetingNote, 
  generateGoogleCalendarUrl, 
  exportScheduleToNotionCalendar 
} from '../../services/notionLifeHubSync';
import { useApp } from '../../context/AppContext';

interface ScheduleDrawerProps {
  event: LifeScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (item: LifeScheduleItem) => void;
  onDelete: (item: LifeScheduleItem) => void;
}

export const ScheduleDrawer: React.FC<ScheduleDrawerProps> = ({
  event,
  isOpen,
  onClose,
  onOpenEdit,
  onDelete
}) => {
  const { notionApiKey, selectedNotionDbId, showToast } = useApp();
  const [isGeneratingNote, setIsGeneratingNote] = useState<boolean>(false);
  const [generatedNoteUrl, setGeneratedNoteUrl] = useState<string | null>(null);
  const [isExportingCalendar, setIsExportingCalendar] = useState<boolean>(false);
  const [exportedCalendarUrl, setExportedCalendarUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  if (!isOpen || !event) return null;

  const isVideoMeeting = Boolean(
    event.meetingUrl || 
    event.location?.toLowerCase().includes('zoom') || 
    event.location?.toLowerCase().includes('meet') || 
    event.category === '업무' || 
    event.title.includes('회의')
  );

  const effectiveMeetingUrl = event.meetingUrl || (
    isVideoMeeting ? `https://meet.google.com/lookup/${event.id}` : null
  );

  // [⚡ 노션 회의록 DB 페이지 즉시 생성] 핸들러
  const handleCreateMeetingNote = async () => {
    setIsGeneratingNote(true);
    try {
      const res = await createNotionMeetingNote(
        notionApiKey,
        event,
        selectedNotionDbId || undefined
      );

      if (res.success && res.pageUrl) {
        setGeneratedNoteUrl(res.pageUrl);
        showToast('⚡ 노션 회의록 페이지가 성공적으로 생성되었습니다!', 'success');
      } else {
        showToast(res.error || '회의록 생성 중 알림이 발생했습니다.', 'info');
      }
    } catch (err: any) {
      showToast('회의록 생성 실패: ' + err.message, 'error');
    } finally {
      setIsGeneratingNote(false);
    }
  };

  // [⚡ 노션 캘린더 DB로 내보내기] 핸들러
  const handleExportNotionCalendar = async () => {
    setIsExportingCalendar(true);
    try {
      const res = await exportScheduleToNotionCalendar(
        notionApiKey,
        event,
        selectedNotionDbId || undefined
      );
      if (res.success && res.pageUrl) {
        setExportedCalendarUrl(res.pageUrl);
        showToast('⚡ 노션 캘린더 DB로 일정이 완벽히 내보내졌습니다!', 'success');
      } else {
        showToast(res.error || '노션 캘린더 전송 중 알림이 발생했습니다.', 'info');
      }
    } catch (err: any) {
      showToast('노션 캘린더 내보내기 실패: ' + err.message, 'error');
    } finally {
      setIsExportingCalendar(false);
    }
  };

  // [📅 구글 캘린더에 추가] 원클릭 핸들러
  const handleOpenGoogleCalendar = () => {
    try {
      const url = generateGoogleCalendarUrl(event);
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast('📅 구글 캘린더 등록 새 탭이 열렸습니다.', 'success');
    } catch (err: any) {
      showToast('구글 캘린더 연동 실패: ' + err.message, 'error');
    }
  };

  const handleCopyMeetingUrl = () => {
    if (effectiveMeetingUrl) {
      navigator.clipboard.writeText(effectiveMeetingUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      showToast('화상회의 링크가 클립보드에 복사되었습니다.', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 백드롭 오버레이 (클릭 시 닫힘) */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-white dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col transform transition ease-in-out duration-300">
          
          {/* 1. 서랍 상단 헤더 */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/70 dark:bg-neutral-900/80">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-2xl shrink-0">{event.icon || '📅'}</span>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 whitespace-nowrap">
                    {event.dday}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 whitespace-nowrap">
                    {event.category}
                  </span>
                  {event.status && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap ${
                      event.status === '완료' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {event.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                onClick={() => onOpenEdit(event)}
                title="일정 수정"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onDelete(event);
                  onClose();
                }}
                title="일정 삭제"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="서랍 닫기"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>


          {/* 2. 서랍 본문 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 text-sm">
            {/* 일정 제목 */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {event.title}
              </h2>
              {event.pageUrl && (
                <a
                  href={event.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>연동된 노션 페이지 열기</span>
                </a>
              )}
            </div>

            {/* 일시 정보 (Google Calendar / iCal 규격) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/40 space-y-2">
              <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="whitespace-nowrap">일정 일시:</span>
                <span className="text-slate-900 dark:text-white font-bold">{event.date}</span>
              </div>
              {(event.start || event.end) && (
                <div className="flex items-center space-x-2.5 text-xs text-slate-500 dark:text-neutral-400 pl-6">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>타임 슬롯: {event.start || event.date} ~ {event.end || '종료 시점 미정'}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-neutral-700/60">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="whitespace-nowrap">장소:</span>
                  <span className="text-slate-800 dark:text-slate-200">{event.location}</span>
                </div>
              )}
            </div>

            {/* 화상 회의 (Google Meet / Zoom) 원클릭 연동 */}
            {isVideoMeeting && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                      화상회의 바로가기
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold whitespace-nowrap">
                    Google Meet / Zoom
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={effectiveMeetingUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-98"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>화상회의 룸 입장하기</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                  <button
                    onClick={handleCopyMeetingUrl}
                    title="회의 링크 복사"
                    className="p-2.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-neutral-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {effectiveMeetingUrl && (
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 truncate font-mono">
                    {effectiveMeetingUrl}
                  </p>
                )}
              </div>
            )}

            {/* 참석자 명단 (Attendees) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>참석자 명단 ({event.attendees?.length || 1}명)</span>
              </h3>
              <div className="space-y-2">
                {(event.attendees && event.attendees.length > 0 ? event.attendees : [
                  { name: '나 (본인)', email: 'me@notion.com', status: 'accepted' as const }
                ]).map((attendee, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-800/60"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {attendee.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {attendee.name}
                        </div>
                        {attendee.email && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {attendee.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 whitespace-nowrap">
                      수락 완료
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 사전 준비 메모 및 안건 */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>사전 준비 메모 및 어젠다</span>
              </h3>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/30 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {event.notes || '별도의 사전 메모가 등록되지 않았습니다. 회의 전 안건이나 체크리스트를 기록해 두세요.'}
              </div>
            </div>

            {/* 생성된 회의록 바로가기 알림 카드 */}
            {generatedNoteUrl && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                      회의록이 생성되었습니다!
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      노션 회의록 DB와 실시간 연동 완료
                    </p>
                  </div>
                </div>
                <a
                  href={generatedNoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition"
                >
                  회의록 열기
                </a>
              </div>
            )}
            {/* 생성된 노션 캘린더 바로가기 알림 카드 */}
            {exportedCalendarUrl && (
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                      노션 캘린더로 내보내졌습니다!
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      노션 Date 속성 표준 연동 완료
                    </p>
                  </div>
                </div>
                <a
                  href={exportedCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition"
                >
                  노션에서 보기
                </a>
              </div>
            )}
          </div>

          {/* 3. 서랍 하단 고정 액션 바 (노션/구글 캘린더 2대 호환 버튼 & 회의록 생성) */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/95 dark:bg-neutral-900/95 backdrop-blur-md space-y-2.5">
            {/* 2대 캘린더 호환 액션 버튼 (노션 캘린더 & 구글 캘린더) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportNotionCalendar}
                disabled={isExportingCalendar}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-50 whitespace-nowrap"
              >
                <Share2 className={`w-3.5 h-3.5 ${isExportingCalendar ? 'animate-spin' : ''}`} />
                <span className="truncate">
                  {isExportingCalendar ? '내보내는 중...' : '⚡ 노션 캘린더로'}
                </span>
              </button>

              <button
                onClick={handleOpenGoogleCalendar}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-98 whitespace-nowrap"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span className="truncate">📅 구글 캘린더에 추가</span>
              </button>
            </div>

            {/* 노션 회의록 원클릭 생성 버튼 */}
            <button
              onClick={handleCreateMeetingNote}
              disabled={isGeneratingNote}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 min-h-[44px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGeneratingNote ? 'animate-spin' : ''}`} />
              <span>
                {isGeneratingNote 
                  ? '노션 회의록 DB 페이지 생성 중...' 
                  : '⚡ 노션 회의록 DB 페이지 즉시 생성'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400 dark:text-neutral-500">
              ISO 8601 표준 포맷 기반 구글·노션 캘린더 및 회의록 DB 실시간 연동
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
