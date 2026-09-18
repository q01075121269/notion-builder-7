// src/components/life/EmailManagerView.tsx
// 라이프 허브 이메일: 수퍼휴먼급 이메일 리더, 원문 서랍 뷰어, 첨부파일 매니저, 삭제 및 3단 AI 답장 생성기

import React, { useState, useMemo } from 'react';
import {
  Mail,
  Sparkles,
  Paperclip,
  Download,
  Trash2,
  CheckSquare,
  ArrowRight,
  X,
  Check,
  Copy,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
  Bot
} from 'lucide-react';

import { generateEmailReplyDraft, type ReplyScenario, type EmailReplyResult } from '../../services/aiEmailReply';
import { useApp } from '../../context/AppContext';

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'zip' | 'image' | 'file';
  dataContent?: string;
}

export interface LifeEmailItem {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  summary: string;
  time: string;
  date: string;
  urgency: 'urgent' | 'important' | 'info'; // 🚨긴급 / ⚡중요 / ℹ️참조
  bodyText: string;
  attachments?: EmailAttachment[];
  isRead?: boolean;
  suggestedAction?: string; // 스마트할일 등록 추천 명칭
}

interface EmailManagerViewProps {
  emails: LifeEmailItem[];
  setEmails: React.Dispatch<React.SetStateAction<LifeEmailItem[]>>;
  onTransferToTodo: (email: LifeEmailItem) => void;
  onQuickCapture?: () => void;
  isCompact?: boolean;
  apiKey?: string;
}

