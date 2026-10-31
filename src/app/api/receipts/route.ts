import { authenticated } from '@/lib/server/session';
import { apiError } from '@/lib/server/config';
import { db, check } from '@/lib/server/db';
import { receiptView } from '@/lib/server/execution';
export async function GET() {
  try { const s = await authenticated(); const r = await db().from('quest_receipts').select('*').eq('user_id',s.userId!).order('created_at',{ascending:false}).limit(100); check(r.error); return Response.json(r.data!.map(receiptView)); } catch(e) { return apiError(e); }
}
