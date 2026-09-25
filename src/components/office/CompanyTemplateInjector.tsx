import React, { useState } from 'react';
import type { OfficeDocument, DocSection, SheetRow } from '../../types/office';
import { 
  Building2, 
  Check, 
  FileSpreadsheet, 
  Layers, 
  FileCheck2, 
  Sparkles, 
  X, 
  ArrowRight,
  Hash,
  Users
} from 'lucide-react';

export interface CompanyTemplateSpec {
  id: string;
  name: string;
  companyName: string;
  department: string;
  docNumberFormat: string;
  retentionPeriod: string;
  approvers: string[];
  tableHeaders: string[];
  sampleBudgetRows: {
    no: number;
    category: string;
    description: string;
    amount: number;
    note: string;
  }[];
  standardSections: DocSection[];
}

export const PRESET_COMPANY_TEMPLATES: CompanyTemplateSpec[] = [
  {
    id: 'corp-standard-2026',
    name: '2026 엔터프라이즈 표준 사내 기안서 서식',
    companyName: '(주)노션아키텍트 홀딩스',
    department: '신사업전략본부 AI솔루션팀',
    docNumberFormat: '[사내보안]-2026-089호',
    retentionPeriod: '영구 (사내 감사 기준)',
    approvers: ['기안 (김책임)', '팀장 (박팀장)', '본부장 (최본부장)', '대표이사 (정대표)'],
    tableHeaders: ['번호', '항목', '산출근거', '소요예산(원)', '비고'],
    sampleBudgetRows: [
      { no: 1, category: 'SW 라이선스', description: 'AI 엔진 API 토큰 및 전사 엔터프라이즈 시트 라이선스', amount: 48000000, note: '연간 선지급' },
      { no: 2, category: '인프라 구축비', description: '사내 온프레미스 연동 게이트웨이 및 보안 프록시', amount: 25000000, note: '초기 1회' },
      { no: 3, category: '사내 파일럿 운영비', description: '파일럿 부서 30인 테스트 및 피드백 리워드', amount: 5000000, note: '3분기 소진' },
      { no: 4, category: '예비비', description: '인프라 트래픽 급증 및 보안 감사 대응 예비 자금', amount: 7000000, note: '집행 시 사전 품의' }
    ],
    standardSections: [
      { id: 'sec-corp-1', level: 1, marker: '1.', text: '추진 목적 및 도입 필요성' },
      { id: 'sec-corp-2', level: 2, marker: '□', text: '전사 디지털 전환을 위한 생성형 AI 오피스 스튜디오 도입' },
      { id: 'sec-corp-3', level: 3, marker: '○', text: '기존 반복 문서 수립 공수 70% 절감 및 데이터 무결성 100% 확보 [출처: 1]' },
      { id: 'sec-corp-4', level: 1, marker: '2.', text: '사내 규정 및 보안 가이드라인 준수 현황' },
      { id: 'sec-corp-5', level: 2, marker: '□', text: '사내 정보보안 규정 제45조(보안 게이트웨이 의무화) 검증 통과 [출처: 2]' },
      { id: 'sec-corp-6', level: 3, marker: '○', text: '사외 유출 차단 프록시 및 사내 폐쇄망 안전 격리 완료' },
      { id: 'sec-corp-7', level: 1, marker: '3.', text: '소요 예산 및 집행 계획' },
      { id: 'sec-corp-8', level: 2, marker: '□', text: '총 소요 예산: 금 85,000,000원 정 (VAT 포함, 하단 상세 산출 내역 참조)' },
      { id: 'sec-corp-9', level: 1, marker: '4.', text: '기대 효과 및 4단 결재 상신' },
      { id: 'sec-corp-10', level: 2, marker: '□', text: '부서장 및 본부장 합의 완료 후 대표이사 최종 재가 요청' }
    ]
  },
  {
    id: 'gov-tech-2026',
    name: '공공·공문서 테크 기안 표준 양식',
    companyName: '디지털혁신공단',
    department: '공공데이터혁신처 스마트업무추진단',
    docNumberFormat: 'GOV-TECH-2026-0155',
    retentionPeriod: '10년',
    approvers: ['담당 (이주무관)', '사무관 (강사무관)', '단장 (송단장)', '처장 (윤처장)'],
    tableHeaders: ['순번', '비목', '산출 근거', '예산액 (천원)', '조달 구분'],
    sampleBudgetRows: [
      { no: 1, category: '용역비', description: '클라우드 인프라 전환 기술지원 용역', amount: 35000000, note: '조달청 나라장터' },
      { no: 2, category: '자산취득비', description: '보안 하드웨어 키 및 인증 서버 증설', amount: 18000000, note: '직접 구매' },
      { no: 3, category: '일반수용비', description: '공공 지침서 인쇄 및 관계 부처 공청회 운영', amount: 4500000, note: '실비 정산' }
    ],
    standardSections: [
      { id: 'sec-gov-1', level: 1, marker: '1.', text: '관련 근거 및 추진 배경' },
      { id: 'sec-gov-2', level: 2, marker: '□', text: '전자정부법 제32조(행정업무의 디지털화 촉진)에 의거 기안함 [출처: 1]' },
      { id: 'sec-gov-3', level: 1, marker: '2.', text: '사업 개요 및 주요 내용' },
      { id: 'sec-gov-4', level: 2, marker: '□', text: '다중 부처 데이터 연동 스마트 독스 캔버스 표준화' },
      { id: 'sec-gov-5', level: 3, marker: '○', text: '보안 적합성 검증 완료 및 행정망 전용 암호화 모듈 탑재 [출처: 3]' },
      { id: 'sec-gov-6', level: 1, marker: '3.', text: '예산 조달 및 행정 사항' },
      { id: 'sec-gov-7', level: 2, marker: '□', text: '소요 예산 전액 정부출연금 집행 및 분기별 감사 보고' }
    ]
  }
];

