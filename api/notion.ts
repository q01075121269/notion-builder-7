export default async function handler(req: any, res: any) {
  // CORS 프리플라이트 응답
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');
    return res.status(200).end();
  }

  // 1. 경로 파싱: query.path(문자열/배열) 또는 req.url에서 추출
  let pathStr = '';
  if (req.query && req.query.path) {
    pathStr = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  } else if (req.url) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const pathname = urlObj.pathname.replace(/^\/api\/notion\/?/, '');
      pathStr = pathname;
    } catch {
      pathStr = '';
    }
  }

  // 앞뒤 슬래시 정리
  pathStr = pathStr.replace(/^\/+|\/+$/g, '');

  // 노션 API 버전 접두어(v1) 보장: "pages" -> "v1/pages"
  if (pathStr && !pathStr.startsWith('v1')) {
    pathStr = `v1/${pathStr}`;
  }

  const notionUrl = `https://api.notion.com/${pathStr}`;

  const headers: Record<string, string> = {
    'Notion-Version': '2022-06-28'
  };

  if (req.headers['authorization']) {
    headers['Authorization'] = req.headers['authorization'];
  }
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const notionRes = await fetch(notionUrl, fetchOptions);
    const contentType = notionRes.headers.get('content-type') || '';
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('application/json')) {
      const data = await notionRes.json();
      return res.status(notionRes.status).json(data);
    } else {
      const text = await notionRes.text();
      return res.status(notionRes.status).send(text);
    }
  } catch (err: any) {
    console.error('Notion proxy error:', err);
    return res.status(502).json({ error: 'Notion 서버 통신 실패: ' + err.message });
  }
}
