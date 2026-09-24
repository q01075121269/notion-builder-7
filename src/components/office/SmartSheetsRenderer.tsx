import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Columns,
  CheckSquare,
  Globe,
  Table
} from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'formula';
  width?: string;
  align?: 'left' | 'right' | 'center';
}

export interface SheetRowData {
  id: string;
  rowIdx: number;
  item: string;
  qty: number;
  price: number;
  note: string;
  sourceBadge?: string;
  sourceUrl?: string;
  [key: string]: any;
}

interface SmartSheetsRendererProps {
  formMode?: 'free' | 'template';
  initialRows?: SheetRowData[];
  onRowsChange?: (rows: SheetRowData[]) => void;
}

export const SmartSheetsRenderer: React.FC<SmartSheetsRendererProps> = ({
  formMode = 'free',
  initialRows,
  onRowsChange
}) => {

  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'rowIdx', label: '#', type: 'number', width: 'w-12', align: 'center' },
    { key: 'item', label: 'B열 (품목명 / 항목)', type: 'text', width: 'w-auto', align: 'left' },
    { key: 'qty', label: 'C열 (수량)', type: 'number', width: 'w-24', align: 'right' },
    { key: 'price', label: 'D열 (단가)', type: 'currency', width: 'w-32', align: 'right' },
    { key: 'subtotal', label: 'E열 (공급가액 = C*D)', type: 'formula', width: 'w-36', align: 'right' },
    { key: 'note', label: 'F열 (비고 및 출처)', type: 'text', width: 'w-44', align: 'left' },
  ]);

  const defaultFreeRows: SheetRowData[] = [
    { id: 'r1', rowIdx: 1, item: 'AI 모델 API (Gemini 3.6 Flash)', qty: 10, price: 150000, note: '주간 라이선스', sourceBadge: '[웹크롤링]', sourceUrl: 'https://coupang.com/search?q=리뷰데이터' },
    { id: 'r2', rowIdx: 2, item: '노션 팀 워크스페이스 구독료', qty: 5, price: 45000, note: '연간 할인', sourceBadge: '[RAG 팩트]', sourceUrl: 'https://notion.so/pricing' },
    { id: 'r3', rowIdx: 3, item: '고화질 미디어 렌더링 서버', qty: 2, price: 320000, note: 'GPU 인스턴스', sourceBadge: '[PDF 팩트]', sourceUrl: '2026_Q4_사업계획서.pdf' },
    { id: 'r4', rowIdx: 4, item: '클라우드 DB 백업 보관함', qty: 1, price: 120000, note: 'IndexedDB 동기화', sourceBadge: '[지출규정]', sourceUrl: '표준_지출결의서_지침.md' },
    { id: 'r5', rowIdx: 5, item: '스마트 시트 수식 엔진 모듈', qty: 1, price: 250000, note: 'Rows 연산 규격' },
  ];

  const defaultTemplateRows: SheetRowData[] = [
    { id: 'r1', rowIdx: 1, item: 'Q4 AI 컨퍼런스 참가비', qty: 3, price: 120000, note: '품의 승인 건', sourceBadge: '[품의서]', sourceUrl: 'DOC-2026-Q4' },
    { id: 'r2', rowIdx: 2, item: '사내 개발용 모니터 장비', qty: 2, price: 250000, note: '지출결의서-01', sourceBadge: '[구매서식]', sourceUrl: 'DOC-2026-Q4' },
  ];

  const [rows, setRows] = useState<SheetRowData[]>(() => {
    if (initialRows && initialRows.length > 0) return initialRows;
    return formMode === 'template' ? defaultTemplateRows : defaultFreeRows;
  });

  const [filterKeyword, setFilterKeyword] = useState('');
  const [formulaMode, setFormulaMode] = useState<'SUM' | 'AVERAGE'>('SUM');
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set(['r1-item']));
  const [activeTooltipRow, setActiveTooltipRow] = useState<SheetRowData | null>(null);

  const formatCurrency = (val: number) => `₩${val.toLocaleString('ko-KR')}`;
  const getSubtotal = (r: SheetRowData) => (r.qty || 0) * (r.price || 0);

  const filteredRows = useMemo(() => {
    if (!filterKeyword.trim()) return rows;
    const kw = filterKeyword.toLowerCase();
    return rows.filter((r) => 
      r.item.toLowerCase().includes(kw) || 
      (r.note && r.note.toLowerCase().includes(kw))
    );
  }, [rows, filterKeyword]);

  const totalSum = useMemo(() => rows.reduce((acc, r) => acc + getSubtotal(r), 0), [rows]);
  const totalAvg = useMemo(() => rows.length === 0 ? 0 : Math.round(totalSum / rows.length), [rows, totalSum]);

  const updateRowsState = (newRows: SheetRowData[]) => {
    setRows(newRows);
    if (onRowsChange) onRowsChange(newRows);
  };

  const handleAddRow = () => {
    const newIdx = rows.length + 1;
    const newRow: SheetRowData = {
      id: `r-${Date.now()}`,
      rowIdx: newIdx,
      item: '신규 수집 지출 항목',
      qty: 1,
      price: 50000,
      note: '비고',
      sourceBadge: '[직접입력]'
    };
    updateRowsState([...rows, newRow]);
  };

  const handleAddColumn = () => {
    const colLetter = String.fromCharCode(65 + columns.length);
    const newColKey = `custom_${Date.now()}`;
    const newCol: ColumnDef = {
      key: newColKey,
      label: `${colLetter}열 (추가 항목)`,
      type: 'text',
      width: 'w-32',
      align: 'left'
    };
    setColumns((prev) => [...prev, newCol]);
    setRows((prev) => prev.map((r) => ({ ...r, [newColKey]: '-' })));
  };

  const handleDeleteRow = (id: string) => {
    const updated = rows.filter((r) => r.id !== id).map((r, idx) => ({ ...r, rowIdx: idx + 1 }));
    updateRowsState(updated);
  };

  const handleCellChange = (id: string, field: string, val: any) => {
    const updated = rows.map((r) => {
      if (r.id === id) return { ...r, [field]: val };
      return r;
    });
    updateRowsState(updated);
  };

  const toggleSelectCell = (cellId: string, row: SheetRowData) => {
    setSelectedCellIds((prev) => {
      const next = new Set(prev);
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
      return next;
    });
    setActiveTooltipRow(row);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md rounded-3xl p-6 sm:p-8 space-y-5 select-none relative">
      
      {/* 1. 상단 컨트롤 툴바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              스마트 시트 (Rows Engine Grid)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {formMode === 'template' ? '표준 지출결의서 서식' : '자유 기획 서식'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            프로젝트 예산 및 지출결의서 테이블
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="필터 검색..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-emerald-500 w-32 sm:w-40"
            />
          </div>

          <button onClick={handleAddRow} className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold transition">
            <Plus className="w-3.5 h-3.5" />
            <span>행 추가</span>
          </button>

          <button onClick={handleAddColumn} className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition">
            <Columns className="w-3.5 h-3.5 text-blue-500" />
            <span>열 추가</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200 dark:border-neutral-700">
            <button onClick={() => setFormulaMode('SUM')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${formulaMode === 'SUM' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>=SUM()</button>
            <button onClick={() => setFormulaMode('AVERAGE')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${formulaMode === 'AVERAGE' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>=AVG()</button>
          </div>
        </div>
      </div>

      {/* 출처 툴팁 노출 패널 */}
      {activeTooltipRow?.sourceBadge && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <div>
              <span className="font-extrabold text-blue-900 dark:text-blue-300">
                [선택 행 원천 출처] {activeTooltipRow.sourceBadge}
              </span>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                {activeTooltipRow.sourceUrl || 'Source Vault 지식 소스'}
              </p>
            </div>
          </div>
          <button onClick={() => setActiveTooltipRow(null)} className="text-[10px] text-slate-400 hover:text-slate-600">닫기 ✕</button>
        </div>
      )}

      {/* 2. 웹 스프레드시트 테이블 그리드 (우측 상단 출처 배지 표기) */}
      <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-neutral-800/90 text-slate-700 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`p-2.5 ${col.width || 'w-auto'} text-${col.align || 'left'}`}>
                  {col.label}
                </th>
              ))}
              <th className="p-2.5 w-12 text-center">삭제</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Table className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                    표시할 수집 시트 데이터가 없습니다.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    상단 '행 추가' 버튼을 누르시거나 노아(NOA) 챗으로 크롤링 요청을 입력해주세요.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const subtotal = getSubtotal(row);
                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition">
                    {columns.map((col) => {
                      const cellId = `${row.id}-${col.key}`;
                      const isSelected = selectedCellIds.has(cellId);

                      if (col.key === 'rowIdx') {
                        return (
                          <td key={col.key} className="p-2.5 text-center font-bold bg-slate-100/60 dark:bg-neutral-900 text-slate-500 border-r border-slate-200 dark:border-neutral-800">
                            {row.rowIdx}
                          </td>
                        );
                      }

                      if (col.key === 'subtotal') {
                        return (
                          <td 
                            key={col.key} 
                            onClick={() => toggleSelectCell(cellId, row)}
                            className={`p-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 cursor-pointer ${
                              isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40' : ''
                            }`}
                          >
                            {formatCurrency(subtotal)}
                          </td>
                        );
                      }

                      return (
                        <td 
                          key={col.key} 
                          onClick={() => toggleSelectCell(cellId, row)}
                          className={`p-1.5 relative ${isSelected ? 'ring-2 ring-emerald-500/80 bg-emerald-50/30' : ''}`}
                        >
                          {col.key === 'item' && row.sourceBadge && (
                            <span className="absolute top-1 right-1 text-[8px] font-black px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {row.sourceBadge}
                            </span>
                          )}

                          <input
                            type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                            value={row[col.key] ?? ''}
                            onChange={(e) => 
                              handleCellChange(
                                row.id, 
                                col.key, 
                                col.type === 'number' || col.type === 'currency' ? Number(e.target.value) : e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-emerald-500 bg-transparent text-slate-800 dark:text-neutral-200 font-medium focus:outline-none text-${col.align || 'left'}`}
                            title="셀 클릭 시 출처 툴팁 노출"
                          />
                        </td>
                      );
                    })}

                    <td className="p-2 text-center">
                      <button onClick={() => handleDeleteRow(row.id)} className="p-1 rounded text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. 하단 상태바 */}
      <div className="p-3.5 rounded-2xl bg-emerald-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm font-mono text-xs">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-emerald-300 font-bold">
            <CheckSquare className="w-4 h-4" />
            <span>선택 셀: {selectedCellIds.size}개</span>
          </span>
          <span className="text-slate-400">|</span>
          <span>전체 항목: {rows.length}개 행</span>
        </div>

        <div className="flex items-center space-x-4 font-black text-sm">
          <div className="flex items-center space-x-1.5">
            <span className="text-emerald-400 text-xs">총합 (SUM):</span>
            <span className="text-emerald-200">{formatCurrency(totalSum)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-emerald-400 text-xs">평균 (AVG):</span>
            <span className="text-emerald-200">{formatCurrency(totalAvg)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
