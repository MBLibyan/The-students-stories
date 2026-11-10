export const DEFAULT_USERNAME_DOMAIN = 'storybook.local';

export function getAdminUsernameDomain() {
  const configured = import.meta.env.VITE_ADMIN_USERNAME_DOMAIN?.trim().toLowerCase() || '';
  if (!configured) return DEFAULT_USERNAME_DOMAIN;
  return configured.replace(/^@+/, '');
}

/**
 * Converts a plain admin/teacher username (e.g. "admin") into the internal
 * email identity expected by Supabase Auth ("admin@storybook.local"), while
 * still allowing a full email address if the user explicitly enters one.
 */
export function resolveAuthEmail(identifier, domainOverride) {
  const raw = String(identifier || '').trim().toLowerCase();
  if (!raw) {
    return {
      valid: false,
      email: '',
      isUsername: true,
      error: 'Please enter your username.',
    };
  }

  if (/\s/.test(raw)) {
    return {
      valid: false,
      email: '',
      isUsername: !raw.includes('@'),
      error: 'Username cannot contain spaces. Use English letters, numbers, dots, underscores, or hyphens.',
    };
  }

  if (raw.includes('@')) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    if (!emailValid) {
      return {
        valid: false,
        email: '',
        isUsername: false,
        error: 'Please enter a valid username or email address.',
      };
    }
    return {
      valid: true,
      email: raw,
      isUsername: false,
      error: null,
    };
  }

  const validUsername =
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(raw) && !raw.includes('..');
  if (!validUsername) {
    return {
      valid: false,
      email: '',
      isUsername: true,
      error:
        'Username may only contain English letters, numbers, dots, underscores, or hyphens.',
    };
  }

  const domain = (domainOverride || getAdminUsernameDomain()).replace(/^@+/, '');
  return {
    valid: true,
    email: `${raw}@${domain}`,
    isUsername: true,
    error: null,
  };
}

export function formatUserDisplayName(user, domainOverride) {
  if (!user) return '';
  if (user.user_metadata?.username) {
    return String(user.user_metadata.username);
  }
  const email = String(user.email || '').trim();
  if (!email) return '';
  const domain = (domainOverride || getAdminUsernameDomain()).replace(/^@+/, '').toLowerCase();
  const suffix = `@${domain}`;
  if (email.toLowerCase().endsWith(suffix)) {
    return email.slice(0, email.length - suffix.length);
  }
  return email;
}
