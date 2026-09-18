import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Code2, Copy, Check, Download, X } from 'lucide-react';

export const RawJsonModal: React.FC = () => {
  const { isRawJsonModalOpen, setIsRawJsonModalOpen, currentTemplate, showToast } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isRawJsonModalOpen || !currentTemplate) return null;

  const jsonString = JSON.stringify(currentTemplate, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast('노션 구조 원시 JSON이 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      console.error('클립보드 복사 실패:', err);
      showToast('클립보드 복사에 실패했습니다.', 'error');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (currentTemplate.title || 'template').replace(/[^a-zA-Z0-9가-힣_-]+/g, '_');
      a.download = `${safeTitle}_notion_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('JSON 템플릿 파일이 다운로드되었습니다!', 'success');
    } catch (err: any) {
      console.error('다운로드 실패:', err);
      showToast('다운로드 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-notion-dark-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">노션 구조 원시 데이터 (Raw JSON)</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Gemini가 생성한 노션 규격 JSON 포맷입니다</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : 'JSON 복사'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>다운로드</span>
            </button>
            <button
              onClick={() => setIsRawJsonModalOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-neutral-900 text-neutral-100 font-mono text-xs leading-relaxed selection:bg-neutral-700">
          <pre className="whitespace-pre-wrap break-all">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-notion-dark-border text-xs text-neutral-500 dark:text-neutral-400">
          <span>데이터베이스 {currentTemplate.databases.length}개 / 레이아웃 블록 {currentTemplate.page_layout.length}개</span>
          <button
            onClick={() => setIsRawJsonModalOpen(false)}
            className="px-4 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
