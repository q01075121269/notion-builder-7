// api/media/generate.ts
// Vite dev server & Node.js Serverless Handler for /api/media/generate

import { generateMediaData } from '../../src/app/api/media/generate/route.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }
    const { userPrompt = '', history, activeSubject, activeTitle, currentContext, aspectRatio = '16:9', apiKey } = body || {};
    const activeSub = activeSubject || currentContext?.lastSubject;
    const headerApiKey = req.headers ? req.headers['x-gemini-api-key'] : undefined;
    const result = await generateMediaData(userPrompt, history, activeSub, activeTitle, aspectRatio, apiKey || headerApiKey);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Generation failed' }));
  }
}
