export const getAllowedEmailDomains = (): string[] => {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (raw && raw.trim() !== '') {
    return raw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }
  // Default popular domains; override via ALLOWED_EMAIL_DOMAINS
  return [
    'google.com',
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'proton.me',
  ];
};

export const emailDomain = (email: string): string => {
  const at = email.lastIndexOf('@');
  if (at === -1) return '';
  return email.slice(at + 1).toLowerCase();
};

const tokenToRegex = (token: string): RegExp | null => {
  // Support simple wildcards like *.edu or yahoo.*
  if (!token.includes('*')) return null;
  const escaped = token
    .toLowerCase()
    .replace(/[.+?^${}()|\[\]\\]/g, '\\$&') // escape regex specials
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
};

export const isAllowedEmail = (email: string): boolean => {
  const domain = emailDomain(email);
  if (!domain) return false;
  const list = getAllowedEmailDomains();
  // Exact match first
  if (list.includes(domain)) return true;
  // Wildcard patterns
  for (const tok of list) {
    if (tok.includes('*')) {
      const re = tokenToRegex(tok);
      if (re && re.test(domain)) return true;
    }
  }
  return false;
};
