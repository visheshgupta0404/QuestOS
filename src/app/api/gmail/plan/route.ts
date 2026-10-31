import { randomUUID } from 'node:crypto';
import { apiError, sameOrigin, ApiError } from '@/lib/server/config';
import { authenticated } from '@/lib/server/session';
import { db, check } from '@/lib/server/db';
import { googleFetch, readMessage } from '@/lib/server/google';
export async function POST(req: Request) {
  try {
    sameOrigin(req); const s = await authenticated(); const store = db();
    const recent = await store.from('quest_plans').select('id').eq('user_id', s.userId!).gte('created_at', new Date(Date.now()-60_000).toISOString()).limit(1);
    check(recent.error); if (recent.data?.length) throw new ApiError(429, 'Wait a minute before scanning again.');
    const result = await googleFetch(`messages?${new URLSearchParams({ q: 'in:inbox category:promotions older_than:30d -is:starred -is:important', maxResults: '12' })}`);
    const messages = await Promise.all((result.messages || []).map((m: {id: string})=>readMessage(m.id)));
    const plan = { id: randomUUID(), messages, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now()+15*60_000).toISOString() };
    const insert = await store.from('quest_plans').insert({ id: plan.id, user_id: s.userId, messages, expires_at: plan.expiresAt }); check(insert.error);
    return Response.json(plan);
  } catch (e) { return apiError(e); }
}
