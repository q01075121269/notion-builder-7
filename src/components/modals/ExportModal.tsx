import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Share2, Copy, Check, FileText, X } from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, currentTemplate, showToast } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isExportModalOpen || !currentTemplate) return null;

  const generateMarkdownSummary = () => {
    let md = `# ${currentTemplate.icon || '📑'} ${currentTemplate.title}\n\n`;
    md += `> ${currentTemplate.description || '노션 템플릿'}\n\n`;
    
    const dbs = currentTemplate.databases || [];
    md += `## 🗄️ 데이터베이스 구성 (${dbs.length}개)\n\n`;
    dbs.forEach((db, i) => {
      md += `### ${i + 1}. ${db.name}\n`;
      if (db.description) md += `- **설명**: ${db.description}\n`;
      md += `- **속성(Properties)**:\n`;
      (db.properties || []).forEach(p => {
        md += `  - \`${p.name}\` (${p.type}${p.expression ? `: ${p.expression}` : ''}${p.target ? ` -> ${p.target}` : ''})\n`;
      });
      md += '\n';
    });

    md += `## 📑 페이지 레이아웃 구조\n\n`;
    (currentTemplate.page_layout || []).forEach((b) => {
      if (b.type === 'callout') {
        md += `> ${b.icon || '💡'} **Callout**: ${b.content}\n\n`;
      } else if (b.type === 'toggle') {
        md += `<details><summary><b>${b.title}</b></summary>\n\n${b.content || ''}\n</details>\n\n`;
      } else if (b.type === 'column_list') {
        md += `[2단 분할 레이아웃 배치]\n\n`;
      }
    });

    return md;
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownSummary());
      setCopied(true);
      showToast('마크다운 요약본이 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      console.error('클립보드 복사 실패:', err);
      showToast('클립보드 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-notion-dark-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">템플릿 내보내기 & 공유</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">현재 설계된 노션 구조를 활용하세요</p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium">마크다운(Markdown) 요약본</span>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 rounded-md hover:bg-neutral-50 transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : '클립보드 복사'}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              노션 페이지에 바로 붙여넣기(`Ctrl+V`)하여 개요를 빠르게 기록할 수 있는 텍스트 포맷입니다.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
            <p className="font-semibold flex items-center space-x-1">
              <span>🚀 2단계 확장 예정 알림: 공식 Notion API 원클릭 전송</span>
            </p>
            <p className="leading-relaxed text-amber-700 dark:text-amber-400">
              다음 2단계에서는 노션 공식 Integration 토큰을 연동하여, 버튼 클릭 한 번으로 사용자의 노션 워크스페이스에 실제 데이터베이스와 페이지가 즉시 생성되는 기능이 추가될 예정입니다!
            </p>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-notion-dark-border">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-4 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
