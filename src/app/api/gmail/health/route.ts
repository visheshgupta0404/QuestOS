import {authenticated} from '@/lib/server/session';
import {apiError,sameOrigin} from '@/lib/server/config';
import {googleFetch} from '@/lib/server/google';
/** Refresh credentials and read profile only. Never modifies Gmail messages or labels. */
export async function POST(req:Request){
 try {
  sameOrigin(req);await authenticated();const profile=await googleFetch('profile',undefined,true);
  return Response.json({verified:true,email:profile.emailAddress,message:'Google token refresh and Gmail profile retrieval succeeded. No messages were changed.'});
 }catch(e){return apiError(e);}
}
