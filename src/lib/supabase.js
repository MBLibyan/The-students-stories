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
  if (!error) return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  const message = String(error.message || error.error_description || error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (message.includes('email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً أو تفعيل الحساب من لوحة Supabase.';
  }
  if (message.includes('user already registered')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً.';
  }
  if (message.includes('password should be at least')) {
    return 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'ليس لديك صلاحية تنفيذ هذا الإجراء. تأكد من تسجيل الدخول بحساب المالك الصحيح وتطبيق سياسات الأمان في Supabase.';
  }
  if (message.includes('payload too large') || message.includes('exceeded the maximum allowed size')) {
    return 'حجم الملف أكبر من الحد المسموح به في التخزين (الحد الأقصى 50 ميجابايت).';
  }
  if (message.includes('bucket not found')) {
    return 'حاويات التخزين (Buckets) غير موجودة في Supabase. تأكد من تشغيل ملف SQL في محرر الاستعلامات.';
  }
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'جداول قاعدة البيانات غير موجودة بعد. يرجى تشغيل ملف الهجرة SQL داخل Supabase.';
  }
  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    return 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ومن صحة رابط Supabase.';
  }
  if (message.includes('jwt expired')) {
    return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.';
  }

  return error.message || 'حدث خطأ أثناء تنفيذ العملية.';
}
