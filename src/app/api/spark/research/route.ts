// src/app/api/spark/research/route.ts
// Gemini Google Search Grounding 실시간 자율 웹 리서치 API (Next.js App Router 호환)

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || body.query || body.prompt || '').trim();

    if (!topic) {
      return new Response(JSON.stringify({ error: '리서치 주제(topic)가 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey =
      req.headers.get('x-gemini-api-key') ||
      body.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API 키가 설정되지 않았습니다. 우측 상단 [설정]에서 API 키를 등록해 주세요.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const systemPrompt = `너는 젠스파크(Genspark) 수준의 자율 리서치 슈퍼 에이전트다. 
사용자의 검색 주제에 대해 인터넷 전역의 최신 통계, 공공기관 규격, 기업 실증 사례, ROI 수치를 조사하고, 
반드시 아래의 엄격한 순수 JSON 스키마 규격으로만 응답하라. (마크다운 백틱 \`\`\`json 등은 절대 쓰지 말고 순수 JSON 문자열만 출력할 것)

[필수 반환 JSON 데이터 스키마]
{
  "topic": "${topic}",
  "hero": {
    "title": "공식 보고서 수준의 핵심 완성형 헤드라인 (예: 2026 스마트 시설물 예지보전 및 AI 에이전트 행정 자동화 추진 전략)",
    "summary": "구글 실시간 검색에서 확인된 공공 지침, 기술 표준, 실증 효과를 종합한 2~3줄 요약 브리핑",
    "confidence": 99.4,
    "takeaways": [
      { "id": 1, "title": "핵심 결론 1 제목", "desc": "상세 수치 및 팩트가 담긴 1줄 설명" },
      { "id": 2, "title": "핵심 결론 2 제목", "desc": "상세 수치 및 팩트가 담긴 1줄 설명" },
      { "id": 3, "title": "핵심 결론 3 제목", "desc": "상세 수치 및 팩트가 담긴 1줄 설명" }
    ]
  },
  "kpis": [
    { "label": "행정 공수 절감", "value": "-78%", "sub": "수기 점검 대비", "change": "▲ 4.2배 단축", "progress": 85 },
    { "label": "투자 대비 ROI", "value": "320%", "sub": "11개월 내 회수", "change": "★ 경제성 입증", "progress": 92 },
    { "label": "법적 오류율", "value": "0.02%", "sub": "규격 자동 검증", "change": "▼ 99.8% 예방", "progress": 98 }
  ],
  "milestones": [
    { "step": "Q1", "title": "인프라 및 센서 표준 규격 셋업", "desc": "국토부 표준 및 보안 게이트웨이 파이프라인 연동", "status": "완료" },
    { "step": "Q2", "title": "현장 시범 실증 및 이상진단 AI 고도화", "desc": "주요 건축물 5개소 파일럿 적용 및 데이터 수집", "status": "진행중" },
    { "step": "Q3", "title": "전사 확산 및 행정망 정식 인증", "desc": "국가정보원 보안성 심의 및 전국 단위 확산", "status": "대기" }
  ],
  "strategies": [
    { "id": "A", "name": "온프레미스 + AI 게이트웨이 하이브리드", "type": "정석 하이브리드", "budget": "초기 3,200만 / 월 120만", "pros": "공공 행정망 보안 100% 충족 및 안정적 도입", "cons": "구축 기간 약 8주 소요" },
    { "id": "B", "name": "자율 에이전트 기반 완전 무인 모니터링", "type": "완전 자율 무인화", "budget": "초기 4,800만 / 월 210만", "pros": "24시간 무인 가동 및 야간 인건비 90% 이상 절감", "cons": "초기 정밀 AI 학습 데이터 셋 구축 필요" },
    { "id": "C", "name": "클라우드 SaaS 신속 도입형 MVP", "type": "초단기 MVP", "budget": "초기 800만 / 월 65만", "pros": "2주 내 즉시 체감 성과 창출 및 경영진 조기 보고", "cons": "내부 행정망과의 전용선 연동 제약" }
  ],
  "sources": [
    { "title": "출처명", "url": "https://...", "domain": "기관/언론사 도메인", "snippet": "핵심 팩트 요약" }
  ]
}`;

    const userPrompt = `주제: "${topic}"\n위 주제에 대해 최신 구글 웹 검색을 수행하여 팩트 기반의 Bento Grid 스파크페이지 JSON을 생성하라.`;

    // Gemini 2.0 Flash + Google Search Grounding 호출
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      tools: [
        {
          googleSearch: {}
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.2,
        topP: 0.95
      }
    };

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Gemini Google Search Grounding Error]', response.status, errText);
      return new Response(
        JSON.stringify({
          error: `Gemini API 호출 실패 (${response.status}): ${errText}`
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const rawContent = candidate?.content?.parts?.[0]?.text || '';

    // 구글 검색 결과 메타데이터에서 실제 출처(Grounding Chunks) 추출
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchSources = groundingChunks.map((chunk: any) => {
      const web = chunk.web || {};
      let domain = '';
      try {
        if (web.uri) domain = new URL(web.uri).hostname.replace(/^www\./, '');
      } catch {}
      return {
        title: web.title || '공식 웹 기술 출처',
        url: web.uri || '#',
        domain: domain || 'google.com',
        snippet: web.title || ''
      };
    });

    // JSON 파싱
    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(cleanJson);
    } catch {
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedPayload = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gemini 응답에서 올바른 JSON을 추출할 수 없습니다.');
      }
    }

    // 실제 검색 출처가 있다면 모델 생성 sources와 합치거나 우선 주입
    if (webSearchSources.length > 0) {
      const existingSources = Array.isArray(parsedPayload.sources) ? parsedPayload.sources : [];
      const combinedSources = [...webSearchSources];
      existingSources.forEach((s: any) => {
        if (!combinedSources.some(ws => ws.url === s.url || ws.title === s.title)) {
          combinedSources.push(s);
        }
      });
      parsedPayload.sources = combinedSources.slice(0, 20);
    }

    parsedPayload.topic = topic;
    parsedPayload.generatedAt = new Date().toISOString();

    return new Response(JSON.stringify(parsedPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[Spark Research API Exception]', error);
    return new Response(
      JSON.stringify({
        error: error.message || '자율 웹 리서치 처리 중 예외가 발생했습니다.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
