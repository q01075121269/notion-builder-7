import React from 'react';
import type { QuickCaptureRecord } from '../../types/quickCapture';
import { Clock, ExternalLink, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CaptureHistoryTimelineProps {
  records: QuickCaptureRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const CaptureHistoryTimeline: React.FC<CaptureHistoryTimelineProps> = ({
  records,
  onDeleteRecord,
  onClearAll
}) => {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
        <Clock className="w-6 h-6 mx-auto opacity-40 mb-2" />
        <p>아직 최근 퀵 캡처 기록이 없습니다.</p>
        <p className="text-[11px] text-neutral-400/80">음성, 사진, 메모로 1초 만에 생각을 노션에 담아보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-1.5 font-bold text-neutral-800 dark:text-neutral-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>최근 퀵 캡처 피드 ({records.length})</span>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-neutral-400 hover:text-rose-500 transition"
        >
          기록 비우기
        </button>
      </div>

      <div className="space-y-2.5">
        {records.map((record) => {
          const timeStr = new Date(record.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={record.id}
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-2.5 transition hover:shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {record.mode === 'voice' ? '🎙️ 음성' : record.mode === 'photo' ? '📷 사진' : '✏️ 메모'}
                  </span>
                  <span className="text-neutral-400">{timeStr}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {record.status === 'sent' ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>노션 전송 완료</span>
                    </span>
                  ) : record.status === 'local_saved' ? (
                    <span className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium">
                      <span>로컬 저장됨</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-500 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>전송 실패</span>
                    </span>
                  )}

                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1 text-neutral-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Raw & Summary */}
              <div className="text-xs">
                <p className="font-semibold text-neutral-900 dark:text-white line-clamp-2">
                  {record.correctedSummary || record.rawContent}
                </p>
                {record.imageUrl && (
                  <img
                    src={record.imageUrl}
                    alt="Captured"
                    className="mt-2 w-16 h-16 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800"
                  />
                )}
              </div>

              {/* Tasks Breakdown */}
              {record.tasks && record.tasks.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    자동 분할된 노션 작업 ({record.tasks.length}건):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {record.tasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800/50 text-[11px]"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <span>{t.suggestedIcon || '📌'}</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0 font-medium">
                          {t.targetDbHint}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {record.notionPageUrls && record.notionPageUrls.length > 0 && (
                <div className="flex items-center space-x-2 pt-1">
                  {record.notionPageUrls.map((url, uIdx) => (
                    <a
                      key={uIdx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>노션 페이지 #{uIdx + 1} 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
