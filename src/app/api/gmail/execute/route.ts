import {readJson} from '@/lib/http';
import { z } from 'zod';
import { apiError, sameOrigin, ApiError } from '@/lib/server/config';
import { authenticated } from '@/lib/server/session';
import { executePlan } from '@/lib/server/execution';
const schema = z.object({ planId:z.uuid(), approved:z.literal(true), decisions:z.array(z.object({ id:z.string().min(1).max(200), action:z.enum(['archive','label','keep']) })).max(12) });
export async function POST(req: Request) {
  try { sameOrigin(req); const s = await authenticated(); const body = schema.safeParse(await readJson(req)); if (!body.success) throw new ApiError(400,'Review and approve a valid cleanup plan.'); return Response.json(await executePlan(s.userId!,body.data.planId,body.data.decisions)); } catch(e) { return apiError(e); }
}
