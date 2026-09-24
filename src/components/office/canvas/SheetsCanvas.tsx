import React from 'react';
import type { OfficeDocument, SheetRow } from '../../../types/office';
import { Table, Plus, Trash2, Calculator, ArrowDownRight } from 'lucide-react';

interface SheetsCanvasProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
}

export const SheetsCanvas: React.FC<SheetsCanvasProps> = ({
  document,
  onChangeDocument
}) => {
  const { headers, rows, hasTotalRow = true, totalFormula = '=SUM(F2:F)' } = document.content.sheetsContent;

  // 단가와 수량을 바탕으로 공급가액을 계산하거나 숫자 파싱
  const parseNum = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // F열(공급가액) 총합 자동 계산
  const calculateTotal = (): number => {
    return rows.reduce((sum, row) => {
      // 5번째 인덱스 (공급가액) 또는 3번째(수량) * 4번째(단가)
      const qty = parseNum(row.cells[3] || 0);
      const price = parseNum(row.cells[4] || 0);
      const totalCell = parseNum(row.cells[5] || (qty * price));
      return sum + totalCell;
    }, 0);
  };

  const handleCellChange = (rowId: string, cellIndex: number, newValue: string) => {
    const updatedRows = rows.map(row => {
      if (row.id !== rowId) return row;
      const newCells = [...row.cells];
      newCells[cellIndex] = newValue;

      // 만약 수량(3)이나 단가(4)가 바뀌면 공급가액(5) 자동 갱신
      if (cellIndex === 3 || cellIndex === 4) {
        const qty = parseNum(newCells[3] || 0);
        const price = parseNum(newCells[4] || 0);
        newCells[5] = qty * price;
      }
      return { ...row, cells: newCells };
    });

    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        sheetsContent: {
          ...document.content.sheetsContent,
          rows: updatedRows
        }
      }
    }, '스프레드시트 셀 값 편집');
  };

  const handleAddRow = () => {
    const newRow: SheetRow = {
      id: `row-${Date.now()}`,
      cells: ['신규 비목', '신규 세부 산출 내역', '식', 1, 1000000, 1000000]
    };
    const updatedRows = [...rows, newRow];
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        sheetsContent: {
          ...document.content.sheetsContent,
          rows: updatedRows
        }
      }
    }, '스프레드시트 행 추가');
  };

  const handleDeleteRow = (rowId: string) => {
    if (rows.length <= 1) return;
    const updatedRows = rows.filter(r => r.id !== rowId);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        sheetsContent: {
          ...document.content.sheetsContent,
          rows: updatedRows
        }
      }
    }, '스프레드시트 행 삭제');
  };

  const totalAmount = calculateTotal();

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-6">
      
      {/* 스프레드시트 툴바 */}
      <div className="w-full max-w-[1000px] mb-4 flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-2">
          <Table className="w-5 h-5 text-emerald-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
            인터랙티브 예산·수치 시트 ({rows.length}개 행)
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            {totalFormula}
          </span>
        </div>

        <button
          onClick={handleAddRow}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>행(Row) 추가</span>
        </button>
      </div>

      {/* 스프레드시트 그리드 컨테이너 */}
      <div className="w-full max-w-[1000px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {/* 헤더 */}
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-300 dark:border-zinc-700">
                <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono text-[11px]">#</th>
                {headers.map((head, hIdx) => (
                  <th key={hIdx} className="py-2.5 px-3 border-r last:border-r-0 border-slate-200 dark:border-zinc-700 font-extrabold whitespace-nowrap">
                    {head}
                  </th>
                ))}
                <th className="py-2.5 px-2 w-10 text-center">삭제</th>
              </tr>
            </thead>

            {/* 행 데이터 */}
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows.map((row, rIdx) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                    {rIdx + 1}
                  </td>
                  {row.cells.map((cell, cIdx) => {
                    const isNumber = cIdx >= 3;
                    return (
                      <td key={cIdx} className="py-1 px-2 border-r last:border-r-0 border-slate-200 dark:border-zinc-800">
                        <input
                          type={isNumber ? 'number' : 'text'}
                          value={cell}
                          onChange={(e) => handleCellChange(row.id, cIdx, e.target.value)}
                          className={`w-full py-1.5 px-2 bg-transparent hover:bg-white dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 rounded border border-transparent focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none text-slate-800 dark:text-zinc-200 transition font-medium text-xs sm:text-sm ${
                            isNumber ? 'text-right font-mono' : 'text-left'
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="py-1 px-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-red-500 disabled:opacity-20 transition"
                      title="행 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* 자동 합계(=SUM) 행 */}
              {hasTotalRow && (
                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-t-2 border-emerald-500 font-bold text-slate-900 dark:text-white">
                  <td className="py-3 px-3 text-center">
                    <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3 px-3 text-emerald-700 dark:text-emerald-300 font-black">
                    합계 (Total)
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs italic" colSpan={3}>
                    실시간 자동 수식 =SUM(공급가액 전행)
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base border-r border-slate-200 dark:border-zinc-800">
                    {totalAmount.toLocaleString()} 원
                  </td>
                  <td className="py-3 px-2 text-center">
                    <ArrowDownRight className="w-4 h-4 text-emerald-500 mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
