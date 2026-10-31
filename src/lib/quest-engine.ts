import { z } from 'zod';
import { fallbackStory } from './story';
import type { Module, QuestStory } from './types';
export const questSchema=z.object({title:z.string().min(3).max(80),briefing:z.string().min(15).max(600),victory:z.string().min(5).max(200)}).strict();
type Options={key?:string;model?:string;fetcher?:typeof fetch;pause?:(ms:number)=>Promise<void>;timeoutMs?:number};
/** Narrative only. It receives anonymous counts and has no execution tools or operation IDs. */
export async function generateQuest(module:Module,count:number,options:Options):Promise<QuestStory> {
 const fallback=fallbackStory(module,count);
 if(!options.key||!options.model)return fallback;
 const fetcher=options.fetcher||fetch;
 const pause=options.pause||(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
 for(let attempt=0;attempt<2;attempt++) {
  try {
   const r=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':options.key},body:JSON.stringify({systemInstruction:{parts:[{text:'Write concise playable quest flavor text. This is a proposal, not an execution result. Never state that chores are completed or verified. No tools, commands, links, task IDs or action instructions. Match the supplied anonymous module and count.'}]},contents:[{role:'user',parts:[{text:JSON.stringify({module,count})}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:z.toJSONSchema(questSchema),maxOutputTokens:800,temperature:0.6}}),signal:AbortSignal.timeout(options.timeoutMs||8000)});
   if(!r.ok){if(attempt===0&&(r.status===429||r.status>=500)){await pause(250);continue;}return fallback;}
   const data=await r.json();const candidate=data.candidates?.[0];
   if(candidate?.finishReason&&candidate.finishReason!=='STOP')return fallback;
   const text=(candidate?.content?.parts||[]).filter((p:{thought?:boolean;text?:string})=>!p.thought).map((p:{text?:string})=>p.text||'').join('');
   const validated=questSchema.safeParse(JSON.parse(text));
   if(validated.success)return{...validated.data,source:'gemini'};
  }catch{/* Malformed output, abort, and network errors get one bounded retry. */}
  if(attempt===0)await pause(250);
 }
 return fallback;
}
