import React from 'react';
import type { NotionTemplate } from '../../types/notion';
import { Database, Layers, FunctionSquare, Calendar, ArrowUpRight, Tag, Type } from 'lucide-react';

export const StructureTreeView: React.FC<{ template: NotionTemplate }> = ({ template }) => {
  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{template.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {template.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {template.description || '노션 템플릿 시스템 아키텍처 트리'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-white dark:bg-notion-dark-card rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-xs text-neutral-400 block">데이터베이스</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{template.databases.length}개</span>
          </div>
          <div className="p-3 bg-white dark:bg-notion-dark-card rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-xs text-neutral-400 block">레이아웃 블록</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{template.page_layout.length}개</span>
          </div>
          <div className="p-3 bg-white dark:bg-notion-dark-card rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-xs text-neutral-400 block">캘린더 연동</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {template.databases.some(d => d.properties.some(p => p.type === 'date')) ? '지원 됨' : '미지원'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-notion-dark-card rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-xs text-neutral-400 block">수식(Formula)</span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {template.databases.reduce((acc, d) => acc + d.properties.filter(p => p.type === 'formula').length, 0)}개
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Databases Architecture Cards */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-neutral-800 dark:text-neutral-200">
          <Database className="w-4 h-4 text-blue-500" />
          <span>데이터베이스 스키마 및 속성 구조 ({template.databases.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.databases.map((db, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-neutral-700/80 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center space-x-1.5">
                    <span>🗂️</span>
                    <span>{db.name}</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    기본 뷰: {db.view_type || 'table'}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                  속성 {db.properties.length}개
                </span>
              </div>

              {db.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {db.description}
                </p>
              )}

              <div className="space-y-1.5 pt-1">
                {db.properties.map((prop, pIdx) => (
                  <div
                    key={pIdx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850/60 text-xs border border-neutral-100 dark:border-neutral-800"
                  >
                    <div className="flex items-center space-x-2">
                      {prop.type === 'title' && <Type className="w-3.5 h-3.5 text-neutral-400" />}
                      {prop.type === 'date' && <Calendar className="w-3.5 h-3.5 text-blue-500" />}
                      {prop.type === 'formula' && <FunctionSquare className="w-3.5 h-3.5 text-purple-500" />}
                      {prop.type === 'relation' && <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />}
                      {prop.type === 'status' && <Tag className="w-3.5 h-3.5 text-emerald-500" />}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {prop.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                        {prop.type}
                      </span>
                      {prop.target && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          → {prop.target}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Page Layout Blocks Tree */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-neutral-800 dark:text-neutral-200">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>페이지 레이아웃 블록 시퀀스 ({template.page_layout.length})</span>
        </div>

        <div className="space-y-2.5">
          {template.page_layout.map((block, bIdx) => (
            <div
              key={bIdx}
              className="p-4 rounded-xl bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-neutral-700/80 flex items-start space-x-3 text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                {bIdx + 1}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                    {block.type}
                  </span>
                  {'icon' in block && <span>{(block as any).icon}</span>}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400">
                  {'content' in block && <span>{(block as any).content}</span>}
                  {'title' in block && <span>제목: {(block as any).title}</span>}
                  {block.type === 'column_list' && (
                    <span>다단 2분할 레이아웃 (좌우 블록 그룹)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
