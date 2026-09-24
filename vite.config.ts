import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import https from 'https'

// Gemini API 보안 격리 프록시 플러그인 (브라우저 네트워크 URL에 API Key 평문 노출 방지)
function geminiApiProxyPlugin(): Plugin {
  let env: Record<string, string> = {}

  return {
    name: 'gemini-api-proxy',
    configResolved(config) {
      env = loadEnv(config.mode, process.cwd(), '')
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/auth/health')) {
          let bodyBuffer = ''
          req.on('data', (chunk) => {
            bodyBuffer += chunk
          })
          req.on('end', async () => {
            let bodyObj: any = {}
            try {
              if (bodyBuffer) bodyObj = JSON.parse(bodyBuffer)
            } catch (e) {}

            const geminiApiKey =
              (req.headers['x-gemini-api-key'] as string) ||
              bodyObj.geminiApiKey ||
              env.GEMINI_API_KEY ||
              process.env.GEMINI_API_KEY ||
              ''
            const notionApiKey =
              (req.headers['x-notion-api-key'] as string) ||
              bodyObj.notionApiKey ||
              env.NOTION_API_KEY ||
              process.env.NOTION_API_KEY ||
              ''

            let geminiResult = { ok: false, message: '🔴 인증 실패 (키를 다시 확인해 주세요)' }
            let notionResult = { ok: false, message: '🔴 인증 실패 (키를 다시 확인해 주세요)' }

            // 1. Gemini Check
            if (geminiApiKey) {
              try {
                const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)
                if (gRes.ok) {
                  geminiResult = { ok: true, message: '🟢 노아 AI 연동 완료' }
                } else {
                  const errData: any = await gRes.json().catch(() => ({}))
                  geminiResult = { ok: false, message: `🔴 인증 실패: ${errData.error?.message || gRes.statusText}` }
                }
              } catch (err: any) {
                geminiResult = { ok: false, message: `🔴 인증 실패 (네트워크 오류: ${err.message})` }
              }
            } else {
              geminiResult = { ok: false, message: '🔴 인증 실패 (Gemini API 키가 설정되지 않음)' }
            }

            // 2. Notion Check
            if (notionApiKey) {
              try {
                const nRes = await fetch('https://api.notion.com/v1/users/me', {
                  headers: {
                    'Authorization': `Bearer ${notionApiKey}`,
                    'Notion-Version': '2022-06-28',
                  },
                })
                if (nRes.ok) {
                  notionResult = { ok: true, message: '🟢 Notion API 연동 완료' }
                } else {
                  const errData: any = await nRes.json().catch(() => ({}))
                  notionResult = { ok: false, message: `🔴 인증 실패: ${errData.message || nRes.statusText}` }
                }
              } catch (err: any) {
                notionResult = { ok: false, message: `🔴 인증 실패 (네트워크 오류: ${err.message})` }
              }
            } else {
              notionResult = { ok: false, message: '🔴 인증 실패 (Notion API 키가 설정되지 않음)' }
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ gemini: geminiResult, notion: notionResult }))
          })
          return
        }

        if (req.url && req.url.startsWith('/api/gemini')) {
          const urlObj = new URL(req.url, 'http://localhost:5173')
          const rawModel = urlObj.searchParams.get('model') || 'gemini-2.5-flash'
          const model = rawModel.replace(/^models\//, '').trim() || 'gemini-2.5-flash'
          
          // 1. 보안 감사: 관리자 화이트리스트 기반 내부 API 호출 차단 검증
          const rawAdminEmails = env.VITE_ADMIN_EMAILS || env.VITE_ADMIN_EMAIL || process.env.VITE_ADMIN_EMAILS || process.env.VITE_ADMIN_EMAIL || ''
          const adminList = rawAdminEmails
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
            .filter((e: string) => e.length > 0)

          const userEmail = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase()

          // 관리자 화이트리스트가 활성화되어 있는 경우, 미인가 계정의 API 호출 즉시 403 차단
          if (adminList.length > 0 && (!userEmail || !adminList.includes(userEmail))) {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              error: '미인가 계정의 API 접근이 차단되었습니다. 관리자 승인 계정으로 로그인해 주세요.' 
            }))
            return
          }

          // 2. 헤더 또는 서버 환경 변수에서 안전하게 키 획득
          const apiKey = 
            (req.headers['x-gemini-api-key'] as string) || 
            env.GEMINI_API_KEY || 
            process.env.GEMINI_API_KEY || 
            ''

          if (!apiKey) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Gemini API Key가 설정되지 않았습니다.' }))
            return
          }

          let bodyBuffer = ''
          req.on('data', (chunk) => {
            bodyBuffer += chunk
          })

          req.on('end', () => {
            const candidateModels = Array.from(
              new Set([model, 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'])
            );

            const tryModel = (idx: number) => {
              if (idx >= candidateModels.length) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: '모든 Gemini 모델 호출에 실패했습니다.' }));
                return;
              }

              const currentM = candidateModels[idx];
              const targetPath = `/v1beta/models/${currentM}:generateContent?key=${apiKey}`;
              const options = {
                hostname: 'generativelanguage.googleapis.com',
                port: 443,
                path: targetPath,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(bodyBuffer),
                },
              };

              const proxyReq = https.request(options, (proxyRes) => {
                let responseData = '';
                proxyRes.on('data', (chunk) => {
                  responseData += chunk;
                });
                proxyRes.on('end', () => {
                  const isNotFound =
                    proxyRes.statusCode === 404 ||
                    responseData.includes('not found') ||
                    responseData.includes('no longer available') ||
                    responseData.includes('NOT_FOUND');

                  if (isNotFound && idx < candidateModels.length - 1) {
                    console.warn(`[Vite Gemini Proxy] Model '${currentM}' 404/지원종료 감지. '${candidateModels[idx + 1]}'로 자동 전환합니다.`);
                    tryModel(idx + 1);
                    return;
                  }
                  res.statusCode = proxyRes.statusCode || 200;
                  res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
                  res.end(responseData);
                });
              });

              proxyReq.on('error', (err) => {
                console.error('Gemini proxy error:', err);
                if (idx < candidateModels.length - 1) {
                  tryModel(idx + 1);
                } else {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Gemini 서버 통신 실패: ' + err.message }));
                }
              });

              proxyReq.write(bodyBuffer);
              proxyReq.end();
            };

            tryModel(0);
          })
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geminiApiProxyPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/notion': {
        target: 'https://api.notion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notion/, ''),
        headers: {
          'Notion-Version': '2022-06-28',
        },
      },
    },
  },
})
