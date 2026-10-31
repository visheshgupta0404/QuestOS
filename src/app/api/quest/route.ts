import { z } from 'zod';
import { fallbackStory } from '@/lib/story';
import { sameOrigin, apiError, ApiError } from '@/lib/server/config';
import { authenticated } from '@/lib/server/session';
import { db, check } from '@/lib/server/db';
const output = z.object({ title:z.string().min(3).max(80), briefing:z.string().min(15).max(600), victory:z.string().min(5).max(200) });
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = z.object({ module:z.enum(['inbox','files']), count:z.number().int().min(0).max(250), demo:z.boolean() }).safeParse(await req.json());
    if (!input.success) throw new ApiError(400,'Invalid quest request.');
    const { module, count, demo } = input.data;
    const fallback = fallbackStory(module,count);
    if (demo || !process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return Response.json(fallback);
    const s = await authenticated();
    // Durable per-user budget; no model tools and no content sent to the model.
    const budget = await db().rpc('claim_quest_generation',{ owner_id:s.userId! }); check(budget.error);
    if (!budget.data) return Response.json(fallback);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL)}:generateContent`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':process.env.GEMINI_API_KEY }, body:JSON.stringify({ systemInstruction:{parts:[{text:'Write playful, concise quest flavor text for a digital chores game. Never claim an action has occurred. No tools or instructions to execute actions. Reply with JSON containing title, briefing, victory strings.'}]}, contents:[{role:'user',parts:[{text:JSON.stringify({module,count})}]}], generationConfig:{responseMimeType:'application/json', maxOutputTokens:400, temperature:0.7} }), signal:AbortSignal.timeout(12000) });
      if (!r.ok) return Response.json(fallback);
      const data = await r.json(); const value = output.safeParse(JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'));
      return Response.json(value.success ? {...value.data,source:'gemini'} : fallback);
    } catch { return Response.json(fallback); }
  } catch(e) { return apiError(e); }
}
