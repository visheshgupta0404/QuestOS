import { apiError, sameOrigin } from '@/lib/server/config';
import { session } from '@/lib/server/session';
export async function POST(req: Request) {
  try {
    sameOrigin(req); const s = await session();
    let revoked = true;
    if (s.refreshToken) {
      try { const r = await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', body: new URLSearchParams({ token: s.refreshToken }), signal: AbortSignal.timeout(10000) }); revoked = r.ok; } catch { revoked = false; }
    }
    s.destroy();
    return Response.json({ disconnected: true, revoked, message: revoked ? 'Google access revoked and session cleared.' : 'Session cleared. Revoke QuestOS manually in your Google Account connections.' });
  } catch (e) { return apiError(e); }
}
