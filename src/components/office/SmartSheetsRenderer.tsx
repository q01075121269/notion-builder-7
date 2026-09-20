import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Columns,
  CheckSquare
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
  [key: string]: any; // 동적 추가 열 지원
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

  // 동적 동기화 초기 열 정의
  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'rowIdx', label: '#', type: 'number', width: 'w-12', align: 'center' },
    { key: 'item', label: 'B열 (품목명 / 항목)', type: 'text', width: 'w-auto', align: 'left' },
    { key: 'qty', label: 'C열 (수량)', type: 'number', width: 'w-24', align: 'right' },
    { key: 'price', label: 'D열 (단가)', type: 'currency', width: 'w-32', align: 'right' },
    { key: 'subtotal', label: 'E열 (공급가액 = C*D)', type: 'formula', width: 'w-36', align: 'right' },
    { key: 'note', label: 'F열 (비고)', type: 'text', width: 'w-36', align: 'left' },
  ]);

  // 기본 시트 데이터 상태 (자유 기획 vs 표준 결재 서식)
  const defaultFreeRows: SheetRowData[] = [
    { id: 'r1', rowIdx: 1, item: 'AI 모델 API (Gemini 3.6 Flash)', qty: 10, price: 150000, note: '주간 라이선스' },
    { id: 'r2', rowIdx: 2, item: '노션 팀 워크스페이스 구독료', qty: 5, price: 45000, note: '연간 할인' },
    { id: 'r3', rowIdx: 3, item: '고화질 미디어 렌더링 서버', qty: 2, price: 320000, note: 'GPU 인스턴스' },
    { id: 'r4', rowIdx: 4, item: '클라우드 DB 백업 보관함', qty: 1, price: 120000, note: 'IndexedDB 동기화' },
    { id: 'r5', rowIdx: 5, item: '스마트 시트 수식 엔진 모듈', qty: 1, price: 250000, note: 'Rows 연산 규격' },
  ];

  const defaultTemplateRows: SheetRowData[] = [
    { id: 'r1', rowIdx: 1, item: 'Q4 AI 컨퍼런스 참가비', qty: 3, price: 120000, note: '품의 승인 건' },
    { id: 'r2', rowIdx: 2, item: '사내 개발용 모니터 장비', qty: 2, price: 250000, note: '지출결의서-01' },
    { id: 'r3', rowIdx: 3, item: '클라우드 인프라 호스팅', qty: 1, price: 180000, note: '월간 결제건' },
  ];

  const [rows, setRows] = useState<SheetRowData[]>(() => {
    if (initialRows && initialRows.length > 0) return initialRows;
    return formMode === 'template' ? defaultTemplateRows : defaultFreeRows;
  });

  // 검색/필터 상태
  const [filterKeyword, setFilterKeyword] = useState('');
  const [formulaMode, setFormulaMode] = useState<'SUM' | 'AVERAGE'>('SUM');

  // 선택된 셀 피드바 상태 관리
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set(['r1-item', 'r1-qty']));

  // 동적 통화 포맷팅
  const formatCurrency = (val: number) => `₩${val.toLocaleString('ko-KR')}`;

  // 공급가액 연산
  const getSubtotal = (r: SheetRowData) => (r.qty || 0) * (r.price || 0);

  // 필터링 적용된 행 리스트
  const filteredRows = useMemo(() => {
    if (!filterKeyword.trim()) return rows;
    const kw = filterKeyword.toLowerCase();
    return rows.filter((r) => 
      r.item.toLowerCase().includes(kw) || 
      (r.note && r.note.toLowerCase().includes(kw))
    );
  }, [rows, filterKeyword]);

  // 연산 엔진
  const totalSum = useMemo(() => {
    return rows.reduce((acc, r) => acc + getSubtotal(r), 0);
  }, [rows]);

  const totalAvg = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(totalSum / rows.length);
  }, [rows, totalSum]);

  // 셀 조작 이벤트 (부모 상태 전달 지원)
  const updateRowsState = (newRows: SheetRowData[]) => {
    setRows(newRows);
    if (onRowsChange) {
      onRowsChange(newRows);
    }
  };

  // 행 추가
  const handleAddRow = () => {
    const newIdx = rows.length + 1;
    const newRow: SheetRowData = {
      id: `r-${Date.now()}`,
      rowIdx: newIdx,
      item: '신규 지출 항목',
      qty: 1,
      price: 50000,
      note: '비고 입력'
    };
    updateRowsState([...rows, newRow]);
  };

  // 열 추가 (➕ 열 추가 기능 요구사항 반영)
  const handleAddColumn = () => {
    const colLetter = String.fromCharCode(65 + columns.length); // G열, H열 ...
    const newColKey = `custom_${Date.now()}`;
    const newCol: ColumnDef = {
      key: newColKey,
      label: `${colLetter}열 (추가 항목)`,
      type: 'text',
      width: 'w-32',
      align: 'left'
    };
    setColumns((prev) => [...prev, newCol]);

    // 기존 모든 행에 새 열 기본값 채우기
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        [newColKey]: '-'
      }))
    );
  };

  // 행 삭제
  const handleDeleteRow = (id: string) => {
    const updated = rows
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, rowIdx: idx + 1 }));
    updateRowsState(updated);
  };

  // 셀 데이터 수정
  const handleCellChange = (id: string, field: string, val: any) => {
    const updated = rows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: val };
      }
      return r;
    });
    updateRowsState(updated);
  };

  // 셀 클릭 시 선택 상태 토글 (하단 피드바 반응용)
  const toggleSelectCell = (cellId: string) => {
    setSelectedCellIds((prev) => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md rounded-3xl p-6 sm:p-8 space-y-5 select-none">
      
      {/* 1. 상단 컨트롤 툴바: [➕ 행 추가], [➕ 열 추가], [🔍 필터], [🧮 수식 적용] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              📊 스마트 시트 (Rows Engine Grid)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {formMode === 'template' ? '표준 지출결의서 서식' : '자유 기획 서식'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            프로젝트 예산 및 지출결의서 테이블
          </h2>
        </div>

        {/* 버튼 툴바 묶음 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 필터 인풋 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="🔍 필터 검색..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-emerald-500 w-32 sm:w-40"
            />
          </div>

          {/* [➕ 행 추가] */}
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>➕ 행 추가</span>
          </button>

          {/* [➕ 열 추가] */}
          <button
            onClick={handleAddColumn}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
          >
            <Columns className="w-3.5 h-3.5 text-blue-500" />
            <span>➕ 열 추가</span>
          </button>

          {/* [🧮 수식 적용 스위치] */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200 dark:border-neutral-700">
            <button
              onClick={() => setFormulaMode('SUM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                formulaMode === 'SUM'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              =SUM()
            </button>
            <button
              onClick={() => setFormulaMode('AVERAGE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                formulaMode === 'AVERAGE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              =AVG()
            </button>
          </div>
        </div>
      </div>

      {/* 2. 웹 스프레드시트 테이블 그리드 (Double click to edit) */}
      <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          {/* 동적 열 헤더 */}
          <thead className="bg-slate-100 dark:bg-neutral-800/90 text-slate-700 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={`p-2.5 ${col.width || 'w-auto'} text-${col.align || 'left'} ${
                    col.key === 'rowIdx' ? 'bg-slate-200/70 dark:bg-neutral-900 border-r border-slate-300/60 dark:border-neutral-700' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
              <th className="p-2.5 w-12 text-center">삭제</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
            {filteredRows.map((row) => {
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
                          onClick={() => toggleSelectCell(cellId)}
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
                        onClick={() => toggleSelectCell(cellId)}
                        className={`p-1.5 ${isSelected ? 'ring-2 ring-emerald-500/80 bg-emerald-50/30' : ''}`}
                      >
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
                          title="더블클릭 또는 클릭하여 셀 직접 수정"
                        />
                      </td>
                    );
                  })}

                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="행 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. 하단 상태바: 선택 셀 개수, SUM, AVG 실시간 자동 계산 피드바 */}
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
