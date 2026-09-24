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

        // /api/orchestrator 로컬 개발 서버 프록시 및 멀티모달 오케스트레이터 핸들러 (404 방지)
        if (req.url && req.url.startsWith('/api/orchestrator')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, x-user-email, x-current-mode, x-notion-api-key')
            res.end()
            return
          }

          let bodyBuffer = ''
          req.on('data', (chunk) => {
            bodyBuffer += chunk
          })

          req.on('end', async () => {
            let bodyObj: any = {}
            try {
              if (bodyBuffer) bodyObj = JSON.parse(bodyBuffer)
            } catch (e) {}

            const apiKey =
              (req.headers['x-gemini-api-key'] as string) ||
              bodyObj.geminiApiKey ||
              env.GEMINI_API_KEY ||
              process.env.GEMINI_API_KEY ||
              ''

            if (!apiKey) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Gemini API 키가 설정되지 않았습니다. 우측 상단 [설정]에서 등록해 주세요.' }))
              return
            }

            const promptText = (bodyObj.prompt || bodyObj.text || bodyObj.message || '').trim()
            let rawImages = Array.isArray(bodyObj.images) ? [...bodyObj.images] : []
            if (bodyObj.image) {
              if (typeof bodyObj.image === 'string') {
                const mimeMatch = bodyObj.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
                const data = bodyObj.image.replace(/^data:image\/[^;]+;base64,/, '')
                rawImages.push({ mimeType, data })
              } else if (bodyObj.image.data) {
                rawImages.push(bodyObj.image)
              }
            }

            const currentTemplate = bodyObj.currentTemplate || bodyObj.current_template || null
            const rawModel = bodyObj.model || 'gemini-2.5-flash'
            const candidateModels = Array.from(
              new Set([rawModel.replace(/^models\//, '').trim(), 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro'])
            )

            // 시스템 프롬프트: 지능형 오케스트레이터 및 노션 빌더 스키마 갱신 지침
            const systemPrompt = `당신은 올인원 워크스페이스의 수석 대화형 AI 오케스트레이터입니다.
사용자의 지시사항, 첨부 이미지(Vision), 첨부 문서를 정밀 분석하여 응답을 JSON 형식으로 반환하십시오.

[응답 JSON 규격]
{
  "intent": "BUILDER" | "CHAT" | "LIFE" | "DEVLAB",
  "reply_message": "사용자에게 전할 명확하고 친절한 설명 (한국어 구어체)",
  "needs_clarification": false,
  "redirect_url": null,
  "payload": {
    "template_topic": "템플릿 주제",
    "suggested_title": "노션 페이지 제목",
    "db_schema": [
      {
        "name": "DB 이름",
        "icon": "📋",
        "description": "DB 설명",
        "properties": [
          { "id": "prop-1", "name": "이름", "type": "title" },
          { "id": "prop-2", "name": "상태", "type": "status" }
        ],
        "sample_rows": []
      }
    ],
    "formulas": [],
    "value_add": []
  }
}

[핵심 규칙 - Vision 시각 분석 및 캔버스 스키마 수정]
1. 사용자가 화면 캡처, 표 이미지 등을 첨부했거나 캔버스 스키마 수정을 요청한 경우:
   - "intent": "BUILDER"로 설정하고, 현재 캔버스 템플릿의 databases 스키마를 정밀 분석하여 사용자가 의도한 수정사항(컬럼 추가, 삭제, 명칭/타입 변경, 수식 보정 등)을 완벽히 반영한 갱신된 "db_schema"를 payload에 반드시 포함하십시오.
2. 사용자가 "타임라인(간트 차트)" 등 노션 API 외부 생성이 제한된 뷰를 요청한 경우:
   - 절대로 에러를 내지 말고, 데이터베이스 스키마에 "일정(date)", "기간(date)", "진행 상태(status)" 속성을 100% 무손실 설계하십시오.
   - 타깃 DB의 "views" 배열에 반드시 { "id": "timeline", "type": "timeline", "name": "타임라인" } 을 추가하고 view_type도 "timeline"으로 지정하십시오.
   - reply_message에 "웹 프로그램 캔버스에서는 타임라인 뷰를 즉시 추가·확인하실 수 있으며, 노션으로 내보낼 때는 일정/상태 속성이 100% 무손실 저장되고 상단에 '1초 만에 타임라인 뷰를 켜는 가이드'가 동봉됩니다." 형태로 정중하고 당당하게 대안을 제시하십시오.
3. 사용자가 "아이콘을 별 모양(또는 특정 이모지)으로 바꿔줘", "이모지 변경해줘"라고 요청한 경우:
   - 절대로 기존 DB 이름이나 기존 이모지 앞에 새 이모지를 중복해서 덧붙이지 마십시오!
   - 기존 DB 이름의 선행 이모지나 특수기호를 완전히 제거하고 순수 텍스트 제목만 유지하십시오. (예: "📋 프로젝트 관리" -> "프로젝트 관리")
   - DB 객체의 "icon" 필드에 요청된 새 이모지(예: "⭐")를 단독 설정하여 깨끗하게 대체(Replace)하십시오.
4. 일반 대화인 경우:
   - "intent": "CHAT", "reply_message": "답변", "payload": null 로 응답하십시오.`

            // 멀티모달 parts 조립
            const userParts: any[] = []
            for (const img of rawImages) {
              if (img && img.data) {
                userParts.push({
                  inlineData: {
                    mimeType: img.mimeType || 'image/png',
                    data: img.data.replace(/^data:image\/[^;]+;base64,/, '')
                  }
                })
              }
            }

            let enrichedPrompt = promptText
            if (currentTemplate) {
              enrichedPrompt = `[CURRENT_CANVAS_TEMPLATE_CONTEXT]\n제목: ${currentTemplate.title}\nDB목록:\n${JSON.stringify(currentTemplate.databases?.map((d: any) => ({ name: d.name, properties: d.properties })) || [], null, 2)}\n[/CURRENT_CANVAS_TEMPLATE_CONTEXT]\n\n${promptText}`
            }
            userParts.push({ text: enrichedPrompt || '현재 캔버스 스키마를 분석하고 최적화해줘.' })

            const contents = [
              {
                role: 'user',
                parts: userParts
              }
            ]

            const requestBody = {
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              contents,
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json'
              }
            }

            let lastErr = null
            for (const m of candidateModels) {
              try {
                const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody)
                })

                if (!gRes.ok) {
                  const errText = await gRes.text()
                  lastErr = new Error(`Gemini ${m} failed (${gRes.status}): ${errText}`)
                  continue
                }

                const data: any = await gRes.json()
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleanJson)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify({
                  intent: parsed.intent || 'BUILDER',
                  reply_message: parsed.reply_message || '스키마 분석 및 수정이 완료되었습니다.',
                  needs_clarification: Boolean(parsed.needs_clarification),
                  redirect_url: parsed.redirect_url || null,
                  payload: parsed.payload || null
                }))
                return
              } catch (e: any) {
                lastErr = e
                continue
              }
            }

            // 모든 모델 실패 시 정직하게 에러 반환 (가짜 성공 없음)
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              error: `Gemini API 호출에 실패했습니다: ${lastErr?.message || '알 수 없는 오류'}`
            }))
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
