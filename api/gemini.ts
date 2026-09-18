export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, x-user-email');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawModel = typeof req.query.model === 'string' ? req.query.model : 'gemini-3.6-flash';
  const requestedModel = rawModel.replace(/^models\//, '').trim() || 'gemini-3.6-flash';
  const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return res.status(401).json({ error: 'Gemini API Key가 설정되지 않았습니다.' });
  }

  // 2026년 기준 공식 권장 gemini-3.6-flash 최우선 배치 및 안전 Fallback 체인
  const candidateModels = Array.from(
    new Set([
      'gemini-3.6-flash',
      requestedModel,
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ])
  );

  let lastStatus = 500;
  let lastData: any = null;
  const attemptedModels = new Set<string>();

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    if (attemptedModels.has(model)) continue;
    attemptedModels.add(model);

    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      });

      const data = await geminiRes.json();
      if (geminiRes.ok) {
        return res.status(200).json(data);
      }

      lastStatus = geminiRes.status;
      lastData = data;

      const errMsg = JSON.stringify(data || '');

      // 구글 API 에러 메시지에서 추천 모델(예: "Please update your code to use models/gemini-3.6-flash")이 있는지 자동 감지
      const recMatch = errMsg.match(/use models\/([a-zA-Z0-9._-]+)/i);
      if (recMatch && recMatch[1]) {
        const recModel = recMatch[1].trim();
        if (!attemptedModels.has(recModel)) {
          candidateModels.splice(i + 1, 0, recModel);
        }
      }

      // 404 NOT_FOUND 또는 지원 종료("no longer available") 감지 시 서버 내부에서 즉시 다음 모델로 자동 Fallback
      const isNotFound =
        geminiRes.status === 404 ||
        errMsg.includes('not found') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('is not found for API version');

      if (isNotFound) {
        console.warn(`[Gemini Proxy] Model '${model}' 지원 불가 감지. 다음 대체 모델로 자동 전환합니다.`);
        continue;
      }

      // 401(인증 실패) 등은 모델 변경으로 해결 불가능하므로 즉시 반환
      return res.status(geminiRes.status).json(data);
    } catch (err: any) {
      console.error(`[Gemini Proxy] Error calling model '${model}':`, err);
      lastData = { error: 'Gemini 서버 통신 실패: ' + err.message };
    }
  }

  return res.status(lastStatus).json(lastData || { error: '모든 Gemini 모델 Fallback 호출에 실패했습니다.' });
}
