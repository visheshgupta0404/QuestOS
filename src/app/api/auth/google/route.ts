import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appUrl, missingConfig } from '@/lib/server/config';
import { session } from '@/lib/server/session';
export async function GET() {
  if (missingConfig().length) return NextResponse.redirect(`${appUrl()}/dashboard?auth=setup-required`);
  const s = await session();
  s.state = randomBytes(32).toString('base64url');
  s.verifier = randomBytes(48).toString('base64url'); s.stateCreatedAt = Date.now();
  await s.save();
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: `${appUrl()}/api/auth/callback/google`, response_type: 'code', scope: 'openid email https://www.googleapis.com/auth/gmail.modify', access_type: 'offline', prompt: 'consent', state: s.state, code_challenge: createHash('sha256').update(s.verifier).digest('base64url'), code_challenge_method: 'S256' });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
