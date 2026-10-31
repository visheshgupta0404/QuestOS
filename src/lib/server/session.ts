import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession, type IronSession } from 'iron-session';
import { ApiError, missingConfig } from './config';

/** Session payload stored securely in an encrypted iron-session cookie. */
export type Session = {
  userId?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  state?: string;
  verifier?: string;
  stateCreatedAt?: number;
};

/**
 * Retrieves the current encrypted iron-session instance.
 */
export async function session(): Promise<IronSession<Session>> {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) throw new ApiError(503, 'Authentication is not configured. Demo mode is available.');
  return getIronSession<Session>(await cookies(), { password, cookieName: 'questos_session', ttl: 60 * 60 * 24 * 7, cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' } });
}

/**
 * Validates that the request has an active, authenticated Gmail session.
 * Throws ApiError(401) if not connected or ApiError(503) if setup is incomplete.
 */
export async function authenticated(): Promise<IronSession<Session>> {
  if (missingConfig().length) throw new ApiError(503, 'Live Gmail requires configuration, verified project access, and a rotated secret.');
  const s = await session();
  if (!s.userId || !s.refreshToken) throw new ApiError(401, 'Connect Gmail to continue.');
  return s;
}
