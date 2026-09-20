import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ExternalLink, 
  CheckCircle2, 
  Database, 
  Copy, 
  Check, 
  Sparkles,
  X
} from 'lucide-react';

export const PublishSuccessModal: React.FC = () => {
  const { 
    isPublishSuccessModalOpen, 
    setIsPublishSuccessModalOpen, 
    createdNotionResource 
  } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ESC 키 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPublishSuccessModalOpen) {
        setIsPublishSuccessModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPublishSuccessModalOpen, setIsPublishSuccessModalOpen]);

  if (!isPublishSuccessModalOpen || !createdNotionResource) return null;

  const handleCopy = async (text: string, idKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(idKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={() => setIsPublishSuccessModalOpen(false)}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-2xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text animate-scaleUp cursor-default relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-600" />

        {/* Top Close (X) Button */}
        <button
          onClick={() => setIsPublishSuccessModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Success Title */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
              노션 워크스페이스에 배포 완료!
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              요청하신 노션 페이지, 데이터베이스(일정·수식·상태), 블록 레이아웃이 실제 사용자의 노션에 정상 생성되었습니다.
            </p>
          </div>

          {/* Created Page Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100/60 dark:from-neutral-800/80 dark:to-neutral-850 border border-neutral-200 dark:border-neutral-700/80 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="text-3xl select-none">{createdNotionResource.pageIcon || '👑'}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  생성된 메인 페이지
                </span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                  {createdNotionResource.pageTitle}
                </h3>
              </div>
            </div>

            {/* Direct Open Button */}
            <a
              href={createdNotionResource.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm group cursor-pointer"
            >
              <span>내 노션 템플릿 지금 열기</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Created Databases List & IDs (State Maintenance) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>생성된 데이터베이스 식별자 ({createdNotionResource.databases.length}개)</span>
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {createdNotionResource.databases.map((db, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 text-xs border border-neutral-200/60 dark:border-neutral-700/60"
                >
                  <div className="flex items-center space-x-2 truncate mr-2">
                    <span className="text-neutral-400">🗂️</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {db.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(db.id, `db-${idx}`)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[11px] font-mono hover:bg-neutral-50 transition border border-neutral-200 dark:border-neutral-600 cursor-pointer"
                    title="Database ID 복사"
                  >
                    {copiedId === `db-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>ID 복사</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 3 Hint Notice */}
          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-[11px] text-purple-900 dark:text-purple-300 space-y-1">
            <div className="font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>3단계 연동 준비 완료 (식별자 상태 보존)</span>
            </div>
            <p className="text-purple-700 dark:text-purple-400 leading-relaxed">
              생성된 페이지 및 DB 식별자가 브라우저 상태에 저장되었습니다. 대화창을 통해 <strong>"방금 만든 DB에 담당자 속성 추가해줘"</strong>와 같이 부분 수정을 요청해보세요!
            </p>
          </div>

          {/* Bottom Clear Confirm / Close Button */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              onClick={() => setIsPublishSuccessModalOpen(false)}
              className="w-full py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>✨ 확인 및 작업실로 돌아가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
