import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-supabase-anon')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function translateSupabaseError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const message = String(error.message || error.error_description || error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Incorrect username or password.';
  }
  if (message.includes('email not confirmed')) {
    return 'This account is not confirmed yet. Enable Auto Confirm User in Supabase Authentication -> Users.';
  }
  if (message.includes('user already registered')) {
    return 'This account is already registered.';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Permission denied. Make sure you are signed in as the book owner and RLS policies are applied in Supabase.';
  }
  if (message.includes('payload too large') || message.includes('exceeded the maximum allowed size')) {
    return 'The uploaded file exceeds the maximum allowed size (50 MB).';
  }
  if (message.includes('bucket not found')) {
    return 'Storage buckets were not found in Supabase. Please run the SQL migration first.';
  }
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Database tables do not exist yet. Please run the SQL migration inside Supabase.';
  }
  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    return 'Could not connect to the server. Please check your internet connection and Supabase URL.';
  }
  if (message.includes('jwt expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  return error.message || 'An error occurred while completing the request.';
}
