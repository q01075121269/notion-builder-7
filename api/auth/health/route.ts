import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const geminiApiKey =
      req.headers.get('x-gemini-api-key') ||
      body.geminiApiKey ||
      process.env.GEMINI_API_KEY ||
      '';
    const notionApiKey =
      req.headers.get('x-notion-api-key') ||
      body.notionApiKey ||
      process.env.NOTION_API_KEY ||
      '';

    let geminiResult = { ok: false, message: '🔴 인증 실패 (키를 다시 확인해 주세요)' };
    let notionResult = { ok: false, message: '🔴 인증 실패 (키를 다시 확인해 주세요)' };

    // 1. Gemini Live Health Check
    if (geminiApiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        if (res.ok) {
          geminiResult = { ok: true, message: '🟢 노아 AI 연동 완료' };
        } else {
          const errData = await res.json().catch(() => ({}));
          geminiResult = { ok: false, message: `🔴 인증 실패: ${errData.error?.message || res.statusText}` };
        }
      } catch (err: any) {
        geminiResult = { ok: false, message: `🔴 인증 실패 (네트워크 오류: ${err.message})` };
      }
    } else {
      geminiResult = { ok: false, message: '🔴 인증 실패 (Gemini API 키가 설정되지 않음)' };
    }

    // 2. Notion Live Health Check (notion.users.me())
    if (notionApiKey) {
      try {
        const res = await fetch('https://api.notion.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': '2022-06-28',
          },
        });
        if (res.ok) {
          notionResult = { ok: true, message: '🟢 Notion API 연동 완료' };
        } else {
          const errData = await res.json().catch(() => ({}));
          notionResult = { ok: false, message: `🔴 인증 실패: ${errData.message || res.statusText}` };
        }
      } catch (err: any) {
        notionResult = { ok: false, message: `🔴 인증 실패 (네트워크 오류: ${err.message})` };
      }
    } else {
      notionResult = { ok: false, message: '🔴 인증 실패 (Notion API 키가 설정되지 않음)' };
    }

    return NextResponse.json({
      gemini: geminiResult,
      notion: notionResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Health Check 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
