import { missingConfig } from '@/lib/server/config';
import { session } from '@/lib/server/session';
export async function GET() {
  const missing = missingConfig();
  let email: string | undefined;
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) email = (await session()).email;
  const local = process.env.QUESTOS_STORAGE === 'local' && !process.env.VERCEL;
  return Response.json({ configured: !missing.length, connected: !!email && !missing.length, email, missing, storageProvider: local ? 'local' : 'supabase', storage: local || (!!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY), ai: !!process.env.GEMINI_API_KEY && !!process.env.GEMINI_MODEL });
}
