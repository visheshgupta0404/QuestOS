import 'server-only';
export function missingConfig() {
  const required = ['APP_URL','SESSION_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET',...(process.env.QUESTOS_STORAGE === 'local' && !process.env.VERCEL ? [] : ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'])];
  const missing = required.filter(k=>!process.env[k]);
  if ((process.env.SESSION_SECRET?.length || 0) < 32 && !missing.includes('SESSION_SECRET')) missing.push('SESSION_SECRET (minimum 32 characters)');
  if (process.env.GOOGLE_PROJECT_VERIFIED !== 'true') missing.push('GOOGLE_PROJECT_VERIFIED');
  if (process.env.GOOGLE_SECRET_ROTATED !== 'true') missing.push('GOOGLE_SECRET_ROTATED');
  return missing;
}
export function appUrl() {
  const value = process.env.APP_URL || 'http://localhost:3000';
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(['localhost','127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) throw new Error('APP_URL must use HTTPS outside localhost.');
  return url.origin;
}
export function sameOrigin(req: Request) {
  if (req.headers.get('origin') !== appUrl()) throw new ApiError(403, 'Request origin is not allowed.');
}
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function apiError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  // Provider errors may include private data; never echo them or log tokens.
  console.error('QuestOS request failed:', error instanceof Error ? error.name : 'UnknownError');
  return Response.json({ error: 'The service could not complete this request. Check your connection and configuration, then retry. No success was assumed.' }, { status: 502 });
}
