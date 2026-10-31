import { z } from 'zod';
import { authenticated } from '@/lib/server/session';
import { apiError, sameOrigin, ApiError } from '@/lib/server/config';
import { undoReceipt } from '@/lib/server/execution';
export async function POST(req: Request) {
  try { sameOrigin(req); const s = await authenticated(); const body = z.object({id:z.uuid()}).safeParse(await req.json()); if (!body.success) throw new ApiError(400,'Invalid receipt.'); return Response.json(await undoReceipt(s.userId!,body.data.id)); } catch(e) { return apiError(e); }
}
