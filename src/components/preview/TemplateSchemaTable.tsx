import React, { useState } from 'react';
import type { NotionDatabase, NotionProperty } from '../../types/notion';
import { 
  Database, 
  Table, 
  Kanban, 
  Calendar, 
  Grid, 
  Hash, 
  CheckSquare, 
  FileText, 
  Tag, 
  Layers, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ArrowRightLeft,
  Info
} from 'lucide-react';

interface TemplateSchemaTableProps {
  databases: NotionDatabase[];
}

export const TemplateSchemaTable: React.FC<TemplateSchemaTableProps> = ({ databases }) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [expandedDbs, setExpandedDbs] = useState<Record<string, boolean>>(() => {
    // 기본적으로 모든 DB 스키마 펼침
    const initial: Record<string, boolean> = {};
    databases.forEach((db, i) => {
      initial[db.name || `db-${i}`] = true;
    });
    return initial;
  });

  const toggleDb = (key: string) => {
    setExpandedDbs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyFormula = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFormula(code);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const renderTypeBadge = (type: NotionProperty['type']) => {
    switch (type) {
      case 'title':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            <FileText className="w-3 h-3" />
            <span>제목 (Title)</span>
          </span>
        );
      case 'formula':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>수식 2.0 (Formula)</span>
          </span>
        );
      case 'status':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <Tag className="w-3 h-3" />
            <span>상태 (Status)</span>
          </span>
        );
      case 'select':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Tag className="w-3 h-3" />
            <span>선택 (Select)</span>
          </span>
        );
      case 'multi_select':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
            <Layers className="w-3 h-3" />
            <span>다중 선택 (Multi)</span>
          </span>
        );
      case 'date':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
            <Calendar className="w-3 h-3" />
            <span>날짜 (Date)</span>
          </span>
        );
      case 'number':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            <Hash className="w-3 h-3" />
            <span>숫자 (Number)</span>
          </span>
        );
      case 'checkbox':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            <CheckSquare className="w-3 h-3" />
            <span>체크박스</span>
          </span>
        );
      case 'relation':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
            <ArrowRightLeft className="w-3 h-3" />
            <span>관계형 (Relation)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            <span>{type}</span>
          </span>
        );
    }
  };

  const renderViewTypeIcon = (viewType?: string) => {
    switch (viewType) {
      case 'board':
        return <Kanban className="w-4 h-4 text-amber-500" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-rose-500" />;
      case 'gallery':
        return <Grid className="w-4 h-4 text-emerald-500" />;
      case 'table':
      default:
        return <Table className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!databases || databases.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t-2 border-neutral-200/90 dark:border-neutral-800">
      {/* 섹션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              DB 스키마 및 속성/관계형 구조 분석
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                DB {databases.length}개 설계
              </span>
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            노션 워크스페이스에 생성될 각 데이터베이스의 컬럼 타입, Formula 2.0 계산 수식, 선택지 옵션 명세입니다.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-neutral-400">
          <Info className="w-3.5 h-3.5" />
          <span>실제 노션 API 스펙 100% 호환</span>
        </div>
      </div>

      {/* 데이터베이스 목록별 스키마 테이블 */}
      <div className="space-y-6">
        {databases.map((db, dbIdx) => {
          const key = db.name || `db-${dbIdx}`;
          const isExpanded = expandedDbs[key] !== false;
          const formulaCount = db.properties.filter(p => p.type === 'formula').length;
          const relationCount = db.properties.filter(p => p.type === 'relation').length;

          return (
            <div 
              key={dbIdx}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card shadow-xs overflow-hidden transition"
            >
              {/* DB 헤더 아코디언 토글 */}
              <div 
                onClick={() => toggleDb(key)}
                className="flex items-center justify-between px-5 py-4 bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 cursor-pointer select-none transition border-b border-neutral-200/80 dark:border-neutral-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-700 shadow-2xs">
                    {renderViewTypeIcon(db.view_type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {db.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
                        {db.view_type ? db.view_type.toUpperCase() : 'TABLE'} 뷰
                      </span>
                      {formulaCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          수식 {formulaCount}개
                        </span>
                      )}
                      {relationCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-semibold flex items-center gap-1">
                          <ArrowRightLeft className="w-2.5 h-2.5" />
                          관계형 {relationCount}개
                        </span>
                      )}
                    </div>
                    {db.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {db.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-neutral-400">
                    총 {db.properties.length}개 속성
                  </span>
                  <button className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 스키마 본문 테이블 */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                        <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                        <th className="py-2.5 px-4 font-semibold w-48">속성명 (Column)</th>
                        <th className="py-2.5 px-4 font-semibold w-36">데이터 타입</th>
                        <th className="py-2.5 px-4 font-semibold">세부 명세 (Formula 2.0 / 옵션 / 관계 대상)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {db.properties.map((prop, propIdx) => (
                        <tr key={propIdx} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition">
                          {/* 순번 */}
                          <td className="py-3 px-4 text-center font-mono text-neutral-400">
                            {propIdx + 1}
                          </td>

                          {/* 속성명 */}
                          <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                            <span className="font-mono text-[12px]">{prop.name}</span>
                          </td>

                          {/* 타입 배지 */}
                          <td className="py-3 px-4">
                            {renderTypeBadge(prop.type)}
                          </td>

                          {/* 세부 명세 (수식 구문, 옵션 태그, 관계형 대상) */}
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            {prop.type === 'formula' && prop.expression ? (
                              <div className="relative group p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                                <div className="flex items-center justify-between mb-1 text-[10px] text-purple-600 dark:text-purple-300 font-semibold">
                                  <span>Formula 2.0 Expression</span>
                                  <button
                                    onClick={() => handleCopyFormula(prop.expression || '')}
                                    className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer"
                                    title="수식 복사"
                                  >
                                    {copiedFormula === prop.expression ? (
                                      <>
                                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        <span>복사됨</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-2.5 h-2.5" />
                                        <span>복사</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <code className="block font-mono text-[11px] text-purple-900 dark:text-purple-200 break-all leading-relaxed whitespace-pre-wrap">
                                  {prop.expression}
                                </code>
                              </div>
                            ) : prop.options && prop.options.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {prop.options.map((opt, optIdx) => (
                                  <span 
                                    key={optIdx}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700"
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            ) : prop.type === 'relation' ? (
                              <div className="flex items-center space-x-1.5 text-cyan-700 dark:text-cyan-300 font-medium">
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>연결 대상 DB: <strong>{prop.target || '동일 워크스페이스 DB'}</strong></span>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic">
                                {prop.type === 'title' ? '기본 페이지 제목 필드' : '기본 단일 속성 값'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
