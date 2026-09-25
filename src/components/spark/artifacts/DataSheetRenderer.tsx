// src/components/spark/artifacts/DataSheetRenderer.tsx
// =SUM() 자동 연산 및 필터링이 가능한 인터랙티브 스프레드시트 테이블 렌더러

import React, { useState } from 'react';
import type { OfficeDocument, SheetRow } from '../../../types/office';
import type { SparkVisualStyle } from '../../../types/visualStyle';
import { VISUAL_STYLES } from '../../../types/visualStyle';
import { 
  Table, 
  Plus, 
  Trash2, 
  Calculator, 
  Search, 
  ArrowUpDown, 
  Download
} from 'lucide-react';

interface DataSheetRendererProps {
  document: OfficeDocument;
  visualStyle?: SparkVisualStyle;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const DataSheetRenderer: React.FC<DataSheetRendererProps> = ({
  document,
  visualStyle = '3d-isometric',
  onChangeDocument,
  onShowToast
}) => {
  const { headers = ['비목', '세부 산출 내역', '단위', '수량', '단가 (원)', '공급가액 (원)'], rows = [] } = 
    document.content.sheetsContent || {};
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const styleMeta = VISUAL_STYLES[visualStyle] || VISUAL_STYLES['3d-isometric'];
  const toast = onShowToast || ((_m: string) => {});

  // 숫자 파싱 헬퍼
  const parseNum = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // 총 합계액 (=SUM) 자동 계산
  const totalAmount = rows.reduce((sum, row) => {
    const qty = parseNum(row.cells[3] || 0);
    const price = parseNum(row.cells[4] || 0);
    const lineTotal = parseNum(row.cells[5] || (qty * price));
    return sum + lineTotal;
  }, 0);

  // 셀 값 변경 핸들러
  const handleCellChange = (rowId: string, cellIndex: number, newValue: string) => {
    const updatedRows = rows.map(row => {
      if (row.id !== rowId) return row;
      const newCells = [...row.cells];
      newCells[cellIndex] = newValue;

      // 수량(3)이나 단가(4)가 바뀌면 공급가액(5) 자동 갱신
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
          headers,
          rows: updatedRows
        }
      }
    }, '스프레드시트 셀 수정');
  };

  // 행 추가
  const handleAddRow = () => {
    const newRow: SheetRow = {
      id: `row-${Date.now()}`,
      cells: ['신규 비목', '세부 실행 내역', '식', 1, 1000000, 1000000]
    };
    const updatedRows = [...rows, newRow];
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        sheetsContent: {
          ...document.content.sheetsContent,
          headers,
          rows: updatedRows
        }
      }
    }, '스프레드시트 행 추가');
    toast('새로운 데이터 행이 추가되었습니다.', 'success');
  };

  // 행 삭제
  const handleDeleteRow = (rowId: string) => {
    if (rows.length <= 1) {
      toast('최소 1개 행은 유지되어야 합니다.', 'info');
      return;
    }
    const updatedRows = rows.filter(r => r.id !== rowId);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        sheetsContent: {
          ...document.content.sheetsContent,
          headers,
          rows: updatedRows
        }
      }
    }, '스프레드시트 행 삭제');
  };

  // CSV 다운로드
  const handleExportCsv = () => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.cells.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${document.title || 'data_sheet'}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    toast('CSV 파일로 내보내기가 완료되었습니다.', 'success');
  };

  // 필터링 및 정렬된 행
  const filteredRows = rows
    .filter(row => {
      if (!searchTerm) return true;
      return row.cells.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortBy === null) return 0;
      const valA = a.cells[sortBy];
      const valB = b.cells[sortBy];
      const numA = parseNum(valA);
      const numB = parseNum(valB);
      if (numA !== 0 || numB !== 0) {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${styleMeta.themeTokens.container} transition-all duration-200 select-text`}>
      
      {/* 1. 상단 컨트롤 패널 */}
      <div className="w-full max-w-[1100px] mb-4 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                인터랙티브 데이터 시트
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                =SUM() 자동 연산
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              전체 {rows.length}개 항목 | 스타일: {styleMeta.name}
            </p>
          </div>
        </div>

        {/* 검색 및 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="데이터 검색..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 w-36 sm:w-48 focus:w-56 transition-all"
            />
          </div>

          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>행 추가</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. 대형 스프레드시트 카드 테이블 */}
      <div className={`w-full max-w-[1100px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all duration-200`}>
        
        {/* 상단 통계 요약 배너 */}
        <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className={styleMeta.themeTokens.badge}>BUDGET & STATS</span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {document.title} 정량 산출 내역
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                공식 정산 합계액 (=SUM)
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {totalAmount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 인터랙티브 테이블 영역 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                {headers.map((h, hIdx) => (
                  <th 
                    key={hIdx} 
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors select-none"
                    onClick={() => {
                      if (sortBy === hIdx) {
                        setSortAsc(!sortAsc);
                      } else {
                        setSortBy(hIdx);
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{h}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 w-14 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredRows.map((row, rIdx) => (
                <tr 
                  key={row.id || rIdx} 
                  className="hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 transition-colors group"
                >
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {rIdx + 1}
                  </td>
                  {row.cells.map((cellVal, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3">
                      <input
                        type={cIdx === 3 || cIdx === 4 || cIdx === 5 ? 'number' : 'text'}
                        value={cellVal}
                        onChange={(e) => handleCellChange(row.id, cIdx, e.target.value)}
                        className={`w-full bg-transparent outline-none px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500 transition-colors ${
                          cIdx === 5 
                            ? 'font-bold text-slate-900 dark:text-white text-right font-mono' 
                            : cIdx === 3 || cIdx === 4
                            ? 'text-right font-mono text-slate-700 dark:text-slate-300'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      />
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 opacity-40 group-hover:opacity-100 transition cursor-pointer"
                      title="행 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* 총계 푸터 행 */}
            <tfoot>
              <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white">
                <td className="py-3 px-4 text-center text-xs font-mono">SUM</td>
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                  총 예산 집행액 계 (VAT 포함)
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-cyan-600 dark:text-cyan-400">
                  {totalAmount.toLocaleString()} 원
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 풋터 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>수량 및 단가를 수정하면 공급가액 및 총계가 실시간 재계산됩니다.</span>
          <span className="font-mono">=SUM(F2:F{rows.length + 1})</span>
        </div>
      </div>

    </div>
  );
};
