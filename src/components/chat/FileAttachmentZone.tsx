import React from 'react';
import type { AttachedFile } from '../../types/fileAttachment';
import { 
  FileSpreadsheet, 
  FileText, 
  File, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface FileAttachmentZoneProps {
  files: AttachedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll?: () => void;
}

export const FileAttachmentZone: React.FC<FileAttachmentZoneProps> = ({
  files,
  onRemoveFile
}) => {
  if (files.length === 0) return null;

  const getFileIcon = (file: AttachedFile) => {
    switch (file.category) {
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'pdf':
        return <File className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'hwp':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <File className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getCategoryBadgeClass = (file: AttachedFile) => {
    switch (file.category) {
      case 'spreadsheet':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
      case 'document':
        return 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200';
      case 'pdf':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200';
      case 'image':
        return 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200';
      case 'hwp':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200';
    }
  };

  return (
    <div className="px-2 pt-2 pb-1 space-y-2">
      {/* Attached Files List */}
      <div className="flex flex-wrap items-center gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center space-x-2 pl-2.5 pr-2 py-1.5 rounded-xl border text-xs shadow-2xs transition animate-fadeIn ${getCategoryBadgeClass(file)}`}
          >
            {/* Thumbnail preview for images */}
            {file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-5 h-5 rounded object-cover border border-purple-300 dark:border-purple-700 shrink-0"
              />
            ) : (
              <span className="shrink-0">{getFileIcon(file)}</span>
            )}

            <div className="flex items-center space-x-1 max-w-[200px] truncate">
              <span className="font-semibold truncate" title={file.name}>
                {file.name}
              </span>
              <span className="text-[10px] opacity-70 shrink-0">
                ({file.sizeFormatted})
              </span>
            </div>

            {/* Parsing State */}
            {file.isParsing ? (
              <span className="flex items-center space-x-1 text-[10px] text-neutral-500">
                <Loader2 className="w-3 h-3 animate-spin text-neutral-600 dark:text-neutral-400" />
                <span className="hidden sm:inline">파싱 중</span>
              </span>
            ) : file.error ? (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold" title={file.error}>
                ⚠️ 오류
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400" title="파싱 완료">
                <CheckCircle2 className="w-3 h-3" />
              </span>
            )}

            {/* Extra badge info for spreadsheets */}
            {file.sheets && file.sheets.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100 font-medium">
                {file.sheets.length}개 시트
              </span>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
              title="첨부 파일 제거"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* HWP Alert Banner */}
      {files.some(f => f.isUnsupportedHwp) && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">한글 문서(.hwp, .hwpx) 안내</span>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              한글 파일은 전용 바이너리 포맷 보안 제약으로 브라우저 직접 파싱이 어렵습니다. 
              <strong>텍스트를 복사해 붙여넣거나 PDF로 변환 후 업로드</strong>해 주시면 즉시 템플릿으로 역설계됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
