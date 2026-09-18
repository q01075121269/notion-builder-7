import React, { useState, useEffect } from 'react';
import type { NotionDatabase, NotionProperty, NotionPropertyType } from '../../types/notion';
import { useApp } from '../../context/AppContext';
import { simulateFormulaValue } from '../../services/formulaEngine';
import { 
  Table as TableIcon, 
  Kanban, 
  Calendar as CalendarIcon, 
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
  Sparkles
} from 'lucide-react';

interface NotionDatabaseViewProps {
  database: NotionDatabase;
}

export const NotionDatabaseView: React.FC<NotionDatabaseViewProps> = ({ database }) => {
  const { recentModifications } = useApp();
  const initialView = (database.view_type === 'board' || database.view_type === 'calendar') 
    ? database.view_type 
    : 'table';
  const [activeView, setActiveView] = useState<'table' | 'board' | 'calendar'>(initialView);
  const [rows, setRows] = useState<Array<Record<string, any>>>(database.sample_rows || []);
  const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  // 템플릿 변경이나 부분 수정으로 sample_rows가 업데이트되면 즉시 동기화
  useEffect(() => {
    if (database.sample_rows && database.sample_rows.length > 0) {
      setRows(database.sample_rows);
    }
  }, [database]);

  const titleProp = database.properties.find(p => p.type === 'title') || database.properties[0];

  const handleAddRow = () => {
    if (!newTitle.trim()) return;
    const newRow: Record<string, any> = {
      [titleProp.name]: newTitle.trim()
    };

    database.properties.forEach(p => {
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
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <span>🗄️</span>
              <span>{database.name}</span>
            </h3>
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

        {/* View Tabs */}
        <div className="flex items-center space-x-1 -mb-2 border-b border-transparent">
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeView === 'table'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>표 (Table)</span>
          </button>
          <button
            onClick={() => setActiveView('board')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeView === 'board'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>보드 (Board)</span>
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeView === 'calendar'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>캘린더 (Calendar)</span>
          </button>
        </div>
      </div>

      {/* Main Database Content View */}
      <div className="overflow-x-auto">
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
          />
        )}
        {activeView === 'board' && (
          <BoardView database={database} rows={rows} titleProp={titleProp} />
        )}
        {activeView === 'calendar' && (
          <CalendarView database={database} rows={rows} titleProp={titleProp} />
        )}
      </div>

      {/* Quick Add Row Button in Table View */}
      {activeView === 'table' && !isAddingRow && (
        <button
          onClick={() => setIsAddingRow(true)}
          className="w-full flex items-center space-x-1.5 px-4 py-2.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새로 만들기</span>
        </button>
      )}
    </div>
  );
};

// 1. Table View Component with NEW/UPDATED Highlight
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
}> = ({ 
  database, 
  rows, 
  titleProp, 
  isAddingRow, 
  setIsAddingRow, 
  newTitle, 
  setNewTitle, 
  handleAddRow,
  recentProps 
}) => {
  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400">
          {database.properties.map((prop, idx) => {
            const isModified = recentProps.includes(prop.name);
            return (
              <th 
                key={idx} 
                className={`py-2.5 px-3 font-medium whitespace-nowrap border-r border-neutral-100 dark:border-neutral-800/80 transition-colors ${
                  isModified ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold' : ''
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <PropertyTypeIcon type={prop.type} />
                  <span>{prop.name}</span>
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
                </div>
              </th>
            );
          })}
          <th className="w-10 py-2.5 px-2 text-center text-neutral-400">
            <Plus className="w-3.5 h-3.5 mx-auto" />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        {rows.map((row, rIdx) => (
          <tr key={rIdx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition">
            {database.properties.map((prop, pIdx) => {
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
            {database.properties.slice(1).map((_, idx) => (
              <td key={idx} className="py-2 px-3 text-neutral-400 border-r border-neutral-100 dark:border-neutral-800">
                -
              </td>
            ))}
            <td className="w-10 text-center">
              <button onClick={handleAddRow} className="text-xs text-blue-600 font-bold hover:underline">
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
  const statusProp = database.properties.find(p => p.type === 'status' || p.type === 'select') || {
    name: '상태',
    type: 'status',
    options: ['시작 전', '진행 중', '완료']
  };

  const columns = statusProp.options || ['시작 전', '진행 중', '완료'];

  return (
    <div className="p-4 flex gap-4 overflow-x-auto min-h-[220px]">
      {columns.map((colName, idx) => {
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
              {colRows.map((item, rIdx) => (
                <div key={rIdx} className="p-3 bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-neutral-700/80 rounded-md shadow-xs space-y-2">
                  <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                    {item[titleProp.name] || '제목 없음'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {database.properties.filter(p => p.type === 'date' || p.type === 'formula').map((p, pIdx) => (
                      <div key={pIdx}>
                        <PropertyValueCell property={p} value={item[p.name]} row={item} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Calendar View Component (달력 목업)
const CalendarView: React.FC<{
  database: NotionDatabase;
  rows: Array<Record<string, any>>;
  titleProp: NotionProperty;
}> = ({ database, rows, titleProp }) => {
  const dateProp = database.properties.find(p => p.type === 'date') || { name: '일정', type: 'date' };
  const formulaProps = database.properties.filter(p => p.type === 'formula');

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
        <span className="flex items-center space-x-1.5">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <span>캘린더 연동 타임라인 ({dateProp.name} 기준)</span>
        </span>
        <span className="text-[11px] text-neutral-400">일정 데이터 {rows.length}건 매핑됨</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((row, idx) => (
          <div key={idx} className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                <Calendar className="w-3 h-3" />
                <span>{row[dateProp.name] || '날짜 미지정'}</span>
              </span>
              {row['상태'] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {row['상태']}
                </span>
              )}
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">
              {row[titleProp.name]}
            </div>
            {formulaProps.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {formulaProps.map((fp, fIdx) => (
                  <PropertyValueCell key={fIdx} property={fp} value={row[fp.name]} row={row} />
                ))}
              </div>
            )}
          </div>
        ))}
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
  // Formula 속성인 경우 formulaEngine으로 자동 계산 및 시뮬레이션
  if (property.type === 'formula') {
    const computedVal = row 
      ? simulateFormulaValue(property.expression, row, property.name)
      : (value || '진행중 🟡');

    const strVal = String(computedVal);

    // 1. 유니코드 진행률 게이지 스타일링
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

    // 2. D-Day 계산 스타일링
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

    // 3. 기본 Formula 2.0 렌더링
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

  if (value === undefined || value === null || value === '') {
    return <span className="text-neutral-300 dark:text-neutral-600">-</span>;
  }

  switch (property.type) {
    case 'title':
      return <span className="font-semibold text-neutral-900 dark:text-neutral-100">{String(value)}</span>;

    case 'date':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
          <Calendar className="w-3.5 h-3.5" />
          <span>{String(value)}</span>
        </span>
      );

    case 'status':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          {String(value)}
        </span>
      );

    case 'relation':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
          <ArrowUpRight className="w-3 h-3" />
          <span>{String(value)}</span>
        </span>
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          readOnly
          className="w-3.5 h-3.5 rounded border-neutral-300 text-blue-600 cursor-pointer"
        />
      );

    case 'select':
    case 'multi_select':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
          {String(value)}
        </span>
      );

    default:
      return <span>{String(value)}</span>;
  }
};
