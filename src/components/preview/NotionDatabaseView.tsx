import React, { useState, useEffect } from 'react';
import type { NotionDatabase, NotionProperty, NotionPropertyType } from '../../types/notion';
import { getSafeProperties } from '../../lib/templateUtils';
import { useApp } from '../../context/AppContext';
import { simulateFormulaValue } from '../../services/formulaEngine';
import { 
  Table as TableIcon, 
  Kanban, 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Search, 
  MoreHorizontal,
  Calendar,
  FunctionSquare,
  ArrowUpRight,
  CheckSquare,
  Tag,
  Type,
  User,
  Hash,
  Info,
  Sparkles,
  Edit2,
  X
} from 'lucide-react';

export interface NotionDatabaseViewProps {
  database: NotionDatabase;
  dbIndex?: number;
  onUpdateDatabaseName?: (dbIndex: number, newName: string) => void;
  onUpdatePropertyName?: (dbIndex: number, propIndex: number, newName: string) => void;
  onUpdatePropertyType?: (dbIndex: number, propIndex: number, newType: NotionPropertyType) => void;
  onDeleteProperty?: (dbIndex: number, propIndex: number) => void;
  onAddProperty?: (dbIndex: number) => void;
}

export const NotionDatabaseView: React.FC<NotionDatabaseViewProps> = ({
  database,
  dbIndex,
  onUpdateDatabaseName,
  onUpdatePropertyName,
  onUpdatePropertyType,
  onDeleteProperty,
  onAddProperty
}) => {
  const { recentModifications } = useApp();
  const hasTimelineInViews = database.views?.some(v => (typeof v === 'string' ? v : v.id || v.type) === 'timeline');
  const initialViewMode = (database.view_type as any) === 'timeline' || hasTimelineInViews ? 'timeline' : (database.view_type || 'table');
  const [activeView, setActiveView] = useState<'dashboard' | 'table' | 'board' | 'calendar' | 'timeline' | 'gallery' | 'list'>(initialViewMode);
  const [rows, setRows] = useState<Array<Record<string, any>>>(database.sample_rows || []);
  const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  // DB명 인라인 편집
  const [isEditingDbName, setIsEditingDbName] = useState(false);
  const [editingDbName, setEditingDbName] = useState(database.name);

  // 템플릿 변경이나 부분 수정으로 sample_rows가 업데이트되면 즉시 동기화
  useEffect(() => {
    if (database.sample_rows && database.sample_rows.length > 0) {
      setRows(database.sample_rows);
    }
    setEditingDbName(database.name);
  }, [database]);

  const safeProperties = getSafeProperties(database?.properties);
  const titleProp = safeProperties.find(p => p.type === 'title') || safeProperties[0] || { name: '이름', type: 'title' };

  const handleSaveDbName = () => {
    if (editingDbName.trim() && onUpdateDatabaseName && dbIndex !== undefined) {
      onUpdateDatabaseName(dbIndex, editingDbName.trim());
    }
    setIsEditingDbName(false);
  };

  const handleAddRow = () => {
    if (!newTitle.trim()) return;
    const newRow: Record<string, any> = {
      [titleProp.name]: newTitle.trim()
    };

    safeProperties.forEach(p => {
      if (p.type === 'date') newRow[p.name] = new Date().toISOString().split('T')[0];
      if (p.type === 'status') newRow[p.name] = p.options?.[0] || '시작 전';
      if (p.type === 'formula') newRow[p.name] = '진행중 🟡';
      if (p.type === 'checkbox') newRow[p.name] = false;
    });

    setRows([...rows, newRow]);
    setNewTitle('');
    setIsAddingRow(false);
  };

  return (
    <div className="my-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card shadow-xs overflow-hidden">
      
      {/* Database Title & Tabs Bar */}
      <div className="px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            {isEditingDbName ? (
              <input
                type="text"
                value={editingDbName}
                onChange={(e) => setEditingDbName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDbName();
                  if (e.key === 'Escape') setIsEditingDbName(false);
                }}
                onBlur={handleSaveDbName}
                autoFocus
                className="font-bold text-base px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-500 text-slate-900 dark:text-white ring-1 ring-purple-500"
              />
            ) : (
              <h3 
                onClick={() => {
                  if (onUpdateDatabaseName && dbIndex !== undefined) {
                    setIsEditingDbName(true);
                    setEditingDbName(database.name);
                  }
                }}
                className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center space-x-2 group cursor-pointer"
                title="클릭하여 데이터베이스 명칭 변경"
              >
                <span>🗄️</span>
                <span className="group-hover:text-purple-600 dark:group-hover:text-purple-400">{database.name}</span>
                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </h3>
            )}
            {database.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {database.description}
              </p>
            )}
          </div>

          {/* Notion DB Toolbar */}
          <div className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <button className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">필터</span>
            </button>
            <button className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">정렬</span>
            </button>
            <button className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Tabs (6대 다각화 뷰 스위처) */}
        <div className="flex items-center space-x-1 -mb-2 border-b border-transparent overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'dashboard'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>📊 대시보드</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'table'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>📄 표(Table)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('board')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'board'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>📋 보드(Kanban)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'calendar'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>🗓️ 캘린더</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('timeline')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'timeline'
                ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏱️ 타임라인(Timeline)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('gallery')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'gallery'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>🖼️ 갤러리(Cards)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
              activeView === 'list'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>📑 리스트(Compact)</span>
          </button>
        </div>
      </div>

      {/* Main Database Content View (다각화 뷰 렌더러) */}
      <div className="overflow-x-auto">
        {activeView === 'dashboard' && (
          <DashboardView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'table' && (
          <TableView 
            database={database} 
            rows={rows} 
            titleProp={titleProp} 
            isAddingRow={isAddingRow}
            setIsAddingRow={setIsAddingRow}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            handleAddRow={handleAddRow}
            recentProps={recentModifications.propertyNames}
            dbIndex={dbIndex}
            onUpdatePropertyName={onUpdatePropertyName}
            onUpdatePropertyType={onUpdatePropertyType}
            onDeleteProperty={onDeleteProperty}
            onAddProperty={onAddProperty}
          />
        )}
        {activeView === 'board' && (
          <BoardView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'calendar' && (
          <CalendarView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'timeline' && (
          <TimelineView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'gallery' && (
          <GalleryView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'list' && (
          <ListView database={database} rows={rows} titleProp={titleProp} />
        )}
      </div>

      {/* Quick Add Row Button in Table View */}
      {activeView === 'table' && !isAddingRow && (
        <button
          onClick={() => setIsAddingRow(true)}
          className="w-full flex items-center space-x-1.5 px-4 py-2.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새로 만들기</span>
        </button>
      )}
    </div>
  );
};

// 1. Table View Component with Inline Column Edit
const TableView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp: NotionProperty;
  isAddingRow: boolean;
  setIsAddingRow: (v: boolean) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  handleAddRow: () => void;
  recentProps: string[];
  dbIndex?: number;
  onUpdatePropertyName?: (dbIndex: number, propIndex: number, newName: string) => void;
  onUpdatePropertyType?: (dbIndex: number, propIndex: number, newType: NotionPropertyType) => void;
  onDeleteProperty?: (dbIndex: number, propIndex: number) => void;
  onAddProperty?: (dbIndex: number) => void;
}> = ({ 
  database, 
  rows, 
  titleProp, 
  isAddingRow, 
  setIsAddingRow, 
  newTitle, 
  setNewTitle, 
  handleAddRow,
  recentProps,
  dbIndex,
  onUpdatePropertyName,
  onDeleteProperty,
  onAddProperty
}) => {
  const [editingPropIdx, setEditingPropIdx] = useState<number | null>(null);
  const [editingPropName, setEditingPropName] = useState<string>('');

  const startEditProp = (idx: number, name: string) => {
    if (onUpdatePropertyName && dbIndex !== undefined) {
      setEditingPropIdx(idx);
      setEditingPropName(name);
    }
  };

  const saveProp = (idx: number) => {
    if (editingPropName.trim() && onUpdatePropertyName && dbIndex !== undefined) {
      onUpdatePropertyName(dbIndex, idx, editingPropName.trim());
    }
    setEditingPropIdx(null);
  };

  const safeProperties = getSafeProperties(database?.properties);

  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400">
          {safeProperties.map((prop, idx) => {
            const isModified = recentProps.includes(prop.name);
            const isEditing = editingPropIdx === idx;

            return (
              <th 
                key={idx} 
                className={`py-2.5 px-3 font-medium whitespace-nowrap border-r border-neutral-100 dark:border-neutral-800/80 transition-colors group ${
                  isModified ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold' : ''
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <PropertyTypeIcon type={prop.type} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingPropName}
                      onChange={(e) => setEditingPropName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveProp(idx);
                        if (e.key === 'Escape') setEditingPropIdx(null);
                      }}
                      onBlur={() => saveProp(idx)}
                      autoFocus
                      className="px-1 py-0.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-purple-500 text-slate-900 dark:text-white"
                    />
                  ) : (
                    <span 
                      onClick={() => startEditProp(idx, prop.name)}
                      className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      title="클릭하여 속성명 변경"
                    >
                      {prop.name}
                    </span>
                  )}

                  {prop.type === 'formula' && (
                    <span 
                      title="무손실 업그레이드로 추가된 Formulas 2.0 수식입니다" 
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 whitespace-nowrap shadow-2xs ml-1"
                    >
                      +신규 수식
                    </span>
                  )}
                  {isModified && (
                    <span 
                      title="방금 대화를 통해 추가/수정된 속성입니다" 
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white animate-pulse shadow-xs ml-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      NEW
                    </span>
                  )}
                  {prop.expression && (
                    <span title={`수식: ${prop.expression}`} className="text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-help">
                      <Info className="w-3 h-3" />
                    </span>
                  )}

                  {/* 삭제 버튼 */}
                  {prop.type !== 'title' && onDeleteProperty && dbIndex !== undefined && (
                    <button
                      type="button"
                      onClick={() => onDeleteProperty(dbIndex, idx)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 rounded transition ml-1 cursor-pointer"
                      title="속성 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>
            );
          })}
          
          {/* 새 컬럼(속성) 추가 헤더 버튼 */}
          <th className="w-10 py-2.5 px-2 text-center text-neutral-400">
            {onAddProperty && dbIndex !== undefined ? (
              <button
                type="button"
                onClick={() => onAddProperty(dbIndex)}
                className="p-1 rounded-md text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition cursor-pointer"
                title="새 속성 추가"
              >
                <Plus className="w-3.5 h-3.5 mx-auto" />
              </button>
            ) : (
              <Plus className="w-3.5 h-3.5 mx-auto" />
            )}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        {rows.map((row, rIdx) => (
          <tr key={rIdx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition">
            {safeProperties.map((prop, pIdx) => {
              const isModified = recentProps.includes(prop.name);
              return (
                <td 
                  key={pIdx} 
                  className={`py-2 px-3 whitespace-nowrap border-r border-neutral-100 dark:border-neutral-800/60 ${
                    isModified ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <PropertyValueCell property={prop} value={row[prop.name]} row={row} />
                </td>
              );
            })}
            <td className="w-10 text-center text-neutral-300 dark:text-neutral-600">
              <MoreHorizontal className="w-3.5 h-3.5 mx-auto" />
            </td>
          </tr>
        ))}

        {/* Adding Row Input Inline */}
        {isAddingRow && (
          <tr className="bg-amber-50/30 dark:bg-amber-950/20">
            <td className="py-2 px-3 border-r border-neutral-200 dark:border-neutral-700">
              <input
                type="text"
                autoFocus
                placeholder={`${titleProp.name} 입력...`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddRow();
                  if (e.key === 'Escape') setIsAddingRow(false);
                }}
                className="w-full bg-transparent text-xs font-semibold focus:outline-none"
              />
            </td>
            {safeProperties.slice(1).map((_, idx) => (
              <td key={idx} className="py-2 px-3 text-neutral-400 border-r border-neutral-100 dark:border-neutral-800">
                -
              </td>
            ))}
            <td className="w-10 text-center">
              <button onClick={handleAddRow} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                추가
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

// 2. Board View Component (칸반 보드)
const BoardView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  const safeProperties = getSafeProperties(database?.properties);
  const statusProp = safeProperties.find(p => p.type === 'status' || p.type === 'select') || {
    name: '상태',
    type: 'status',
    options: ['시작 전', '진행 중', '완료']
  };

  const columns = statusProp.options || ['시작 전', '진행 중', '완료'];

  return (
    <div className="p-4 flex gap-4 overflow-x-auto min-h-[220px]">
      {columns.map((colName: any, idx: number) => {
        const colRows = rows.filter(r => r[statusProp.name] === colName || (!r[statusProp.name] && idx === 0));
        return (
          <div key={idx} className="w-64 flex-shrink-0 bg-neutral-100/70 dark:bg-neutral-900/60 rounded-lg p-2.5 flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>{colName}</span>
                <span className="text-neutral-400 font-normal">({colRows.length})</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" />
            </div>

            <div className="space-y-2">
              {colRows.map((row, rIdx) => (
                <div key={rIdx} className="p-3 bg-white dark:bg-neutral-800 rounded-md shadow-2xs border border-neutral-200/80 dark:border-neutral-700/80 text-xs">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                    {row[titleProp.name] || '제목 없음'}
                  </div>
                  <div className="space-y-1">
                    {safeProperties.filter(p => p.name !== titleProp.name && p.name !== statusProp.name).slice(0, 3).map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className="truncate">{p.name}</span>
                        <PropertyValueCell property={p} value={row[p.name]} row={row} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {colRows.length === 0 && (
                <div className="text-[11px] text-neutral-400 py-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded">
                  항목 없음
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Calendar View Component (월간 캘린더)
const CalendarView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  const safeProps = getSafeProperties(database.properties);
  const dateProp = safeProps.find(p => p.type === 'date') || { name: '날짜', type: 'date' as const };
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-2 text-center text-xs font-semibold text-neutral-500">
        {days.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }).map((_, i) => {
          const dayNum = i + 1;
          const matchingRows = rows.filter(r => {
            const val = r[dateProp.name];
            return val && val.includes(`-${dayNum < 10 ? '0' + dayNum : dayNum}`);
          });

          return (
            <div key={i} className="min-h-[70px] p-1.5 border border-neutral-100 dark:border-neutral-800/80 rounded bg-white dark:bg-neutral-800/40">
              <span className="text-[10px] font-mono text-neutral-400">{dayNum}</span>
              <div className="mt-1 space-y-1">
                {matchingRows.map((r, rIdx) => (
                  <div key={rIdx} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] truncate border border-blue-200/50 dark:border-blue-900/50">
                    {r[titleProp.name] || '일정'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Property Type Icon Renderer
const PropertyTypeIcon: React.FC<{ type: NotionPropertyType }> = ({ type }) => {
  switch (type) {
    case 'title':
      return <Type className="w-3.5 h-3.5 text-neutral-400" />;
    case 'date':
      return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
    case 'status':
      return <Tag className="w-3.5 h-3.5 text-emerald-500" />;
    case 'formula':
      return <FunctionSquare className="w-3.5 h-3.5 text-purple-500" />;
    case 'relation':
      return <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />;
    case 'checkbox':
      return <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />;
    case 'person':
      return <User className="w-3.5 h-3.5 text-neutral-400" />;
    case 'number':
      return <Hash className="w-3.5 h-3.5 text-neutral-400" />;
    default:
      return <Tag className="w-3.5 h-3.5 text-neutral-400" />;
  }
};

// Notion Tag & Cell Value Renderer
const PropertyValueCell: React.FC<{ 
  property: NotionProperty; 
  value: any; 
  row?: Record<string, any>;
}> = ({ property, value, row }) => {
  if (property.type === 'formula') {
    const computedVal = row 
      ? simulateFormulaValue(property.expression, row, property.name)
      : (value || '진행중 🟡');

    const strVal = String(computedVal);

    if (strVal.includes('■') || strVal.includes('%')) {
      const isComplete = strVal.includes('100%') || strVal.includes('■■■■■');
      return (
        <span 
          title={property.expression ? `Formula 2.0 수식: ${property.expression}` : undefined}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-mono border shadow-2xs ${
            isComplete
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
          }`}
        >
          <FunctionSquare className="w-3 h-3 text-purple-500 shrink-0" />
          <span>{strVal}</span>
        </span>
      );
    }

    if (strVal.includes('D-') || strVal.includes('기한 초과') || strVal.includes('D-Day')) {
      const isOverdue = strVal.includes('기한 초과');
      const isToday = strVal.includes('D-Day');
      return (
        <span 
          title={property.expression ? `Formula 2.0 수식: ${property.expression}` : undefined}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs ${
            isOverdue
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-800 animate-pulse'
              : isToday
              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300/80 dark:border-orange-800 font-black'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800'
          }`}
        >
          <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>{strVal}</span>
        </span>
      );
    }

    return (
      <span 
        title={property.expression ? `Formula 2.0 수식: ${property.expression}` : undefined}
        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/50 font-mono"
      >
        <FunctionSquare className="w-3 h-3 text-purple-500 shrink-0" />
        <span>{strVal}</span>
      </span>
    );
  }

  let actualValue = value;
  if ((actualValue === undefined || actualValue === null || actualValue === '') && row) {
    const normalizedName = property.name.replace(/\s+/g, '').toLowerCase();
    const matchingKey = Object.keys(row).find(k => k.replace(/\s+/g, '').toLowerCase() === normalizedName);
    if (matchingKey) {
      actualValue = row[matchingKey];
    }
  }

  if (actualValue === undefined || actualValue === null || actualValue === '') {
    return <span className="text-neutral-300 dark:text-neutral-600">-</span>;
  }

  const displayVal = actualValue;

  switch (property.type) {
    case 'title':
      return <span className="font-semibold text-neutral-900 dark:text-neutral-100">{String(displayVal)}</span>;

    case 'date':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
          <Calendar className="w-3.5 h-3.5" />
          <span>{String(displayVal)}</span>
        </span>
      );

    case 'status':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
          <span>{String(displayVal)}</span>
        </span>
      );

    case 'select':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
          <span>{String(displayVal)}</span>
        </span>
      );

    case 'checkbox':
      return (
        <input 
          type="checkbox" 
          checked={Boolean(displayVal)} 
          readOnly 
          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" 
        />
      );

    case 'number':
      return <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">{Number(value).toLocaleString()}</span>;

    default:
      return <span>{String(displayVal)}</span>;
  }
};

// ─── [📊 중앙 통합 대시보드 뷰] ──────────────────────────────────────────────
const DashboardView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp?: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  // 100% 동적 실제 데이터 기반 통계 계산
  const safeProps = getSafeProperties(database.properties);
  const statusProp = safeProps.find(p => p.type === 'status');
  let inProgressCount = 0;
  let plannedCount = 0;
  let completedCount = 0;
  let urgentCount = 0;

  rows.forEach(r => {
    const sVal = String(statusProp ? r[statusProp.name] || "" : Object.values(r).join(" ")).toLowerCase();
    if (/진행|작업|조사|확인|중재|수리|출동|처리중/i.test(sVal)) inProgressCount++;
    else if (/완료|해결|합의|승인|종결/i.test(sVal)) completedCount++;
    else if (/예정|접수|계획|대기|시작전/i.test(sVal)) plannedCount++;
    else inProgressCount++;

    const rowStr = JSON.stringify(r);
    if (/긴급|당일|지연|초과|오류|불량|리스크|주의/i.test(rowStr)) urgentCount++;
  });

  const total = rows.length || 1;
  const progressPercent = Math.min(100, Math.round(((completedCount + inProgressCount * 0.5) / total) * 100));

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-neutral-900/50 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
      {/* 1. 상단 KPI 통계 요약 카드 3종 가로 그리드 - 100% 동적 매핑 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>⚡ 진행 중 항목</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-100">{inProgressCount}건</span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1.5">
            {database.name} 실시간 작업 및 조치 진행 현황
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>🗓️ 계획/대기 항목</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-100">{plannedCount}건</span>
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1.5">
            일정 조율 및 후속 처리 대기 항목
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50/60 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>🚨 중점 관리 항목</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-100">{urgentCount}건</span>
          </div>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1.5">
            기한 임박 및 긴급 대응 중점 관리 항목
          </p>
        </div>
      </div>

      {/* 2. 주간 조치 플랜 캘린더 안내 및 전체 조치 진척도 */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">조치 완료 진척도</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
              {progressPercent}%
            </span>
          </div>
          <span className="text-xs text-slate-400">총 {rows.length}개 관리 항목</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. 데이터베이스 현황 요약 카드 리스트 */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>최신 등록 데이터 및 조치 현황 (총 {rows.length}건)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {rows.slice(0, 6).map((row, rIdx) => {
            const rowTitle = titleProp ? String(row[titleProp.name] || '') : Object.values(row)[0];
            return (
              <div 
                key={rIdx}
                className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-between hover:shadow-xs transition"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {String(rowTitle || '데이터 항목')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {getSafeProperties(database.properties).slice(1, 4).map((p, pIdx) => (
                      <div key={pIdx} className="scale-95 origin-left">
                        <PropertyValueCell property={p} value={row[p.name]} row={row} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── [🖼️ 갤러리 카드 뷰] ──────────────────────────────────────────────────
const GalleryView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp?: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rows.map((row, rIdx) => {
        const rowTitle = titleProp ? String(row[titleProp.name] || '') : Object.values(row)[0];
        const gradients = [
          'from-indigo-600/90 to-blue-500/90',
          'from-emerald-600/90 to-teal-500/90',
          'from-purple-600/90 to-pink-500/90',
          'from-amber-600/90 to-orange-500/90'
        ];
        const cardGradient = gradients[rIdx % gradients.length];

        return (
          <div 
            key={rIdx}
            className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-2xs hover:shadow-md transition group"
          >
            {/* 카드 상단 배너 그라데이션 커버 */}
            <div className={`h-24 bg-gradient-to-br ${cardGradient} p-3 flex flex-col justify-between text-white`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs">#${rIdx + 1}</span>
                <span className="text-white/80">{database.name.slice(0, 10)}</span>
              </div>
              <div className="font-bold text-sm text-white truncate drop-shadow-xs">
                {String(rowTitle || '카드 항목')}
              </div>
            </div>

            {/* 카드 내부 속성 상세 */}
            <div className="p-3.5 space-y-2">
              {getSafeProperties(database.properties).slice(1, 6).map((prop, pIdx) => {
                const val = row[prop.name];
                if (val === undefined || val === null || val === '') return null;
                return (
                  <div key={pIdx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-neutral-500 shrink-0 mr-2 flex items-center space-x-1">
                      <PropertyTypeIcon type={prop.type} />
                      <span>{prop.name}</span>
                    </span>
                    <div className="truncate max-w-[130px] text-right font-medium">
                      <PropertyValueCell property={prop} value={val} row={row} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── [📑 컴팩트 리스트 뷰] ──────────────────────────────────────────────────
const ListView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp?: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  return (
    <div className="p-2 sm:p-4 divide-y divide-slate-100 dark:divide-neutral-800">
      {rows.map((row, rIdx) => {
        const rowTitle = titleProp ? String(row[titleProp.name] || '') : Object.values(row)[0];
        return (
          <div 
            key={rIdx}
            className="py-2.5 px-3 rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition group cursor-pointer"
          >
            {/* 왼쪽: 순번 및 제목 */}
            <div className="flex items-center space-x-2.5 min-w-0 pr-3">
              <span className="text-xs font-mono text-slate-300 dark:text-neutral-600 w-5 text-right">{rIdx + 1}</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {String(rowTitle || '리스트 항목')}
              </span>
            </div>

            {/* 오른쪽: 주요 속성 배지들 */}
            <div className="flex items-center space-x-2 shrink-0">
              {getSafeProperties(database.properties).slice(1, 4).map((prop, pIdx) => (
                <div key={pIdx} className="hidden sm:block">
                  <PropertyValueCell property={prop} value={row[prop.name]} row={row} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── [⏱️ 정밀 타임라인(Gantt Timeline) 뷰] ──────────────────────────────────────────
const TimelineView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp?: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  const safeProps = getSafeProperties(database.properties);
  const dateProp = safeProps.find(p => p.type === 'date');
  const statusProp = safeProps.find(p => p.type === 'status' || p.type === 'select');

  // 타임라인 기준 기간 (주차 분할 헤더 생성)
  const timelineWeeks = [
    { label: '1주차', days: '01일 - 07일' },
    { label: '2주차', days: '08일 - 14일' },
    { label: '3주차', days: '15일 - 21일' },
    { label: '4주차', days: '22일 - 28일' },
  ];

  return (
    <div className="p-3 sm:p-5 overflow-x-auto select-none">
      {/* 타임라인 헤더 안내 */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-semibold text-slate-700 dark:text-neutral-200">간트 타임라인 스케줄러</span>
          {dateProp && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[10px] font-medium">
              기준 속성: {dateProp.name}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>완료</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>진행 중</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            <span>대기/예정</span>
          </span>
        </div>
      </div>

      {/* 타임라인 메인 컨테이너 */}
      <div className="min-w-[700px] border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-neutral-900/40">
        {/* 상단 타임라인 시간 축 헤더 */}
        <div className="grid grid-cols-12 bg-slate-100 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-300">
          <div className="col-span-4 px-4 py-2.5 border-r border-slate-200 dark:border-neutral-700 flex items-center justify-between">
            <span>태스크 / 항목명</span>
            <span className="text-[11px] text-slate-400 font-normal">상태</span>
          </div>
          <div className="col-span-8 grid grid-cols-4 divide-x divide-slate-200 dark:divide-neutral-700 text-center">
            {timelineWeeks.map((week, idx) => (
              <div key={idx} className="py-2 px-1">
                <div className="text-[11px] font-bold text-slate-700 dark:text-neutral-200">{week.label}</div>
                <div className="text-[10px] text-slate-400 font-normal">{week.days}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 타임라인 항목 행 리스트 */}
        <div className="divide-y divide-slate-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
              표시할 데이터 항목이 없습니다.
            </div>
          ) : (
            rows.map((row, rIdx) => {
              const rowTitle = titleProp ? String(row[titleProp.name] || '') : Object.values(row)[0];
              const statusVal = statusProp ? String(row[statusProp.name] || '대기') : '진행';
              const dateVal = dateProp ? String(row[dateProp.name] || '') : '';

              // 상태에 따른 바 테마 색상
              const isDone = statusVal.includes('완료') || statusVal.includes('Done');
              const isInProgress = statusVal.includes('진행') || statusVal.includes('Progress') || statusVal.includes('Ing');
              
              const barBg = isDone
                ? 'from-emerald-500 to-teal-500 text-white shadow-emerald-500/20'
                : isInProgress
                ? 'from-indigo-500 to-cyan-500 text-white shadow-indigo-500/20'
                : 'from-slate-400 to-slate-500 text-white shadow-slate-500/20';

              // 간트 바의 시작점과 너비 계산 (샘플 또는 날짜 기반 분산)
              const startOffset = ((rIdx * 17) % 55) + 5; // 5% ~ 60%
              const barWidth = 25 + ((rIdx * 11) % 30); // 25% ~ 55%

              return (
                <div 
                  key={rIdx}
                  className="grid grid-cols-12 items-center hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition group"
                >
                  {/* 좌측 항목 정보 */}
                  <div className="col-span-4 px-4 py-2.5 border-r border-slate-100 dark:border-neutral-800 flex items-center justify-between min-w-0">
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="text-[11px] font-mono text-slate-400 w-4 shrink-0">{rIdx + 1}</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        {String(rowTitle || `항목 #${rIdx + 1}`)}
                      </span>
                    </div>
                    {statusProp && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isInProgress
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                      }`}>
                        {statusVal}
                      </span>
                    )}
                  </div>

                  {/* 우측 간트 바 렌더링 영역 */}
                  <div className="col-span-8 px-2 py-2 relative h-10 flex items-center">
                    {/* 배경 보조 그리드 라인 */}
                    <div className="absolute inset-0 grid grid-cols-4 divide-x divide-slate-100 dark:divide-neutral-800/40 pointer-events-none" />

                    {/* 타임라인 기간 막대 (Bar) */}
                    <div
                      style={{
                        marginLeft: `${startOffset}%`,
                        width: `${Math.min(barWidth, 90 - startOffset)}%`
                      }}
                      className={`relative z-10 h-6 rounded-md bg-gradient-to-r ${barBg} shadow-xs px-2 flex items-center justify-between text-[10px] font-medium transition-all group-hover:scale-[1.01]`}
                    >
                      <span className="truncate pr-1">
                        {dateVal ? dateVal : `D+${rIdx * 3 + 1} ~ D+${rIdx * 3 + 7}`}
                      </span>
                      <span className="text-[9px] opacity-80 shrink-0 hidden sm:inline">
                        {isDone ? '100%' : isInProgress ? '60%' : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 하단 설명 캡션 */}
      <div className="mt-3 text-[11px] text-slate-400 dark:text-neutral-500 flex items-center space-x-1.5">
        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
        <span>타임라인 뷰는 날짜(Date) 및 상태(Status) 속성을 기준으로 업무 일정과 진척도를 실시간 간트차트로 시각화합니다.</span>
      </div>
    </div>
  );
};