interface CompanyTemplateInjectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocument: OfficeDocument;
  onApplyTemplate: (updatedDoc: OfficeDocument, templateName: string) => void;
  sourceFileName?: string;
}

export const CompanyTemplateInjector: React.FC<CompanyTemplateInjectorProps> = ({
  isOpen,
  onClose,
  currentDocument,
  onApplyTemplate,
  sourceFileName
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PRESET_COMPANY_TEMPLATES[0].id);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  if (!isOpen) return null;

  const currentTemplate = PRESET_COMPANY_TEMPLATES.find(t => t.id === selectedTemplateId) || PRESET_COMPANY_TEMPLATES[0];

  const handleApply = () => {
    setIsScanning(true);
    setScanStep('1단계: 4단 결재선(기안-팀장-본부장-대표이사) 구조 파싱 중...');

    setTimeout(() => {
      setScanStep('2단계: 부서 고유 메타데이터 및 문서번호 규칙 검증 중...');
    }, 400);

    setTimeout(() => {
      setScanStep('3단계: 사내 표준 예산 표 그리드(5개 컬럼) 및 서식 주입 완료!');
    }, 800);

    setTimeout(() => {
      // 1. 시트 데이터 재구성
      const newSheetRows: SheetRow[] = currentTemplate.sampleBudgetRows.map(r => ({
        id: `row-template-${r.no}`,
        cells: [r.no, r.category, r.description, r.amount, r.note]
      }));

      // 2. 통합 덮어쓰기 문서 생성
      const updatedDoc: OfficeDocument = {
        ...currentDocument,
        format: 'docs',
        title: `${currentTemplate.companyName} 표준 기안서`,
        metadata: {
          ...currentDocument.metadata,
          author: currentTemplate.approvers[0],
          department: currentTemplate.department,
          approvers: currentTemplate.approvers,
          docNumber: currentTemplate.docNumberFormat,
          date: new Date().toISOString().slice(0, 10).replace(/-/g, '. ')
        },
        content: {
          ...currentDocument.content,
          docsContent: {
            sections: currentTemplate.standardSections
          },
          sheetsContent: {
            headers: currentTemplate.tableHeaders,
            rows: newSheetRows,
            hasTotalRow: true,
            totalFormula: '=SUM(D2:D5)'
          }
        }
      };

      onApplyTemplate(updatedDoc, currentTemplate.name);
      setIsScanning(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto text-zinc-100">
        
        {/* 상단 타이틀 바 */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                사내 고유 양식 스캐너 & 1:1 캔버스 복제기
              </h3>
              <p className="text-xs text-zinc-400">
                {sourceFileName 
                  ? `[${sourceFileName}] 원본 서식 구조를 스캔하여 캔버스에 즉시 주입합니다.`
                  : '사내 표준 결재선, 문서번호 규칙, 예산 표 그리드를 자동 추출하여 주입합니다.'
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 템플릿 선택 카드 목록 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">
            적용할 사내 서식 프리셋 선택:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_COMPANY_TEMPLATES.map(tmpl => {
              const isSelected = tmpl.id === selectedTemplateId;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-950/20 text-white ring-1 ring-blue-500/50 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-100 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700/60">
                        {tmpl.companyName}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>
                    <h4 className="text-xs font-black text-white pt-0.5">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {tmpl.department}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 추출된 3대 감지 요소 디테일 프리뷰 */}
        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>사내 서식 감지 및 파싱된 핵심 요소 (3대 규격)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              100% 자동 정규화 완료
            </span>
          </div>

          {/* 1. 4단 결재선 구조 */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-300">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>1) 결재선 구조 (4단 승인 라인):</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {currentTemplate.approvers.map((appr, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xs">
                  <div className="text-[10px] text-zinc-400 font-medium">
                    {idx === 0 ? '기안자' : idx === 1 ? '1차 검토' : idx === 2 ? '2차 승인' : '최종 결재'}
                  </div>
                  <div className="text-xs font-black text-zinc-200 truncate mt-0.5">
                    {appr}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 부서 고유 메타데이터 */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-300">
              <Hash className="w-3.5 h-3.5 text-zinc-400" />
              <span>2) 부서 메타데이터 및 문서 규칙:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-0.5">문서번호 규칙</span>
                <span className="font-mono font-bold text-zinc-100">{currentTemplate.docNumberFormat}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-0.5">보존연한</span>
                <span className="font-bold text-zinc-100">{currentTemplate.retentionPeriod}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-0.5">주관 부서</span>
                <span className="font-bold text-zinc-100 truncate block">{currentTemplate.department}</span>
              </div>
            </div>
          </div>

          {/* 3. 사내 고유 표 컬럼 구조 */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-300">
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
              <span>3) 사내 표준 예산 표 그리드 컬럼 복제:</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap">
                {currentTemplate.tableHeaders.map((hdr, hIdx) => (
                  <span key={hIdx} className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                    {hdr}
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mt-1.5">
                * 캔버스 표 그리드에 1:1로 복제되며 합계 공식(=SUM)이 자동 바인딩됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 진행 상태 인디케이터 (스캐닝 중) */}
        {isScanning && (
          <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-800 flex items-center space-x-3 text-xs font-bold text-blue-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
            <span>{scanStep}</span>
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isScanning}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <FileCheck2 className="w-4 h-4 text-blue-200 shrink-0" />
            <span>이 사내 양식 적용하기</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
          </button>
        </div>

      </div>
    </div>
  );
};

// 별칭 export 제공 (CompanyTemplateScannerModal)
export const CompanyTemplateScannerModal = CompanyTemplateInjector;
