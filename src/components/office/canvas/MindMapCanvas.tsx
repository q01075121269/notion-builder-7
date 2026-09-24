import React, { useState, useRef, useMemo } from 'react';
import type { OfficeDocument, DocSection } from '../../../types/office';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Sparkles, 
  GitFork, 
  Plus, 
  ChevronRight, 
  Check
} from 'lucide-react';

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  sectionId?: string;
  children: MindMapNode[];
  isExpanded?: boolean;
  color?: string;
}

interface MindMapCanvasProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

const BRANCH_COLORS = [
  { stroke: '#6366f1', fill: '#eef2ff', text: '#4338ca', darkFill: '#312e81', darkText: '#c7d2fe' }, // indigo
  { stroke: '#8b5cf6', fill: '#f5f3ff', text: '#6d28d9', darkFill: '#4c1d95', darkText: '#ddd6fe' }, // purple
  { stroke: '#06b6d4', fill: '#ecfeff', text: '#0e7490', darkFill: '#164e63', darkText: '#a5f3fc' }, // cyan
  { stroke: '#10b981', fill: '#ecfdf5', text: '#047857', darkFill: '#064e3b', darkText: '#a7f3d0' }, // emerald
  { stroke: '#f59e0b', fill: '#fffbeb', text: '#b45309', darkFill: '#78350f', darkText: '#fde68a' }, // amber
  { stroke: '#ec4899', fill: '#fdf2f8', text: '#be185d', darkFill: '#831843', darkText: '#fbcfe8' }, // pink
];

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  document,
  onChangeDocument,
  onShowToast
}) => {
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toast = onShowToast || ((_m: string) => {});

  // 문서 섹션 데이터로부터 마인드맵 트리 구조 동적 생성
  const mindMapTree: MindMapNode = useMemo(() => {
    const root: MindMapNode = {
      id: 'root',
      text: document.title || '새 프로젝트 문서',
      level: 0,
      children: []
    };

    const sections = document.content.docsContent?.sections || [];
    if (sections.length === 0) {
      // 기본 데모 노드 제공
      root.children = [
        {
          id: 'branch-1',
          text: '1. 추진 배경 및 목표',
          level: 1,
          children: [
            { id: 'sub-1-1', text: '업무 자동화 생산성 320% 향상', level: 2, children: [] },
            { id: 'sub-1-2', text: '전사 결재 프로세스 통합', level: 2, children: [] }
          ]
        },
        {
          id: 'branch-2',
          text: '2. 핵심 기능 및 아키텍처',
          level: 1,
          children: [
            { id: 'sub-2-1', text: 'Gemini NotebookLM형 통합 스튜디오', level: 2, children: [] },
            { id: 'sub-2-2', text: '실시간 인플레이스 캔버스 렌더링', level: 2, children: [] },
            { id: 'sub-2-3', text: '다양한 포맷 즉시 변환', level: 2, children: [] }
          ]
        },
        {
          id: 'branch-3',
          text: '3. 실행 로드맵 및 예산',
          level: 1,
          children: [
            { id: 'sub-3-1', text: 'Q1 파일럿 런칭 및 피드백', level: 2, children: [] },
            { id: 'sub-3-2', text: 'Q2 전사 확대 도입', level: 2, children: [] }
          ]
        }
      ];
      return root;
    }

    let currentL1: MindMapNode | null = null;
    let currentL2: MindMapNode | null = null;

    sections.forEach((sec, idx) => {
      const cleanText = sec.text.replace(/^[0-9]+\.\s*|^□\s*|^○\s*|^―\s*/, '').trim();
      const nodeText = sec.marker ? `${sec.marker} ${cleanText}` : cleanText;

      if (sec.level === 1 || !currentL1) {
        currentL1 = {
          id: `sec-${sec.id || idx}`,
          sectionId: sec.id,
          text: nodeText,
          level: 1,
          children: []
        };
        root.children.push(currentL1);
        currentL2 = null;
      } else if (sec.level === 2) {
        currentL2 = {
          id: `sec-${sec.id || idx}`,
          sectionId: sec.id,
          text: nodeText,
          level: 2,
          children: []
        };
        currentL1.children.push(currentL2);
      } else {
        // level 3, 4
        const subNode: MindMapNode = {
          id: `sec-${sec.id || idx}`,
          sectionId: sec.id,
          text: nodeText,
          level: sec.level,
          children: []
        };
        if (currentL2) {
          currentL2.children.push(subNode);
        } else if (currentL1) {
          currentL1.children.push(subNode);
        }
      }
    });

    return root;
  }, [document]);

  // 마인드맵 레이아웃 좌표 계산 (루트 중앙, 좌/우 또는 우측으로 분기)
  // 여기서는 우측으로 시각화되는 세련된 계층적 방사형 트리 구조
  const layoutData = useMemo(() => {
    const rootX = 140;
    const rootY = 320;
    const l1SpacingY = 160;
    const l1X = 460;
    const l2X = 800;
    const l2SpacingY = 60;

    const nodes: Array<{
      node: MindMapNode;
      x: number;
      y: number;
      width: number;
      height: number;
      color: typeof BRANCH_COLORS[0];
      parentId?: string;
      parentX?: number;
      parentY?: number;
    }> = [];

    const links: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }> = [];

    const l1Count = mindMapTree.children.length;
    const totalL1Height = Math.max((l1Count - 1) * l1SpacingY, 300);
    const startL1Y = Math.max(80, rootY - totalL1Height / 2);

    // 루트 노드
    nodes.push({
      node: mindMapTree,
      x: rootX,
      y: rootY,
      width: 240,
      height: 64,
      color: BRANCH_COLORS[0]
    });

    mindMapTree.children.forEach((l1Node, l1Idx) => {
      const color = BRANCH_COLORS[l1Idx % BRANCH_COLORS.length];
      const isL1Collapsed = collapsedNodes[l1Node.id];
      const l1Y = startL1Y + l1Idx * l1SpacingY;

      nodes.push({
        node: l1Node,
        x: l1X,
        y: l1Y,
        width: 220,
        height: 52,
        color,
        parentId: mindMapTree.id,
        parentX: rootX + 240,
        parentY: rootY + 32
      });

      links.push({
        id: `link-root-${l1Node.id}`,
        x1: rootX + 240,
        y1: rootY + 32,
        x2: l1X,
        y2: l1Y + 26,
        color: color.stroke
      });

      if (!isL1Collapsed && l1Node.children.length > 0) {
        const l2Count = l1Node.children.length;
        const totalL2Height = (l2Count - 1) * l2SpacingY;
        const startL2Y = l1Y - totalL2Height / 2 + 26;

        l1Node.children.forEach((l2Node, l2Idx) => {
          const l2Y = startL2Y + l2Idx * l2SpacingY;
          nodes.push({
            node: l2Node,
            x: l2X,
            y: l2Y,
            width: 240,
            height: 44,
            color,
            parentId: l1Node.id,
            parentX: l1X + 220,
            parentY: l1Y + 26
          });

          links.push({
            id: `link-${l1Node.id}-${l2Node.id}`,
            x1: l1X + 220,
            y1: l1Y + 26,
            x2: l2X,
            y2: l2Y + 22,
            color: color.stroke
          });
        });
      }
    });

    return { nodes, links };
  }, [mindMapTree, collapsedNodes]);

  // 패닝 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 줌 조작
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // 노드 접기/펼치기 토글
  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // 새 가지(노드) 추가
  const handleAddBranch = () => {
    const newIdx = document.content.docsContent.sections.length + 1;
    const newSection: DocSection = {
      id: `sec-user-${Date.now()}`,
      level: 1,
      marker: `${newIdx}.`,
      text: `새 주요 전략 과제 ${newIdx}`
    };

    const updated: OfficeDocument = {
      ...document,
      content: {
        ...document.content,
        docsContent: {
          sections: [...document.content.docsContent.sections, newSection]
        }
      }
    };

    onChangeDocument(updated, '마인드맵 새 전략 가지 추가');
    toast('마인드맵에 새로운 전략 가지가 추가되었습니다.', 'success');
  };

  // 노드 텍스트 수정 적용
  const handleSaveEditNode = () => {
    if (!editingNodeId || !editingText.trim()) {
      setEditingNodeId(null);
      return;
    }

    if (editingNodeId === 'root') {
      const updated: OfficeDocument = {
        ...document,
        title: editingText.trim()
      };
      onChangeDocument(updated, '문서 중심 주제 수정');
    } else {
      const secId = selectedNode?.sectionId;
      if (secId) {
        const updatedSections = document.content.docsContent.sections.map(s => {
          if (s.id === secId) {
            return { ...s, text: editingText.trim() };
          }
          return s;
        });

        const updated: OfficeDocument = {
          ...document,
          content: {
            ...document.content,
            docsContent: { sections: updatedSections }
          }
        };
        onChangeDocument(updated, `마인드맵 노드 [${editingText.slice(0, 15)}] 수정`);
      }
    }

    setEditingNodeId(null);
    toast('노드 텍스트가 문서 원본에 즉시 반영되었습니다.', 'success');
  };

  // SVG 다운로드
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = window.document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${document.title.replace(/\s+/g, '_')}_mindmap.svg`;
    window.document.body.appendChild(downloadLink);
    downloadLink.click();
    window.document.body.removeChild(downloadLink);
    toast('마인드맵 벡터 SVG 파일이 다운로드되었습니다.', 'success');
  };

  // PNG 다운로드
  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = window.document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1600, 900);
        ctx.drawImage(img, 0, 0, 1600, 900);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = window.document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${document.title.replace(/\s+/g, '_')}_mindmap.png`;
        window.document.body.appendChild(downloadLink);
        downloadLink.click();
        window.document.body.removeChild(downloadLink);
        toast('마인드맵 고해상도 PNG 파일이 다운로드되었습니다.', 'success');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none relative overflow-hidden">
      
      {/* 1. 상단 마인드맵 인터랙션 컨트롤 바 */}
      <div className="h-12 px-5 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">인터랙티브 마인드맵 트리</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                실시간 양방향 동기화
              </span>
            </div>
            <p className="text-[11px] text-slate-400">문서 섹션 구조가 지능형 마인드맵 노드로 시각화됩니다.</p>
          </div>
        </div>

        {/* 우측 줌 & 액션 툴바 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddBranch}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            title="새로운 주요 전략 가지 추가"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>가지 추가</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* 줌 컨트롤 */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-slate-300 min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
              title="원래 크기로 리셋"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* 저장 및 내보내기 */}
          <button
            onClick={handleDownloadPng}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="고해상도 PNG 이미지 저장"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="벡터 SVG 파일 저장"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* 2. 중앙 인터랙티브 캔버스 뷰포트 (드래그 & 패닝 지원) */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 w-full h-full relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            width: '1800px',
            height: '1100px',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <svg
            ref={svgRef}
            width="1800"
            height="1100"
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '1800px', height: '1100px' }}
          >
            <defs>
              <linearGradient id="grad-root" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 유려한 3차 베지에 곡선 링크 */}
            {layoutData.links.map(link => {
              const dx = (link.x2 - link.x1) * 0.55;
              const pathD = `M ${link.x1} ${link.y1} C ${link.x1 + dx} ${link.y1}, ${link.x2 - dx} ${link.y2}, ${link.x2} ${link.y2}`;
              return (
                <path
                  key={link.id}
                  d={pathD}
                  fill="none"
                  stroke={link.color}
                  strokeWidth="2.5"
                  strokeOpacity="0.75"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* HTML 노드 렌더링 (인터랙션 및 텍스트 편집 완벽 지원) */}
          {layoutData.nodes.map(item => {
            const isRoot = item.node.level === 0;
            const isL1 = item.node.level === 1;
            const isSelected = selectedNode?.id === item.node.id;
            const isEditing = editingNodeId === item.node.id;
            const isCollapsed = collapsedNodes[item.node.id];
            const hasChildren = item.node.children && item.node.children.length > 0;

            return (
              <div
                key={item.node.id}
                className="interactive-node absolute group select-none transition-shadow"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  minHeight: `${item.height}px`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(item.node);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingNodeId(item.node.id);
                  setEditingText(item.node.text);
                }}
              >
                {/* 노드 카드 본체 */}
                <div
                  className={`
                    w-full h-full rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer border
                    ${isRoot
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white border-indigo-400 shadow-xl shadow-indigo-950/50'
                      : isL1
                        ? 'bg-slate-800/95 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-indigo-400 shadow-lg'
                        : 'bg-slate-800/75 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-500 shadow-sm'
                    }
                    ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 border-indigo-300' : ''}
                  `}
                  style={{
                    borderLeftWidth: !isRoot ? '4px' : undefined,
                    borderLeftColor: !isRoot ? item.color.stroke : undefined
                  }}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {isEditing ? (
                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditNode();
                            if (e.key === 'Escape') setEditingNodeId(null);
                          }}
                          className="w-full bg-slate-900 text-white text-xs px-2 py-1 rounded border border-indigo-400 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEditNode}
                          className="p-1 rounded bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        {isRoot && (
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 flex items-center space-x-1 mb-0.5">
                            <Sparkles className="w-3 h-3" />
                            <span>중심 기획 주제</span>
                          </div>
                        )}
                        <span 
                          className={`block truncate font-semibold ${
                            isRoot ? 'text-sm font-bold' : isL1 ? 'text-xs font-bold' : 'text-xs text-slate-300'
                          }`}
                          title={item.node.text}
                        >
                          {item.node.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 하위 노드 접기/펼치기 버튼 */}
                  {hasChildren && !isRoot && (
                    <button
                      onClick={(e) => toggleCollapse(item.node.id, e)}
                      className="p-1 rounded-full bg-slate-700/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer ml-1 shrink-0"
                      title={isCollapsed ? '하위 가지 펼치기' : '하위 가지 접기'}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 하단 힌트 풋터 */}
      <div className="h-8 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center space-x-3">
          <span>💡 <strong>Tip:</strong> 빈 공간 드래그로 이동, 노드 더블클릭 시 텍스트 즉시 편집</span>
          <span className="text-slate-600">|</span>
          <span>오른쪽 스튜디오 코파일럿에 "마인드맵 가지 추가해줘"라고 명령해도 자동 반영됩니다.</span>
        </div>
        <div>
          노드 수: <strong className="text-indigo-400">{layoutData.nodes.length}</strong>개
        </div>
      </div>

    </div>
  );
};
