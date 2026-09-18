import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface MermaidDiagramProps {
  chartCode: string;
  isSeniorMode?: boolean;
}

interface ParsedNode {
  id: string;
  label: string;
}

interface ParsedEdge {
  from: string;
  to: string;
  label?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chartCode, isSeniorMode = false }) => {
  // Mermaid graph TD / graph LR 구문 간단 파싱
  const parseMermaid = (code: string) => {
    const nodes: Map<string, ParsedNode> = new Map();
    const edges: ParsedEdge[] = [];

    const lines = code.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) continue;

      // Match A[Label] --> B[Label] or A --> B
      const edgeRegex = /([A-Za-z0-9_]+)(?:\[(.*?)\])?\s*-->\s*([A-Za-z0-9_]+)(?:\[(.*?)\])?/;
      const match = trimmed.match(edgeRegex);
      if (match) {
        const fromId = match[1];
        const fromLabel = match[2] || fromId;
        const toId = match[3];
        const toLabel = match[4] || toId;

        if (!nodes.has(fromId)) nodes.set(fromId, { id: fromId, label: fromLabel });
        else if (fromLabel !== fromId) nodes.set(fromId, { id: fromId, label: fromLabel });

        if (!nodes.has(toId)) nodes.set(toId, { id: toId, label: toLabel });
        else if (toLabel !== toId) nodes.set(toId, { id: toId, label: toLabel });

        edges.push({ from: fromId, to: toId });
      }
    }

    // Fallback: 파싱 결과가 없으면 기본 순서도 구성
    if (nodes.size === 0) {
      return [
        { id: '1', label: '✏️ 1. 할 일/내용 적기' },
        { id: '2', label: '📅 2. 마감 날짜 고르기' },
        { id: '3', label: '🗓️ 3. 달력에서 한눈에 확인' },
        { id: '4', label: '✅ 4. 완료 누르고 정리!' }
      ];
    }

    return Array.from(nodes.values());
  };

  const nodeList = parseMermaid(chartCode);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 dark:from-neutral-900/90 dark:via-neutral-800/80 dark:to-blue-950/20 p-5 border border-neutral-200/90 dark:border-notion-dark-border shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-700/60 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className={`font-bold text-neutral-900 dark:text-white ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
            한눈에 쏙 들어오는 데이터 순서도
          </span>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          왼쪽에서 오른쪽으로 물 흐르듯 진행돼요
        </span>
      </div>

      {/* Visual Flow Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 overflow-x-auto py-2">
        {nodeList.map((node, index) => {
          const isLast = index === nodeList.length - 1;
          const bgColors = [
            'from-blue-500/10 to-blue-600/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
            'from-amber-500/10 to-amber-600/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
            'from-purple-500/10 to-purple-600/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
            'from-emerald-500/10 to-emerald-600/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          ];
          const colorClass = bgColors[index % bgColors.length];

          return (
            <React.Fragment key={node.id}>
              {/* Step Card */}
              <div
                className={`flex-1 min-w-[140px] w-full sm:w-auto p-3.5 rounded-xl border bg-gradient-to-br ${colorClass} shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center space-y-1`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shadow-xs">
                    {index + 1}
                  </span>
                  <span className={`font-bold tracking-tight ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                    {node.label}
                  </span>
                </div>
                {isLast && (
                  <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 pt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>최종 완료!</span>
                  </div>
                )}
              </div>

              {/* Arrow Connector */}
              {!isLast && (
                <div className="shrink-0 flex items-center justify-center text-neutral-300 dark:text-neutral-600 my-1 sm:my-0">
                  <ArrowRight className="w-5 h-5 transform rotate-90 sm:rotate-0" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
};
