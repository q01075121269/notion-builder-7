import React, { useState } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';

export interface SheetCell {
  id: string; // rowId-colKey
  rowIdx: number;
  item: string;      // B열
  qty: number;       // C열
  price: number;     // D열
  note: string;      // F열
}

interface SmartSheetsRendererProps {
  formMode?: 'free' | 'template';
}

export const SmartSheetsRenderer: React.FC<SmartSheetsRendererProps> = ({
  formMode = 'free'
}) => {

  // 시트 데이터 상태
  const [rows, setRows] = useState<SheetCell[]>([
    { id: 'r1', rowIdx: 1, item: 'AI 모델 API (Gemini 3.6 Flash)', qty: 10, price: 150000, note: '주간 사용 라이선스' },
    { id: 'r2', rowIdx: 2, item: '노션 팀 워크스페이스 구독료', qty: 5, price: 45000, note: '연간 계약 할인' },
    { id: 'r3', rowIdx: 3, item: '고화질 미디어 렌더링 노드', qty: 2, price: 320000, note: 'GPU 호스팅 서버' },
    { id: 'r4', rowIdx: 4, item: '클라우드 오프라인 백업 DB', qty: 1, price: 120000, note: '1계층 IndexedDB 동기화' },
    { id: 'r5', rowIdx: 5, item: '스마트 시트 수식 엔진 모듈', qty: 1, price: 250000, note: '로우즈 벤치마크' },
  ]);

  // 수식 셀 입력 상태 (=SUM vs =AVERAGE)
  const [formulaMode, setFormulaMode] = useState<'SUM' | 'AVERAGE'>('SUM');

  // 통화 수치 포맷팅 헬퍼
  const formatCurrency = (val: number) => {
    return `₩${val.toLocaleString('ko-KR')}`;
  };

  // E열 (공급가액 = 수량 * 단가) 계산
  const getSubtotal = (r: SheetCell) => r.qty * r.price;

  // 전체 연산 엔진 (=SUM / =AVERAGE)
  const calculateTotal = () => {
    return rows.reduce((acc, r) => acc + getSubtotal(r), 0);
  };

  const calculateAverage = () => {
    if (rows.length === 0) return 0;
    return Math.round(calculateTotal() / rows.length);
  };

  // 행 추가/삭제
  const handleAddRow = () => {
    const newRowIdx = rows.length + 1;
    const newRow: SheetCell = {
      id: `r-${Date.now()}`,
      rowIdx: newRowIdx,
      item: '신규 품목 명세',
      qty: 1,
      price: 50000,
      note: '추가 비고'
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, rowIdx: idx + 1 })));
  };

  const handleCellChange = (id: string, field: keyof SheetCell, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md rounded-3xl p-6 sm:p-8 space-y-6 select-none">
      
      {/* 1. 상단 컨트롤 파트 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              📊 AI 스마트 시트 (Rows 연산 벤치마크)
            </span>
            {formMode === 'template' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                지출결의서 수식 서식
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            실시간 연산 테이블 그리드
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            더블클릭으로 셀 값 직접 편집 • 수식 엔진 `=SUM()` 및 `=AVERAGE()` 실시간 반응
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* 수식 스위처 */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200 dark:border-neutral-700">
            <button
              onClick={() => setFormulaMode('SUM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                formulaMode === 'SUM'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              =SUM() 합계
            </button>
            <button
              onClick={() => setFormulaMode('AVERAGE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                formulaMode === 'AVERAGE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              =AVERAGE() 평균
            </button>
          </div>

          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>행 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 알파벳 A~F 열 및 행 번호 헤더를 포함한 웹 스프레드시트 테이블 */}
      <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          {/* 알파벳 A~F 열 헤더 */}
          <thead className="bg-slate-100 dark:bg-neutral-800/90 text-slate-700 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
            <tr>
              <th className="p-2.5 w-10 text-center bg-slate-200/70 dark:bg-neutral-900 border-r border-slate-300/60 dark:border-neutral-700">#</th>
              <th className="p-2.5 w-14 text-center text-slate-500 font-mono">A열 (ID)</th>
              <th className="p-2.5">B열 (품목명 / 항목)</th>
              <th className="p-2.5 w-24 text-right">C열 (수량)</th>
              <th className="p-2.5 w-32 text-right">D열 (단가)</th>
              <th className="p-2.5 w-36 text-right font-black text-emerald-700 dark:text-emerald-400">E열 (공급가액 = C*D)</th>
              <th className="p-2.5 w-36">F열 (비고)</th>
              <th className="p-2.5 w-10 text-center">삭제</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
            {rows.map((row) => {
              const subtotal = getSubtotal(row);
              return (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition">
                  {/* 행 번호 (1, 2, 3...) */}
                  <td className="p-2.5 text-center font-bold bg-slate-100/60 dark:bg-neutral-900 text-slate-500 border-r border-slate-200 dark:border-neutral-800">
                    {row.rowIdx}
                  </td>

                  {/* A열 (ID) */}
                  <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">
                    ITEM-0{row.rowIdx}
                  </td>

                  {/* B열 (품목명) */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.item}
                      onChange={(e) => handleCellChange(row.id, 'item', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-emerald-500 bg-transparent text-slate-800 dark:text-neutral-200 font-medium focus:outline-none"
                    />
                  </td>

                  {/* C열 (수량) */}
                  <td className="p-1.5 text-right">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => handleCellChange(row.id, 'qty', Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 text-right rounded border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-emerald-500 bg-transparent text-slate-800 dark:text-neutral-200 font-mono focus:outline-none"
                    />
                  </td>

                  {/* D열 (단가) */}
                  <td className="p-1.5 text-right">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => handleCellChange(row.id, 'price', Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 text-right rounded border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-emerald-500 bg-transparent text-slate-800 dark:text-neutral-200 font-mono focus:outline-none"
                    />
                  </td>

                  {/* E열 (공급가액 수식 실시간 출력) */}
                  <td className="p-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(subtotal)}
                  </td>

                  {/* F열 (비고) */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => handleCellChange(row.id, 'note', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-emerald-500 bg-transparent text-slate-500 dark:text-neutral-400 text-[11px] focus:outline-none"
                    />
                  </td>

                  {/* 삭제 버튼 */}
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

          {/* 3. 실제 연산 엔진 결과 하단 행 (=SUM 또는 =AVERAGE) */}
          <tfoot className="bg-emerald-50/90 dark:bg-emerald-950/60 border-t-2 border-emerald-300 dark:border-emerald-800 font-bold">
            <tr>
              <td colSpan={5} className="p-3.5 text-right text-emerald-900 dark:text-emerald-200 font-black">
                <span className="flex items-center justify-end space-x-1">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {formulaMode === 'SUM'
                      ? `=SUM(E1:E${rows.length}) 실시간 총 집행 금액:`
                      : `=AVERAGE(E1:E${rows.length}) 평균 항목 금액:`
                    }
                  </span>
                </span>
              </td>
              <td className="p-3.5 text-right font-mono text-sm sm:text-base text-emerald-700 dark:text-emerald-300 font-black">
                {formulaMode === 'SUM'
                  ? formatCurrency(calculateTotal())
                  : formatCurrency(calculateAverage())
                }
              </td>
              <td colSpan={2} className="p-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                [자동 계산 엔진 작동중]
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};
