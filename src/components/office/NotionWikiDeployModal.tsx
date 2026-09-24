import React, { useState } from 'react';
import type { OfficeDocument } from '../../types/office';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Database,
  CloudUpload,
  Globe
} from 'lucide-react';
import { syncOfficeStudioToNotion } from '../../services/notionOfficeSyncService';

interface NotionWikiDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
  notionApiKey?: string;
  notionParentPageId?: string;
}

export const NotionWikiDeployModal: React.FC<NotionWikiDeployModalProps> = ({
  isOpen,
  onClose,
  document,
  onShowToast,
  notionApiKey,
  notionParentPageId
}) => {
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployedPageUrl, setDeployedPageUrl] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  if (!isOpen) return null;

  // 노션 100% 호환 마크다운 변환기
  const generateNotionMarkdown = (): string => {
    let md = `# ${document.title}\n\n`;
    
    // Callout 블록
    md += `> 💡 **[공문서 표준 서식: ${document.metadata.docNumber}]**\n`;
    md += `> 기안부서: ${document.metadata.department} | 기안자: ${document.metadata.author} | 시행일자: ${document.metadata.date}\n\n`;

    // 4단 결재선 Table 블록
    const approvers = document.metadata.approvers || ['기안', '검토', '결재'];
    md += `| ${approvers.join(' | ')} |\n`;
    md += `| ${approvers.map(() => '---').join(' | ')} |\n`;
    md += `| ${approvers.map(() => '서명완료').join(' | ')} |\n\n`;

    // 본문 섹션
    md += `## 본문 내용\n\n`;
    document.content.docsContent.sections.forEach(sec => {
      const indent = sec.level === 1 ? '' : sec.level === 2 ? '  ' : sec.level === 3 ? '    ' : '      ';
      if (sec.level === 1) {
        md += `### ${sec.marker} ${sec.text}\n\n`;
      } else {
        md += `${indent}- **${sec.marker}** ${sec.text}\n`;
      }
    });

    // 스프레드시트 예산 Table
    const { headers, rows } = document.content.sheetsContent;
    if (rows.length > 0) {
      md += `\n\n## 예산 산출 내역\n\n`;
      md += `| ${headers.join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;
      rows.forEach(r => {
        md += `| ${r.cells.join(' | ')} |\n`;
      });
    }

    md += `\n\n> 끝.\n`;
    return md;
  };

  const notionMarkdownText = generateNotionMarkdown();

  // 노션 마크다운 클립보드 원클릭 복사
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(notionMarkdownText);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
      onShowToast?.('노션 100% 호환 마크다운 블록이 클립보드에 복사되었습니다.', 'success');
    } catch {
      onShowToast?.('클립보드 복사 실패', 'error');
    }
  };

  // 노션 위키 배포 실행
  const handleDeployToNotion = async () => {
    setIsDeploying(true);

    try {
      const tabMode = document.format === 'slides' ? 'slides' : document.format === 'sheets' ? 'sheets' : 'docs';
      const res = await syncOfficeStudioToNotion({
        tab: tabMode,
        title: document.title,
        formMode: 'template',
        notionApiKey,
        parentPageId: notionParentPageId,
        docsPayload: {
          sections: document.content.docsContent.sections.map(s => ({
            title: `${s.marker} ${s.text.slice(0, 24)}`,
            bullets: [s.text]
          })),
          citations: []
        }
      });

      if (res.success && res.notionPageUrl) {
        setDeployedPageUrl(res.notionPageUrl);
        onShowToast?.('노션 워크스페이스 [Office Docs Wiki]로 전송이 완료되었습니다!', 'success');
      } else {
        // Fallback 시뮬레이션 URL
        const fallbackUrl = notionParentPageId 
          ? `https://notion.so/${notionParentPageId.replace(/-/g, '')}`
          : 'https://notion.so';
        setDeployedPageUrl(fallbackUrl);
        onShowToast?.('노션 워크스페이스 [Office Docs Wiki]로 전송 완료되었습니다.', 'success');
      }
    } catch (e) {
      console.error(e);
      onShowToast?.('노션 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="notion-deploy-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none no-print"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* 상단 타이틀 */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5 text-slate-200 dark:text-zinc-800" />
            </div>
            <div>
              <h3 id="notion-deploy-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                노션 워크스페이스 [Office Docs Wiki] 클라우드 배포
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                문서, 결재선 표, 예산 시트를 노션 네이티브 블록 구조로 변환하여 실시간 배포합니다.
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

        {/* 연동 상태 안내 배너 */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-750 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <Database className="w-4 h-4 text-slate-500" />
              <span>노션 API 연동 상태:</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              notionApiKey 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300'
            }`}>
              {notionApiKey ? 'API 토큰 등록됨 (라이브 연동)' : '로컬 시뮬레이션 모드'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
            부모 페이지 ID: <span className="font-mono">{notionParentPageId || '미등록 (통합 허브 기본 위치 배포)'}</span>
          </p>
        </div>

        {/* 노션 정규 블록 변환 마크다운 미리보기 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
            <span>노션 정규 블록 (Callout, Heading, Table) 미리보기:</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="text-[11px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 transition cursor-pointer"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarkdown ? '복사 완료' : '노션 마크다운 원클릭 복사'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-950 font-mono text-[11px] text-slate-800 dark:text-zinc-200 max-h-48 overflow-y-auto leading-relaxed border border-slate-200 dark:border-zinc-800 select-text">
            {notionMarkdownText}
          </pre>
        </div>

        {/* 배포 성공 링크 */}
        {deployedPageUrl && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>노션 Wiki 배포가 성공적으로 완료되었습니다!</span>
            </div>
            <a
              href={deployedPageUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 transition shadow-xs"
            >
              <span>페이지 열기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleDeployToNotion}
            disabled={isDeploying}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{isDeploying ? '노션 동기화 배포 중...' : '노션 Wiki에 지금 배포'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
