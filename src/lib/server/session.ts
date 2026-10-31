import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ApiError, missingConfig } from './config';
export type Session = { userId?: string; email?: string; accessToken?: string; refreshToken?: string; expiresAt?: number; state?: string; verifier?: string; stateCreatedAt?: number };
export async function session() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) throw new ApiError(503, 'Authentication is not configured. Demo mode is available.');
  return getIronSession<Session>(await cookies(), { password, cookieName: 'questos_session', ttl: 60 * 60 * 24 * 7, cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' } });
}
export async function authenticated() {
  if (missingConfig().length) throw new ApiError(503, 'Live Gmail requires configuration, verified project access, and a rotated secret.');
  const s = await session();
  if (!s.userId || !s.refreshToken) throw new ApiError(401, 'Connect Gmail to continue.');
  return s;
}
