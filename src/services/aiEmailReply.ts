// src/services/aiEmailReply.ts
// 3단 상황 맞춤형 AI 답장 초안 생성 엔진 (정중한 수락 / 일정 재조율 / 간결한 거절)
// Gemini API 연동 및 고품질 비즈니스 한국어 서식 엔진

export type ReplyScenario = 'accept' | 'reschedule' | 'decline';

export interface EmailReplyResult {
  scenario: ReplyScenario;
  scenarioLabel: string;
  subject: string;
  body: string;
  engine: 'gemini' | 'template';
  generatedAt: string;
}

interface GenerateReplyParams {
  mailSubject: string;
  senderName: string;
  senderEmail?: string;
  mailBody: string;
  scenario: ReplyScenario;
  apiKey?: string;
}

/**
 * 이메일 맥락에 맞춰 3단 상황(정중한 수락/일정 재조율/간결한 거절)의 비즈니스 회신문을 생성
 */
export async function generateEmailReplyDraft({
  mailSubject,
  senderName,
  senderEmail: _senderEmail,
  mailBody,
  scenario,
  apiKey
}: GenerateReplyParams): Promise<EmailReplyResult> {
  const now = new Date();
  const generatedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const scenarioLabels: Record<ReplyScenario, string> = {
    accept: '🤝 정중한 수락',
    reschedule: '📅 일정 재조율',
    decline: '🙏 간결한 거절'
  };

  const replySubject = mailSubject.startsWith('Re:') ? mailSubject : `Re: ${mailSubject}`;

  // 1. Gemini API 키가 제공된 경우 실제 LLM 호출 시도
  if (apiKey && apiKey.trim().length > 5) {
    try {
      const scenarioPrompts: Record<ReplyScenario, string> = {
        accept: '상대방의 요청이나 제안을 매우 정중하고 긍정적으로 수락하며, 후속 진행 일정이나 협조 사항을 밝히는 비즈니스 회신 메일',
        reschedule: '기존 제안받은 일정에 부득이한 선약이 있어 양해를 구하고, 다음 주 화요일/수요일 오전 등 대안 일정을 정중하게 역제안하는 비즈니스 회신 메일',
        decline: '제안에 깊이 감사드리나, 현재 진행 중인 우선순위 프로젝트 및 리소스 한계로 인해 정중하면서도 군더더기 없이 사양하는 깔끔한 비즈니스 회신 메일'
      };

      const prompt = `
당신은 최고의 비즈니스 커뮤니케이션 전문가입니다.
아래 수신된 메일 정보를 바탕으로 [${scenarioLabels[scenario]}] 상황에 완벽히 부합하는 한국어 이메일 답장 본문을 작성해 주세요.

[수신 메일 정보]
- 발신자: ${senderName}
- 제목: ${mailSubject}
- 원본 본문 요약/내용: ${mailBody.slice(0, 500)}

[회신 상황]
${scenarioPrompts[scenario]}

[작성 가이드라인]
1. 정중한 경어체와 한국 비즈니스 이메일 표준 서식을 준수하세요.
2. 인사말 -> 수신 확인 및 감사 -> 핵심 답변/상황 설명 -> 후속 조치/맺음말 구조로 3~4개 단락으로 작성하세요.
3. 발신자 서명 란은 '[보내는 사람 드림]' 형태로 남겨두세요.
4. 제목이나 기타 잡담 없이 메일 본문 내용만 순수 텍스트로 출력하세요.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText && generatedText.trim().length > 20) {
          return {
            scenario,
            scenarioLabel: scenarioLabels[scenario],
            subject: replySubject,
            body: generatedText.trim(),
            engine: 'gemini',
            generatedAt
          };
        }
      }
    } catch (err) {
      console.warn('Gemini 답장 생성 실패, 스마트 템플릿 엔진으로 전환:', err);
    }
  }

  // 2. 스마트 비즈니스 템플릿 폴백 엔진 (100% 즉시 동작)
  let fallbackBody = '';

  if (scenario === 'accept') {
    fallbackBody = `안녕하세요, ${senderName}님.

보내주신 "${mailSubject}" 관련 메일 감사히 잘 확인하였습니다.

말씀해 주신 내용과 제안 사항을 면밀히 검토하였으며, 요청하신 방향대로 적극 협조하여 진행하고자 합니다.
필요하신 추가 서류나 사전 준비 사항이 있다면 편하게 공유 부탁드립니다.

구체적인 추진 일정 및 세부 마일스톤에 대해서는 다음 주 초 다시 한번 업데이트 드리겠습니다.

감사합니다.
좋은 하루 보내세요.

[보내는 사람 드림]`;
  } else if (scenario === 'reschedule') {
    fallbackBody = `안녕하세요, ${senderName}님.

보내주신 "${mailSubject}" 안건 감사히 확인하였습니다.

제안해 주신 일정에 참석하고자 하였으나, 해당 시간대에 사전에 확정된 긴급 회의가 있어 부득이하게 참석이 어려운 상황입니다.
일정에 차질을 드려 너른 양해를 부탁드립니다.

혹시 괜찮으시다면 아래 일정 중 편하신 시간대로 재조율이 가능할지 여쭙고자 합니다:
• 대안 1: 9월 22일(화) 10:30 ~ 11:30
• 대안 2: 9월 23일(수) 14:00 ~ 15:00

일정 확인 후 회신 주시면 캘린더 초대장을 발송해 드리도록 하겠습니다.

감사합니다.

[보내는 사람 드림]`;
  } else {
    // decline
    fallbackBody = `안녕하세요, ${senderName}님.

보내주신 "${mailSubject}" 제안 감사히 잘 확인하였습니다.

귀중한 기회와 정성스러운 제안을 주셔서 깊이 감사드립니다.
다만, 현재 저희 팀에서 집중하고 있는 하반기 주요 릴리즈 일정과 가용 리소스의 한계로 인해, 아쉽게도 이번 건에 대해서는 함께 진행하기 어려운 상황임을 말씀드립니다.

좋은 제안을 주셨음에도 긍정적인 답변을 드리지 못해 송구한 마음이며, 추후 더 좋은 기회에 다시 인사드릴 수 있기를 기대하겠습니다.

귀사의 무궁한 발전을 기원합니다.

감사합니다.

[보내는 사람 드림]`;
  }

  return {
    scenario,
    scenarioLabel: scenarioLabels[scenario],
    subject: replySubject,
    body: fallbackBody,
    engine: 'template',
    generatedAt
  };
}
