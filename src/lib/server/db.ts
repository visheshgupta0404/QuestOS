import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from './config';
import { LocalStore } from './local-store';

let local: LocalStore | undefined;

/**
 * Returns a database client configured for either local SQLite storage or Supabase.
 */
export function db() {
  if (process.env.QUESTOS_STORAGE === 'local' && !process.env.VERCEL) {
    local ||= new LocalStore();
    return local as unknown as ReturnType<typeof createClient>;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new ApiError(503, 'Supabase is not configured.');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Validates database query execution and raises a descriptive 503 error on failure.
 */
export function check(error: unknown): void {
  if (error) throw new ApiError(503, 'Receipt storage is unavailable. Check database configuration and migrations.');
}
