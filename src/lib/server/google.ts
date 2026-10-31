import 'server-only';
import { authenticated } from './session';
import { ApiError } from './config';
import type { Message } from '../types';
export async function googleFetch(path: string, init?: RequestInit, forceRefresh = false) {
  const s = await authenticated();
  if (forceRefresh || !s.accessToken || (s.expiresAt || 0) < Date.now() + 60_000) {
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: s.refreshToken!, grant_type: 'refresh_token' }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new ApiError(401, 'Google access expired or was revoked. Disconnect and reconnect Gmail.');
    const token = await response.json();
    s.accessToken = token.access_token; s.expiresAt = Date.now() + token.expires_in * 1000;
    await s.save();
  }
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${s.accessToken}`, 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new ApiError(response.status === 401 ? 401 : 502, 'Gmail could not complete the request. Refresh or reconnect and check the receipt before retrying.');
  return response.status === 204 ? {} : response.json();
}
export async function readMessage(id: string): Promise<Message> {
  const m = await googleFetch(`messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
  const header = (name: string) => m.payload?.headers?.find((h: {name: string; value: string})=>h.name.toLowerCase() === name.toLowerCase())?.value || '';
  return { id: m.id, subject: header('Subject') || '(No subject)', from: header('From'), date: new Date(Number(m.internalDate)).toISOString(), labels: m.labelIds || [] };
}
export async function cleanupLabel(): Promise<string> {
  const { labels } = await googleFetch('labels');
  const existing = labels?.find((l: {name: string; id: string})=>l.name === 'QuestOS/Cleared');
  if (existing) return existing.id;
  const label = await googleFetch('labels', { method: 'POST', body: JSON.stringify({ name: 'QuestOS/Cleared', labelListVisibility: 'labelShow', messageListVisibility: 'show' }) });
  return label.id;
}
