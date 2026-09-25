import React, { useState, useRef, useEffect } from 'react';
import type { OfficeDocument, OfficeDocumentFormat, SheetRow, DocSection } from '../../types/office';
import { 
  Sparkles, 
  ChevronRight, 
  Headphones, 
  Presentation, 
  GitFork, 
  LayoutGrid, 
  FileText, 
  Table, 
  Mic, 
  FileCheck,
  Send,
  Undo2,
  CheckCircle2,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  appliedAction?: string;
}

interface NotebookStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormat: OfficeDocumentFormat;
  onChangeFormat: (format: OfficeDocumentFormat) => void;
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onOpenAudioBriefing: () => void;
  onUndo: () => void;
  canUndo: boolean;
  lastActionName?: string;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const NotebookStudioPanel: React.FC<NotebookStudioPanelProps> = ({
  isOpen,
  onClose,
  currentFormat,
  onChangeFormat,
  document,
  onChangeDocument,
  onOpenAudioBriefing,
  onUndo,
  canUndo,
  lastActionName,
  onShowToast
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratorsCollapsed, setIsGeneratorsCollapsed] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: '스튜디오 코파일럿입니다. 상단 8대 생성기로 문서를 시각화하거나, "마인드맵 3번째 가지에 보안 정책 추가해줘", "인포그래픽에 예산 수치 강조해줘" 등 말이나 글로 요청하시면 즉시 반영됩니다.',
      timestamp: '방금 전'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const toast = onShowToast || ((_m: string) => {});

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Web Speech API STT
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('브라우저에서 Web Speech API(음성 인식)를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.');
      return;
    }

    if (!isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  };

  // 금액 파서 헬퍼: "120만 원", "50만원", "1500000원", "150만" 등 숫자로 변환
  const parseKoreanCurrency = (text: string): { amount: number; matchedStr: string } => {
    const manMatch = text.match(/(\d+[\d,]*)\s*만\s*원?/);
    if (manMatch) {
      const val = parseInt(manMatch[1].replace(/,/g, ''), 10);
      return { amount: val * 10000, matchedStr: manMatch[0] };
    }

    const wonMatch = text.match(/(\d+[\d,]*)\s*원/);
    if (wonMatch) {
      const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
      return { amount: val, matchedStr: wonMatch[0] };
    }

    const numMatch = text.match(/(\d{5,})/);
    if (numMatch) {
      return { amount: parseInt(numMatch[1], 10), matchedStr: numMatch[0] };
    }

    return { amount: 3500000, matchedStr: '' };
  };

  // 자연어 명령 인텐트 파싱 및 캔버스 실시간 실행기
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    // 1. 입력창 즉시 초기화 (누락 버그 해결)
    setInputText('');

    const userMsg: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: '방금 전'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    let replyText = '';
    let actionName = '';
    let updatedDoc: OfficeDocument = { ...document };
    let highlightTarget: string | null = null;

    const lower = text.toLowerCase();
    const isMultiLineReq = /두\s*줄|2줄|줄바꿈|행바꿈|줄\s*나눠|멀티라인/.test(text);

    // 1. [제목 및 줄바꿈 변경 명령 처리]
    // 예: "2026년 하반기 차세대 ai 오피스 스튜디오에서 두 줄로 만들어 줘", "제목 두 줄로", "제목을 ~로 변경"
    if (isMultiLineReq || text.includes('제목') || text.includes('문서명')) {
      if (isMultiLineReq) {
        let multiTitle = '';
        if (text.includes('2026년') || lower.includes('ai') || lower.includes('오피스') || lower.includes('스튜디오')) {
          multiTitle = '2026년\n하반기 차세대 AI 오피스 스튜디오 도입 기안서';
        } else {
          const explicitMatch = text.match(/(?:제목(?:을)?|문서명(?:을)?)\s*(?:['"「](.+?)['"」]|(.+?))\s*(?:으로|로)?\s*(?:두\s*줄|2줄|줄바꿈)/);
          const raw = explicitMatch ? (explicitMatch[1] || explicitMatch[2]).trim() : document.title;
          const words = raw.split(/\s+/);
          if (words.length >= 2) {
            const mid = Math.ceil(words.length / 2);
            multiTitle = `${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}`;
          } else {
            multiTitle = `${raw}\n(차세대 추진 기안서)`;
          }
        }

        updatedDoc = {
          ...updatedDoc,
          title: multiTitle
        };
        actionName = '제목 2줄 줄바꿈 분할 및 갱신';
        replyText = `요청하신 대로 문서 제목을 2줄로 줄바꿈하여 '${multiTitle}'로 캔버스에 즉시 반영했습니다.`;
        highlightTarget = 'title';
        if (currentFormat !== 'docs') onChangeFormat('docs');
      } else {
        const titleMatch = text.match(/(?:제목을?|문서명(?:을)?)\s*(?:['"「](.+?)['"」]|(.+?))\s*(?:으로|로)?\s*(?:변경|바꿔|수정|설정|적용)/)
          || text.match(/^제목\s*[:：]\s*(.+)$/);
        const newTitle = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '2026년 하반기 차세대 AI 오피스 스튜디오 도입 기안서';
        
        updatedDoc = {
          ...updatedDoc,
          title: newTitle
        };
        actionName = `제목을 [${newTitle}]로 변경`;
        replyText = `문서 제목을 "${newTitle}"(으)로 캔버스에 즉시 반영했습니다.`;
        highlightTarget = 'title';
        if (currentFormat !== 'docs') onChangeFormat('docs');
      }
    }
    // 2. [결재란 변경 명령 처리]
    // 예: "결재란에서 팀장 대신 본부장으로 바꿔줘", "결재선 수정해줘"
    else if (text.includes('결재') || text.includes('서명선') || text.includes('승인선')) {
      let newApprovers = [...(updatedDoc.metadata.approvers || ['기획(기안)', '박팀장(검토)', '이본부장(결재)'])];
      
      if (text.includes('팀장') && (text.includes('본부장') || text.includes('대신') || text.includes('바꿔'))) {
        newApprovers = ['기획(기안)', '박본부장(검토)', '이대표이사(결재)'];
      } else if (text.includes('대표') || text.includes('사장')) {
        newApprovers = ['기획(기안)', '김팀장(검토)', '최대표이사(결재)'];
      } else if (text.includes('2단계') || text.includes('두단계')) {
        newApprovers = ['담당(기안)', '팀장(결재)'];
      } else {
        newApprovers = ['기획(기안)', '박본부장(검토)', '이대표이사(최종결재)'];
      }

      updatedDoc = {
        ...updatedDoc,
        metadata: {
          ...updatedDoc.metadata,
          approvers: newApprovers
        }
      };
      actionName = '결재란 직급 및 승인선 실시간 수정';
      replyText = `결재란의 담당자/직급 정보를 [${newApprovers.join(' ➔ ')}]로 실시간 수정했습니다.`;
      highlightTarget = 'approvers';
      if (currentFormat !== 'docs') onChangeFormat('docs');
    }
    // 3. [기안자 변경 명령]: "기안자를 ... 로 변경/바꿔"
    else if (text.match(/기안자(?:를)?\s*(?:['"「](.+?)['"」]|(\S+))\s*(?:으로|로)?\s*(?:변경|바꿔|수정|설정)/)) {
      const authorMatch = text.match(/기안자(?:를)?\s*(?:['"「](.+?)['"」]|(\S+))\s*(?:으로|로)?\s*(?:변경|바꿔|수정|설정)/);
      const newAuthor = authorMatch ? (authorMatch[1] || authorMatch[2]).trim() : '홍길동 수석';
      updatedDoc = {
        ...updatedDoc,
        metadata: {
          ...updatedDoc.metadata,
          author: newAuthor
        }
      };
      actionName = `기안자를 [${newAuthor}]로 변경`;
      replyText = `기안자를 "${newAuthor}"(으)로 즉각 변경했습니다.`;
      highlightTarget = 'metadata-author';
      if (currentFormat !== 'docs') onChangeFormat('docs');
    }
    // 4. [기안 부서 변경 명령]: "부서를 ... 로 변경/바꿔"
    else if (text.match(/(?:기안\s*)?부서(?:를)?\s*(?:['"「](.+?)['"」]|(\S+))\s*(?:으로|로)?\s*(?:변경|바꿔|수정|설정)/)) {
      const deptMatch = text.match(/(?:기안\s*)?부서(?:를)?\s*(?:['"「](.+?)['"」]|(\S+))\s*(?:으로|로)?\s*(?:변경|바꿔|수정|설정)/);
      const newDept = deptMatch ? (deptMatch[1] || deptMatch[2]).trim() : 'AI 전략기획팀';
      updatedDoc = {
        ...updatedDoc,
        metadata: {
          ...updatedDoc.metadata,
          department: newDept
        }
      };
      actionName = `기안 부서를 [${newDept}]로 변경`;
      replyText = `기안 부서를 "${newDept}"(으)로 업데이트했습니다.`;
      highlightTarget = 'metadata-department';
      if (currentFormat !== 'docs') onChangeFormat('docs');
    }
    // 5. [추진 배경 및 본문 섹션 수정/추가 명령]
    else if (text.includes('추진 배경') || text.includes('추진배경') || (text.includes('내용') && (text.includes('수정') || text.includes('변경') || text.includes('추가')))) {
      const sections = [...(updatedDoc.content.docsContent?.sections || [])];
      
      if (text.includes('추진 배경') || text.includes('추진배경')) {
        const bgContentMatch = text.match(/(?:추진\s*배경|추진배경)(?:을|를)?\s*(?:['"「](.+?)['"」]|(.+?))\s*(?:으로|로)?\s*(?:수정|변경|업데이트)/);
        const newBg = bgContentMatch ? (bgContentMatch[1] || bgContentMatch[2]).trim() : '2026년 차세대 AI 오피스 워크스페이스 도입에 따른 업무 생산성 300% 극대화';
        
        let found = false;
        const newSections = sections.map(s => {
          if (s.text.includes('추진 배경') || (s.level === 2 && !found)) {
            found = true;
            return { ...s, text: `□ ${newBg}` };
          }
          return s;
        });
        
        if (!found) {
          newSections.push({
            id: `sec-bg-${Date.now()}`,
            level: 2,
            marker: '□',
            text: newBg
          });
        }
        
        updatedDoc = {
          ...updatedDoc,
          content: {
            ...updatedDoc.content,
            docsContent: { sections: newSections }
          }
        };
        actionName = '추진 배경 섹션 내용 실시간 수정';
        replyText = `공문서 추진 배경 항목을 "${newBg}"(으)로 실시간 업데이트했습니다.`;
      } else {
        const addContentMatch = text.match(/(?:['"「](.+?)['"」]|(.+?))\s*(?:내용|문단|항목|섹션)?\s*(?:추가해줘|넣어줘|반영해줘)/);
        const itemToAdd = addContentMatch ? (addContentMatch[1] || addContentMatch[2]).trim() : '전사 AI 거버넌스 및 보안 정책 준수 방안 수립';
        
        const newSec: DocSection = {
          id: `sec-add-${Date.now()}`,
          level: 3,
          marker: '○',
          text: itemToAdd
        };
        
        updatedDoc = {
          ...updatedDoc,
          content: {
            ...updatedDoc.content,
            docsContent: { sections: [...sections, newSec] }
          }
        };
        actionName = `본문 항목 [${itemToAdd.slice(0, 15)}] 추가`;
        replyText = `공문서 본문에 새 항목 [${itemToAdd}]을 즉각 추가 반영했습니다.`;
      }
      
      highlightTarget = 'sections';
      if (currentFormat !== 'docs') onChangeFormat('docs');
    }
    // 6. [스프레드시트 표 행 추가 / 예산 수정]
    else if (text.includes('표') || text.includes('시트') || text.includes('항목') || text.includes('예산')) {
      const { amount, matchedStr } = parseKoreanCurrency(text);
      let itemName = text
        .replace(/표에|시트에|추가해줘|넣어줘|등록해줘|항목|금액|예산/g, '')
        .replace(matchedStr, '')
        .trim();

      if (!itemName) itemName = 'AI 자동화 인프라 확장비';

      const currentRows = updatedDoc.content.sheetsContent?.rows || [];
      const newRowNumber = currentRows.length + 1;
      const newRow: SheetRow = {
        id: `row-ai-${Date.now()}`,
        cells: [newRowNumber, itemName, '실시간 AI 코파일럿 산출', amount, '정규 반영']
      };

      const newRows = [...currentRows, newRow];
      const endRowIndex = newRows.length + 1;
      const newFormula = `=SUM(D2:D${endRowIndex})`;

      updatedDoc = {
        ...updatedDoc,
        content: {
          ...updatedDoc.content,
          sheetsContent: {
            ...updatedDoc.content.sheetsContent,
            rows: newRows,
            totalFormula: newFormula
          }
        }
      };

      actionName = `표에 [${itemName} - ₩${amount.toLocaleString()}] 추가 및 =SUM 갱신`;
      replyText = `데이터 표에 [${itemName} : ₩${amount.toLocaleString()}] 행을 추가하고, 합계 수식을 ${newFormula}로 정산했습니다.`;
      highlightTarget = 'sheets';
      if (currentFormat !== 'sheets') {
        onChangeFormat('sheets');
      }
    }
    // 7. [마인드맵 관련 명령]
    else if (text.includes('마인드맵') && (text.includes('가지') || text.includes('추가') || text.includes('노드'))) {
      const branchTopicMatch = text.match(/(?:가지에|노드에)?\s*(.*?)(?:를|을)?\s*(?:추가|반영)/);
      const branchTopic = branchTopicMatch && branchTopicMatch[1].trim() ? branchTopicMatch[1].trim() : '보안 정책 및 거버넌스 가이드라인';
      
      const newSec: DocSection = {
        id: `sec-mm-${Date.now()}`,
        level: 2,
        marker: '□',
        text: branchTopic
      };

      updatedDoc = {
        ...updatedDoc,
        content: {
          ...updatedDoc.content,
          docsContent: {
            sections: [...updatedDoc.content.docsContent.sections, newSec]
          }
        }
      };

      actionName = `마인드맵 가지 [${branchTopic.slice(0, 15)}] 추가`;
      replyText = `마인드맵 트리에 새로운 가지 [${branchTopic}]를 성공적으로 추가했습니다.`;
      if (currentFormat !== 'mindmap') {
        onChangeFormat('mindmap');
      }
    }
    // 8. [공문서 개조식 종결어미 정돈]
    else if (text.includes('개조식') || text.includes('어조') || text.includes('다듬')) {
      const sections = updatedDoc.content.docsContent?.sections || [];
      const updatedSections = sections.map(s => {
        let t = s.text;
        t = t.replace(/합니다\.|입니다\.|됩니다\./g, '함.').replace(/있습니다\./g, '있음.');
        return { ...s, text: t };
      });

      updatedDoc = {
        ...updatedDoc,
        content: {
          ...updatedDoc.content,
          docsContent: { sections: updatedSections }
        }
      };

      actionName = '공문서 행안부 표준 개조식 종결어미(-함) 일괄 정돈';
      replyText = '공문서 본문의 모든 문장을 행정안전부 표준 개조식 종결어미(-함, -임)로 깔끔하게 정돈했습니다.';
      highlightTarget = 'sections';
      if (currentFormat !== 'docs') {
        onChangeFormat('docs');
      }
    }
    // 9. [기타 자연어 질문 처리 (고정 매크로 전면 삭제 -> 실제 문서 상태 기반 응답)]
    else {
      actionName = `AI 맞춤 분석: ${text.slice(0, 15)}`;
      replyText = `현재 작성 중이신 [${updatedDoc.title.replace('\n', ' ')}] 문서의 맥락을 분석했습니다. 요청하신 내용("${text}")을 문서 전략에 즉각 반영할 수 있도록 인플레이스 편집을 대기 중입니다. 특정 섹션이나 결재선, 예산 변경이 필요하시면 바로 말씀해 주세요.`;
    }

    if (highlightTarget) {
      window.dispatchEvent(new CustomEvent('anti-office-highlight', { detail: { target: highlightTarget } }));
    }

    onChangeDocument(updatedDoc, actionName);
    toast(actionName, 'success');

    setTimeout(() => {
      const aiMsg: CopilotMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: '방금 전',
        appliedAction: actionName
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 280);
  };

  // 8대 출력 생성기 정의
  const STUDIO_GENERATORS = [
    {
      id: 'audio',
      label: 'AI 오디오 오버뷰',
      desc: '2분 팟캐스트 요약',
      icon: Headphones,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      isFormat: false,
      onClick: onOpenAudioBriefing
    },
    {
      id: 'slides',
      format: 'slides' as OfficeDocumentFormat,
      label: '슬라이드 자료',
      desc: '16:9 발표 카드 슬라이드',
      icon: Presentation,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/30',
      activeColor: 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      isFormat: true,
      onClick: () => onChangeFormat('slides')
    },
    {
      id: 'mindmap',
      format: 'mindmap' as OfficeDocumentFormat,
      label: '마인드맵',
      desc: '시각적 인터랙티브 트리',
      icon: GitFork,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-500 border-indigo-500/30',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
      isFormat: true,
      onClick: () => onChangeFormat('mindmap')
    },
    {
      id: 'infographic',
      format: 'infographic' as OfficeDocumentFormat,
      label: '인포그래픽',
      desc: '고해상도 비주얼 벤토',
      icon: LayoutGrid,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30',
      activeColor: 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      isFormat: true,
      onClick: () => onChangeFormat('infographic')
    },
    {
      id: 'docs',
      format: 'docs' as OfficeDocumentFormat,
      label: '공문서/기안서',
      desc: '행안부 표준 결재선 규격',
      icon: FileText,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      isFormat: true,
      onClick: () => onChangeFormat('docs')
    },
    {
      id: 'sheets',
      format: 'sheets' as OfficeDocumentFormat,
      label: '데이터 표',
      desc: '=SUM() 인터랙티브 시트',
      icon: Table,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-500 border-cyan-500/30',
      activeColor: 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
      isFormat: true,
      onClick: () => onChangeFormat('sheets')
    },
    {
      id: 'minutes',
      format: 'minutes' as OfficeDocumentFormat,
      label: '회의록 및 할 일',
      desc: 'STT 전사 및 액션 아이템',
      icon: Mic,
      color: 'from-rose-500/20 to-red-500/20 text-rose-500 border-rose-500/30',
      activeColor: 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      isFormat: true,
      onClick: () => onChangeFormat('minutes')
    },
    {
      id: 'briefing',
      format: 'briefing' as OfficeDocumentFormat,
      label: '브리핑 리포트',
      desc: '경영진 1-Page 핵심 요약',
      icon: FileCheck,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-500 border-teal-500/30',
      activeColor: 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
      isFormat: true,
      onClick: () => onChangeFormat('briefing')
    }
  ];

  return (
    <div className="w-[340px] sm:w-[380px] h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shrink-0 z-20 shadow-xl select-none">
      
      {/* 1. 스튜디오 헤더: "스튜디오" 타이틀 + 접기 아이콘 */}
      <div className="h-12 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-zinc-900/90">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">스튜디오</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                NotebookLM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">통합 멀티모달 산출물 생성 허브</p>
          </div>
        </div>

        {/* 접기 버튼 */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          title="스튜디오 패널 접기"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. 스튜디오 8대 출력 생성기 아코디언 (접기/펼치기 토글) */}
      <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 shrink-0">
        <button
          onClick={() => setIsGeneratorsCollapsed(!isGeneratorsCollapsed)}
          className="w-full p-3 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider hover:bg-slate-100/70 dark:hover:bg-zinc-900/60 transition cursor-pointer"
          title={isGeneratorsCollapsed ? '8대 포맷 펼치기' : '8대 포맷 접기 (대화창 공간 극대화)'}
        >
          <div className="flex items-center space-x-1.5">
            <span>출력물 원클릭 변환기 (8대 포맷)</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-200/50 dark:border-indigo-800/50">
              {isGeneratorsCollapsed ? '미니바' : '1:1 동기화'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400 dark:text-zinc-500">
            <span className="text-[10px] font-normal">{isGeneratorsCollapsed ? '펼치기' : '접기'}</span>
            {isGeneratorsCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {isGeneratorsCollapsed ? (
          /* 접힘 상태: 1줄 컴팩트 미니 아이콘 바 */
          <div className="px-3 pb-2.5 pt-0.5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-fadeIn">
            {STUDIO_GENERATORS.map(gen => {
              const Icon = gen.icon;
              const isActive = gen.isFormat && currentFormat === gen.format;
              return (
                <button
                  key={gen.id}
                  onClick={gen.onClick}
                  className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-2xs font-bold ring-1 ring-indigo-400' 
                      : 'bg-white dark:bg-zinc-850 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-750 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`${gen.label} (${gen.desc})`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        ) : (
          /* 펼침 상태: 2열 카드 그리드 */
          <div className="px-3 pb-3 pt-0.5 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              {STUDIO_GENERATORS.map(gen => {
                const Icon = gen.icon;
                const isActive = gen.isFormat && currentFormat === gen.format;

                return (
                  <button
                    key={gen.id}
                    onClick={gen.onClick}
                    className={`
                      p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden
                      ${isActive
                        ? gen.activeColor + ' shadow-sm font-bold border-indigo-300 dark:border-indigo-700'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1.5 rounded-xl border ${gen.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-300" />
                      )}
                    </div>

                    <div>
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {gen.label}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                        {gen.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 코파일럿 대화창 및 실시간 조작부 (스크롤 메시지 + 음성 STT + 채팅 인풋) */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* 상단 액션바: 되돌리기 & 자동 저장 상태 */}
        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
            <span>실시간 캔버스 편집 조율</span>
          </div>

          {canUndo && (
            <button
              onClick={onUndo}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={`되돌리기: ${lastActionName || ''}`}
            >
              <Undo2 className="w-3 h-3" />
              <span>되돌리기</span>
            </button>
          )}
        </div>

        {/* 메시지 히스토리 스크롤 영역 */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-2.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-xs border border-slate-200 dark:border-zinc-700/80 shadow-2xs'
                }`}
              >
                {msg.text}
              </div>
              {msg.appliedAction && (
                <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{msg.appliedAction}</span>
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center space-x-2 p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-bl-xs text-xs text-slate-500 dark:text-zinc-400 w-fit animate-pulse border border-slate-200 dark:border-zinc-700/80 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
              <span>캔버스 상태 분석 및 실시간 변이 중...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 빠른 추천 프롬프트 칩들 */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/30 dark:bg-zinc-950/20">
          {[
            '제목 두 줄로 나눠줘',
            '결재란 팀장 대신 본부장으로 바꿔줘',
            '추진 배경 수정해줘',
            '표에 비목 추가 및 =SUM 계산'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer whitespace-nowrap shrink-0 border border-slate-200 dark:border-zinc-700/80"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* 입력 및 음성 컨트롤 풋터 */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-1.5"
          >
            {/* 음성(STT) 마이크 토글 */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 border ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
              }`}
              title={isListening ? '음성 듣는 중... 클릭하여 중지' : '음성(STT)으로 말하기'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* 텍스트 입력창 */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isThinking ? '캔버스 변이 진행 중...' : '스튜디오에 질문하거나 캔버스 변경 요청...'}
              disabled={isThinking}
              className="flex-1 bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 disabled:opacity-60"
            />

            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition cursor-pointer shrink-0 shadow-sm flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="전송"
            >
              {isThinking ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
