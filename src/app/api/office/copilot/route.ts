// src/app/api/office/copilot/route.ts
// 오피스 스튜디오 코파일럿 실시간 공문서 재작문 Gemini API 라우트 (Next.js App Router 호환)

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || body.message || body.text || '').trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: '지시 내용(prompt)이 누락되었습니다.' }), {
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

    const currentDoc = body.currentDoc || null;
    const sources = Array.isArray(body.sources) ? body.sources : [];
    const requestedModel = body.model || 'gemini-2.0-flash';

    // 지식 창고 컨텍스트 주입
    let sourcesContext = '';
    if (sources.length > 0) {
      sourcesContext = sources
        .filter((s: any) => s.isSelected !== false)
        .map((s: any) => `[사내 지식 창고: ${s.title}]\n${s.content || s.summary || ''}`)
        .join('\n\n');
    }

    const systemPrompt = `당신은 대한민국 최고 수준의 행정 공문서 및 기업 전문 기안서 작성 AI입니다.
사용자의 지시사항과 사내 지식 창고 데이터를 바탕으로, 중앙 캔버스에 100% 즉시 반영할 수 있는 완벽한 기안서 JSON을 생성하십시오.

[작성 및 변이 규칙]
1. 사용자가 요구한 주제(예: '스마트 시설 유지 관리', 'AI 에이전트 도입', '신규 사업 기획' 등)를 깊이 있게 파악하여, 실무급 행정 기안서 체계로 전문성 있게 작성할 것.
2. 제목(title)은 단순 단어가 아니라 완전한 공식 기안서 제목(예: "2026년 IoT 기반 스마트 시설물 예지보전 및 통합 유지관리 솔루션 도입 제안서")으로 작문할 것.
3. 추진 배경, 도입 방안, 소요 예산/기대 효과를 1, 2, 3 단계 계층으로 명확히 구분할 것.
4. 응답은 오직 아래 JSON 형식으로만 출력할 것 (마크다운 백틱 없이 순수 JSON만 반환):

{
  "title": "공식 기안서 제목",
  "replyText": "사용자에게 작업 완료를 알리는 정중하고 구체적인 브리핑 문장",
  "actionName": "작업 내역 요약 (예: 스마트 시설물 통합 유지관리 솔루션 기안서 전면 재작성)",
  "metadata": {
    "author": "담당 매니저",
    "department": "주관 부서명",
    "approvers": ["기안자(기안)", "팀장(검토)", "본부장(결재)"]
  },
  "sections": [
    {
      "title": "1. 추진 배경 및 목적",
      "items": [
        "핵심 추진 배경 문장",
        "기존 방식의 한계 및 개선 필요성",
        "규정 및 업무 효율성 제고 목적"
      ]
    },
    {
      "title": "2. 핵심 도입 방안 및 로드맵",
      "items": [
        "핵심 실행 과제 및 파일럿 계획",
        "단계별 인프라 구축 및 시스템 연동",
        "안정화 및 전사 확산 로드맵"
      ]
    },
    {
      "title": "3. 소요 예산 및 기대 효과",
      "items": [
        "총 소요 예산 규모 및 항목별 배분",
        "업무 공수 절감 및 비용 효율화 등 정량적 기대 효과",
        "사내 업무 표준화 및 안전 무결성 확보"
      ]
    }
  ],
  "sheetRows": [
    [1, "핵심 장비/솔루션 라이선스", "1차 도입 구축", 15000000, "초기 세팅"],
    [2, "시스템 연동 및 커스터마이징", "API 및 대시보드 구축", 18000000, "검수 시"],
    [3, "운영자 교육 및 유지보수", "현장 배포 및 가이드", 9000000, "안정화"]
  ],
  "slides": [
    {
      "slideNumber": 1,
      "title": "핵심 사업 제안",
      "subtitle": "개요 및 필요성",
      "bullets": ["현안 과제 분석", "핵심 해결책 제시", "선제적 대응 체계"]
    },
    {
      "slideNumber": 2,
      "title": "추진 로드맵 및 기대 효과",
      "subtitle": "단계별 실행 계획",
      "bullets": ["1단계: 파일럿 검증", "2단계: 전사 시스템 연동", "유지관리 공수 대폭 절감"]
    }
  ]
}`;

    const userPrompt = `[사용자 지시사항]: ${prompt}

[현재 캔버스 문서 정보]:
제목: ${currentDoc?.title || '미정'}
기존 메타: ${JSON.stringify(currentDoc?.metadata || {})}

${sourcesContext ? `[참조 사내 지식 창고]:\n${sourcesContext}` : ''}

위 내용을 기반으로 공문서 기안 JSON을 생성해 주십시오.`;

    const candidateModels = Array.from(
      new Set([
        requestedModel.replace(/^models\//, '').trim(),
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash'
      ])
    );

    let lastError = '';

    for (const m of candidateModels) {
      try {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          lastError = errData?.error?.message || `모델 ${m} 응답 코드: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err: any) {
        lastError = err.message;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ error: `Gemini 기안문 생성 실패: ${lastError || '알 수 없는 오류'}` }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `서버 내부 오류: ${err.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
