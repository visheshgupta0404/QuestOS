import {readJson} from '@/lib/http';
import {z} from 'zod';
import {authenticated} from '@/lib/server/session';
import {apiError,ApiError,sameOrigin} from '@/lib/server/config';
import {db,check} from '@/lib/server/db';
export async function POST(req:Request){
 try {
  sameOrigin(req);const s=await authenticated();
  const input=z.object({planId:z.uuid(),approved:z.literal(true)}).safeParse(await readJson(req));
  if(!input.success)throw new ApiError(400,'Explicit quest approval is required.');
  const result=await db().from('quest_plans').update({play_approved:true}).eq('id',input.data.planId).eq('user_id',s.userId!).eq('claimed',false).gte('expires_at',new Date().toISOString()).select('id');check(result.error);
  if(!result.data?.length)throw new ApiError(409,'Quest is expired, already executing, or unavailable. Scan again.');
  return Response.json({approved:true});
 }catch(e){return apiError(e);}
}
