import React from 'react';
import type { BeginnerGuide } from '../../types/guide';
import { MermaidDiagram } from './MermaidDiagram';

interface GuidePrintLayoutProps {
  guide: BeginnerGuide;
  isSeniorMode?: boolean;
}

export const GuidePrintLayout: React.FC<GuidePrintLayoutProps> = ({ guide, isSeniorMode = false }) => {
  return (
    <div id="print-guide-area" className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
      {/* Print Document Header */}
      <div className="border-b-2 border-black pb-4 mb-6 text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
          Notion Architect • 초보자 눈높이 친절 사용 설명서
        </span>
        <h1 className="text-2xl font-black text-black">
          {guide.headline}
        </h1>
        <p className="text-xs text-neutral-600">
          템플릿: <strong>{guide.templateTitle}</strong> | 인쇄 일시: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* 1. 이 템플릿으로 할 수 있는 일 */}
      <div className="mb-6 p-4 border border-neutral-300 rounded-lg bg-neutral-50">
        <h2 className="text-base font-bold text-black mb-2 flex items-center space-x-1.5">
          <span>📌 이 템플릿으로 할 수 있는 일 (3줄 요약)</span>
        </h2>
        <ul className="space-y-1 text-sm list-disc pl-5">
          {guide.summary.map((s, idx) => (
            <li key={idx} className="leading-relaxed">{s}</li>
          ))}
        </ul>
      </div>

      {/* 2. 첫날 딱 3가지만 따라 하기 */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-black mb-3">
          🚀 첫날 딱 3가지만 따라 하기 (핵심 3단계)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {guide.firstDaySteps.map((step) => (
            <div key={step.stepNumber} className="border border-neutral-300 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                  {step.stepNumber}
                </span>
                <span>{step.title}</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {step.description}
              </p>
              <div className="text-[11px] font-semibold text-blue-700 bg-blue-50 p-1.5 rounded">
                👉 {step.actionExample}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 데이터 흐름도 */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-black mb-2">
          🔄 데이터 한눈에 보기 (순서도)
        </h2>
        <MermaidDiagram chartCode={guide.mermaidFlowchart} isSeniorMode={isSeniorMode} />
      </div>

      {/* 4. 달력과 함께 보는 법 */}
      <div className="mb-6 border border-neutral-300 rounded-lg p-4 bg-neutral-50">
        <h2 className="text-base font-bold text-black mb-1.5">
          📅 {guide.calendarGuide.title}
        </h2>
        <p className="text-xs text-neutral-600 mb-2">
          {guide.calendarGuide.description}
        </p>
        <ol className="list-decimal pl-5 text-xs space-y-1 mb-2">
          {guide.calendarGuide.steps.map((st, idx) => (
            <li key={idx}>{st}</li>
          ))}
        </ol>
        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded">
          💡 노션 캘린더 꿀팁: {guide.calendarGuide.proTip}
        </div>
      </div>

      {/* 5. 자주 묻는 질문 */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-black mb-2">
          ❓ 자주 묻는 질문 (FAQ)
        </h2>
        <div className="space-y-2">
          {guide.faqs.map((faq, idx) => (
            <div key={idx} className="border border-neutral-300 rounded p-2.5 text-xs">
              <div className="font-bold text-black mb-1">Q. {faq.question}</div>
              <div className="text-neutral-700">A. {faq.answer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cheer Message Footer */}
      <div className="border-t border-neutral-300 pt-4 text-center text-xs text-neutral-500 font-medium">
        {guide.cheerMessage}
      </div>
    </div>
  );
};
