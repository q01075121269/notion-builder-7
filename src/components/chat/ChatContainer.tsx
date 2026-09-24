import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Database, ArrowUpRight, CheckCircle2, Layers, Cpu, Award } from 'lucide-react';
import { SEPTEMBER_TOP_10_TEMPLATES } from '../../services/curatedTemplates';

export const ChatContainer: React.FC = () => {
  const { currentTemplate, loadCuratedTemplate, showToast } = useApp();

  const top10Templates = SEPTEMBER_TOP_10_TEMPLATES.slice(0, 10);

  const handleSelectTemplate = (id: string, title: string) => {
    loadCuratedTemplate(id);
    showToast(`✨ [${title}] 템플릿 스키마가 캔버스에 즉각 적용되었습니다!`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-notion-dark-sidebar/40 border-r border-neutral-200 dark:border-notion-dark-border overflow-hidden select-none">
      
      {/* 서브 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 dark:border-notion-dark-border/80 bg-white/80 dark:bg-notion-dark-bg/80 backdrop-blur shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              시즌 TOP 10 큐레이션 & DB 탐색기
            </h3>
            <p className="text-[10px] text-neutral-500">클릭 즉시 캔버스에 고품질 스키마 투영</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          v2.0 옴니 연동
        </span>
      </div>

      {/* 메인 뷰: 상단 (시즌 TOP 10 큐레이션) / 하단 (DB 스키마 구조 미리보기) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        
        {/* 상단: 🔥 시즌 TOP 10 큐레이션 리스트 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>🔥 상용 벤치마크 TOP 10 베스트셀러</span>
            </h4>
            <span className="text-[10px] text-neutral-400 font-medium">원클릭 투영</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {top10Templates.map((template: any, index: number) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template.id, template.title)}
                className="
                  group p-2.5 rounded-xl
                  bg-white dark:bg-notion-dark-card
                  border border-neutral-200/80 dark:border-neutral-800
                  hover:border-amber-400 dark:hover:border-amber-500
                  hover:shadow-md transition-all cursor-pointer
                  flex items-center justify-between gap-2
                "
              >
                <div className="flex items-start space-x-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                      {template.title}
                    </h5>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {template.category || '인기 템플릿'}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Formulas 2.0
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 하단: 🏗️ 현재 생성된 노션 DB 구조 미리보기 */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>🏗️ 활성 템플릿 DB 스키마 청사진</span>
            </h4>
            {currentTemplate && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                캔버스 로드됨
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
            {currentTemplate ? (
              <>
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {currentTemplate.title || '선택된 템플릿 스키마'}
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold">
                    {currentTemplate.description ? '맞춤 템플릿' : '통합 템플릿'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">포함된 데이터베이스 목록</span>
                  <div className="space-y-1">
                    {currentTemplate.databases?.map((db: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{db.name || db.title}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 shrink-0">{db.properties?.length || 0}개 속성</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>다중 DB Relation 및 Formulas 2.0 수식 자동 동기화됨</span>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-1.5">
                <Cpu className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 animate-pulse" />
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  선택된 템플릿 스키마가 없습니다.
                </p>
                <p className="text-[10px] text-neutral-400">
                  상단 TOP 10 큐레이션을 클릭하거나 하단 노아(NOA) 챗에 템플릿 작성을 명령해 보세요!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 하단 안내 패널 (노아(NOA) 챗 안내) */}
      <div className="p-3 bg-white dark:bg-notion-dark-bg border-t border-neutral-200/80 dark:border-notion-dark-border shrink-0">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-normal">
          💡 커스텀 템플릿 설계는 하단 <span className="font-bold text-amber-500">노아(NOA) 챗</span>에 <b>"~템플릿 만들어줘"</b>를 요청하세요.
        </p>
      </div>

    </div>
  );
};


