import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appUrl, missingConfig } from '@/lib/server/config';
import { session } from '@/lib/server/session';
export async function GET(req: Request) {
  if (missingConfig().length) return NextResponse.redirect(`${appUrl()}/?auth=setup-required`);
  const s = await session();
  const params = new URL(req.url).searchParams;
  const state = params.get('state') || '';
  const valid = s.state && state.length === s.state.length && timingSafeEqual(Buffer.from(state), Buffer.from(s.state)) && s.stateCreatedAt && Date.now() - s.stateCreatedAt < 600_000;
  const verifier = s.verifier;
  delete s.state; delete s.verifier; delete s.stateCreatedAt; await s.save();
  if (!valid || !verifier || !params.get('code') || params.get('error')) return NextResponse.redirect(`${appUrl()}/?auth=denied`);
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code: params.get('code')!, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${appUrl()}/api/auth/callback/google`, grant_type: 'authorization_code', code_verifier: verifier }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Token exchange failed');
    const token = await response.json();
    if (!token.refresh_token || !token.scope?.split(' ').includes('https://www.googleapis.com/auth/gmail.modify')) throw new Error('Required access not granted');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(15000) });
    if (!profileResponse.ok) throw new Error('Profile verification failed');
    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email_verified) throw new Error('Unverified account');
    s.userId = profile.sub; s.email = profile.email; s.accessToken = token.access_token; s.refreshToken = token.refresh_token; s.expiresAt = Date.now() + token.expires_in * 1000;
    await s.save();
    return NextResponse.redirect(`${appUrl()}/?auth=connected`);
  } catch { return NextResponse.redirect(`${appUrl()}/?auth=failed`); }
}
