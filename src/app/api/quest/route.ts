import {readJson} from '@/lib/http';
import { z } from 'zod';
import { fallbackStory } from '@/lib/story';
import { sameOrigin, apiError, ApiError } from '@/lib/server/config';
import { authenticated } from '@/lib/server/session';
import { db, check } from '@/lib/server/db';
import { generateQuest } from '@/lib/quest-engine';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = z.object({ module:z.enum(['inbox','files']), count:z.number().int().min(0).max(250), demo:z.boolean() }).safeParse(await readJson(req));
    if (!input.success) throw new ApiError(400,'Invalid quest request.');
    const { module, count, demo } = input.data;
    const fallback = fallbackStory(module,count);
    if (demo || !process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return Response.json(fallback);
    const s = await authenticated();
    // Durable per-user budget; no model tools and no content sent to the model.
    const budget = await db().rpc('claim_quest_generation',{ owner_id:s.userId! }); check(budget.error);
    if (!budget.data) return Response.json(fallback);
    return Response.json(await generateQuest(module,count,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL}));
  } catch(e) { return apiError(e); }
}