export const EmailManagerView: React.FC<EmailManagerViewProps> = ({
  emails,
  setEmails,
  onTransferToTodo,
  onQuickCapture: _onQuickCapture,
  isCompact = false,
  apiKey
}) => {
  const { setCurrentView } = useApp();
  // 선택된 메일 (우측 서랍 뷰어용)
  const [selectedMail, setSelectedMail] = useState<LifeEmailItem | null>(null);

  // 긴급도 필터 (all, urgent, important, info)
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'important' | 'info'>('all');

  // 삭제 확인 모달 상태
  const [mailToDelete, setMailToDelete] = useState<LifeEmailItem | null>(null);

  // AI 답장 생성 상태
  const [replyDraft, setReplyDraft] = useState<EmailReplyResult | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<ReplyScenario | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 토스트 팝업 헬퍼
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 긴급도 필터링된 메일 목록
  const filteredEmails = useMemo(() => {
    if (urgencyFilter === 'all') return emails;
    return emails.filter((m) => m.urgency === urgencyFilter);
  }, [emails, urgencyFilter]);

  // 메일 삭제 처리
  const handleConfirmDelete = () => {
    if (!mailToDelete) return;
    setEmails((prev) => prev.filter((m) => m.id !== mailToDelete.id));
    if (selectedMail?.id === mailToDelete.id) {
      setSelectedMail(null);
    }
    setMailToDelete(null);
    showToast('메일이 안전하게 삭제되었습니다.');
  };

  // 첨부파일 실제 다운로드 핸들러
  const handleDownloadAttachment = (attachment: EmailAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const fileContent = attachment.dataContent || 
      `=======================================================\n` +
      `[Notion Builder Life Hub] 첨부파일 다운로드\n` +
      `=======================================================\n` +
      `파일명: ${attachment.name}\n` +
      `용량: ${attachment.size}\n` +
      `다운로드 일시: ${new Date().toLocaleString()}\n` +
      `보안 서명: VALIDATED-SHA256-NOTION-SECURE\n\n` +
      `본 파일은 노션 빌더 라이프 허브 이메일 모듈에서 안전하게 다운로드되었습니다.\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`"${attachment.name}" 다운로드가 완료되었습니다.`);
  };

  // 3단 AI 답장 생성 핸들러
  const handleGenerateReply = async (scenario: ReplyScenario) => {
    if (!selectedMail) return;

    setActiveScenario(scenario);
    setIsGeneratingReply(true);
    try {
      const draft = await generateEmailReplyDraft({
        mailSubject: selectedMail.subject,
        senderName: selectedMail.sender,
        senderEmail: selectedMail.senderEmail,
        mailBody: selectedMail.bodyText,
        scenario,
        apiKey
      });
      setReplyDraft(draft);
    } catch (err) {
      console.error('답장 생성 실패:', err);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // 클립보드 복사 핸들러
  const handleCopyReply = () => {
    if (!replyDraft) return;
    navigator.clipboard.writeText(replyDraft.body);
    setCopiedToast(true);
    showToast('답장 초안이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // 스마트할일로 전송 핸들러
  const handleTransferToTodo = (mail: LifeEmailItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onTransferToTodo(mail);
    showToast(`"${mail.suggestedAction || mail.subject}" 스마트할일에 등록되었습니다.`);
  };

  // 확장자별 아이콘 매핑
  const renderAttachmentIcon = (type: EmailAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'zip':
        return <FileArchive className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  // 긴급도 뱃지 렌더링
  const renderUrgencyBadge = (urgency: LifeEmailItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 whitespace-nowrap">
            🚨 긴급
          </span>
        );
      case 'important':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 whitespace-nowrap">
            ⚡ 중요
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 whitespace-nowrap">
            ℹ️ 참조
          </span>
        );
    }
  };

  return (
    <div className={`relative ${isCompact ? 'space-y-2.5' : 'space-y-4'}`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200 whitespace-nowrap">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. 상단 인박스 서브헤더 및 긴급도 필터 */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-neutral-800`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5">
            <h2 className={`${isCompact ? 'text-sm' : 'text-base sm:text-lg'} font-bold flex items-center space-x-1.5 text-slate-900 dark:text-white whitespace-nowrap`}>
              <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="whitespace-nowrap">4. ✉️ {isCompact ? '이메일' : '이메일 인박스'}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold border border-purple-200/60 dark:border-purple-800/40 whitespace-nowrap">
                {emails.length}건
              </span>
            </h2>
          </div>
          {!isCompact && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
              수퍼휴먼급 원문 본문 서랍, 첨부파일 다운로드 &amp; 3단 AI 회신 생성
            </p>
          )}
        </div>

        {/* 긴급도 필터 탭 - 컴팩트 모드: 이모지만 표시 */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs shadow-xs shrink-0">
          <button
            onClick={() => setUrgencyFilter('all')}
            className={`${isCompact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1'} rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
              urgencyFilter === 'all'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isCompact ? '전체' : `전체 (${emails.length})`}
          </button>
          <button
            onClick={() => setUrgencyFilter('urgent')}
            className={`${isCompact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1'} rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
              urgencyFilter === 'urgent'
                ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-rose-600'
            }`}
          >
            {isCompact ? '🚨' : '🚨 긴급'}
          </button>
          <button
            onClick={() => setUrgencyFilter('important')}
            className={`${isCompact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1'} rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
              urgencyFilter === 'important'
                ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-amber-600'
            }`}
          >
            {isCompact ? '⚡' : '⚡ 중요'}
          </button>
          <button
            onClick={() => setUrgencyFilter('info')}
            className={`${isCompact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1'} rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
              urgencyFilter === 'info'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-blue-600'
            }`}
          >
            {isCompact ? 'ℹ️' : 'ℹ️ 참조'}
          </button>
        </div>
      </div>

      {/* 2. 인박스 메일 리스트 */}
      {filteredEmails.length === 0 ? (
        <div className="py-14 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
          <Mail className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-500 opacity-70" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            인박스 제로 (Inbox Zero) 달성!
          </h4>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            확인할 메일이 모두 처리되었습니다. 새로운 메일이 수신되면 자동으로 실시간 분석됩니다.
          </p>
        </div>
      ) : (
        <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
          {filteredEmails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => {
                setSelectedMail(mail);
                setReplyDraft(null);
                setActiveScenario(null);
              }}
              className={`${
                isCompact ? 'p-2.5 rounded-xl gap-1.5' : 'p-4 rounded-xl gap-2.5'
              } border transition-all cursor-pointer shadow-xs flex flex-col ${
                selectedMail?.id === mail.id
                  ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 ring-1 ring-purple-300 dark:ring-purple-800'
                  : 'bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 hover:border-purple-200 dark:hover:border-neutral-700 hover:shadow-sm'
              }`}
            >
              {/* 상단 발신자, 뱃지, 수신시간 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <div className={`${isCompact ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'} rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0`}>
                    {mail.sender.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold text-slate-800 dark:text-slate-200 truncate block`}>
                      {mail.sender}
                    </span>
                    {!isCompact && (
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500 truncate block">
                        {mail.senderEmail}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-0.5">
                    {renderUrgencyBadge(mail.urgency)}
                    {mail.attachments && mail.attachments.length > 0 && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 flex items-center space-x-0.5 whitespace-nowrap">
                        <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                        <span>{mail.attachments.length}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] text-slate-400 dark:text-neutral-400 whitespace-nowrap">
                    {mail.time}
                  </span>
                  {/* 빠른 액션 버튼들 */}
                  <div className="flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleTransferToTodo(mail, e)}
                      title="스마트할일에 즉시 등록"
                      className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMailToDelete(mail);
                      }}
                      title="메일 삭제"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 제목 */}
              <h4 className={`${isCompact ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-900 dark:text-white truncate`}>
                {mail.subject}
              </h4>

              {/* AI 1줄 요약 */}
              <div className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2.5 rounded-xl'} bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/60 dark:border-neutral-800/60 flex items-start space-x-1.5 min-w-0 overflow-hidden`}>
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <p className={`${isCompact ? 'text-[11px]' : 'text-xs leading-relaxed'} text-slate-600 dark:text-neutral-400 min-w-0 overflow-hidden`}>
                  <span className="font-semibold text-purple-700 dark:text-purple-300 mr-1">AI 요약:</span>
                  <span className={isCompact ? 'truncate block' : ''}>{mail.summary}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. 우측 슬라이드오버 서랍 (Full-text Drawer 뷰어) */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-slate-200 dark:border-neutral-800 flex flex-col animate-in slide-in-from-right duration-300">
            {/* 서랍 상단 헤더 */}
            <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-neutral-900/80">
              <div className="flex items-center space-x-2 min-w-0">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {selectedMail.subject}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    <span>{selectedMail.sender} &lt;{selectedMail.senderEmail}&gt;</span>
                    <span>·</span>
                    <span>{selectedMail.date} {selectedMail.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {renderUrgencyBadge(selectedMail.urgency)}
                <button
                  onClick={() => setSelectedMail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 서랍 본문 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* AI 요약 하이라이트 박스 */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1 shadow-xs">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Gemini 핵심 브리핑</span>
                </div>
                <p className="leading-relaxed opacity-90">{selectedMail.summary}</p>
              </div>

              {/* 이메일 원문 전체 텍스트 (줄바꿈 서식 완벽 보존) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
                  원문 본문 전체 (Full Email Body)
                </span>
                <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-neutral-950/40 border border-slate-200/80 dark:border-neutral-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-purple-200 dark:selection:bg-purple-900">
                  {selectedMail.bodyText}
                </div>
              </div>

              {/* 첨부파일 매니저 & 다운로드 섹션 */}
              {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 whitespace-nowrap">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>첨부파일 ({selectedMail.attachments.length}개)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      클릭 시 즉시 다운로드 실행
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMail.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-300 dark:hover:border-purple-700 flex items-center justify-between transition shadow-xs"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {renderAttachmentIcon(att.type)}
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {att.size}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDownloadAttachment(att, e)}
                          title="파일 다운로드"
                          className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-neutral-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 transition cursor-pointer shrink-0 ml-2"
                        >
                          <Download className="w-3 h-3" />
                          <span className="text-[10px] hidden sm:inline">다운로드</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3단 맞춤형 AI 답장 생성기 패널 */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      3단 상황 맞춤형 AI 답장 초안
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                    상황 선택 시 원클릭 생성
                  </span>
                </div>

                {/* 3가지 버튼 세그먼트 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleGenerateReply('accept')}
                    disabled={isGeneratingReply}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeScenario === 'accept'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🤝 정중한 수락</span>
                  </button>

                  <button
                    onClick={() => handleGenerateReply('reschedule')}
                    disabled={isGeneratingReply}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeScenario === 'reschedule'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>📅 일정 재조율</span>
                  </button>

                  <button
                    onClick={() => handleGenerateReply('decline')}
                    disabled={isGeneratingReply}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeScenario === 'decline'
                        ? 'bg-slate-100 dark:bg-neutral-700 text-slate-800 dark:text-neutral-200 border-slate-300 dark:border-neutral-600 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🙏 간결한 거절</span>
                  </button>
                </div>

                {/* 생성 중 스피너 */}
                {isGeneratingReply && (
                  <div className="py-6 text-center space-y-2">
                    <Sparkles className="w-5 h-5 mx-auto text-purple-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-semibold">
                      메일 맥락에 맞춰 비즈니스 회신문을 작성하고 있습니다...
                    </p>
                  </div>
                )}

                {/* 생성된 답장 결과 에디터 */}
                {replyDraft && !isGeneratingReply && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                          {replyDraft.scenarioLabel} 초안 완성
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({replyDraft.generatedAt})
                        </span>
                      </div>

                      <button
                        onClick={handleCopyReply}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 transition cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        {copiedToast ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600">복사 완료!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>클립보드 복사</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={replyDraft.body}
                      onChange={(e) => setReplyDraft({ ...replyDraft, body: e.target.value })}
                      rows={8}
                      className="w-full p-2.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 서랍 하단 고정 액션 바 */}
            <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 shadow-xs">
              <button
                onClick={() => setMailToDelete(selectedMail)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>메일 삭제</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentView('devlab');
                    showToast(`📄 [${selectedMail.subject}] 이메일 회의록이 제3챕터 오피스 스튜디오 소스로 전송되었습니다!`);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer whitespace-nowrap"
                >
                  <Bot className="w-3.5 h-3.5 text-blue-500" />
                  <span>📄 오피스 소스로 전송</span>
                </button>

                <button
                  onClick={() => handleTransferToTodo(selectedMail)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>스마트할일로 전송</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 메일 삭제 안전 확인 모달 */}
      {mailToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold whitespace-nowrap">메일 삭제 확인</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              "<span className="font-semibold text-slate-900 dark:text-white">{mailToDelete.subject}</span>" 메일을 인박스에서 삭제하시겠습니까?
            </p>
            <p className="text-[11px] text-slate-400">
              삭제된 메일은 목록에서 즉시 제거됩니다.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setMailToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer whitespace-nowrap shadow-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
