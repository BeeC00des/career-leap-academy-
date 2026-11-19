import dns from 'node:dns/promises';

// Practical address syntax (not full RFC 5322): ASCII local part, dotted domain, 2+ letter TLD.
const SYNTAX_RE = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

// Domains reserved for documentation/testing that can never receive mail (RFC 2606 / 6761).
const RESERVED = /(^|\.)(example\.(com|net|org)|test|invalid|localhost|local)$/;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmailSyntax(email) {
  return email.length <= 254 && SYNTAX_RE.test(email) && !email.includes('..');
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms))]);
}

/**
 * Can this domain receive email? Checks MX records, falling back to A/AAAA (RFC 5321 implicit MX).
 * Fails open on DNS outages/timeouts so a resolver hiccup never blocks a real sign-up.
 */
export async function domainAcceptsMail(domain) {
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 4000);
    // RFC 7505 "null MX" (exchange "" or ".") means the domain explicitly accepts no mail.
    return mx.some((r) => r.exchange && r.exchange !== '.');
  } catch (err) {
    if (err.code === 'ENOTFOUND') return false; // domain doesn't exist
    if (err.code === 'ENODATA') {
      try {
        await withTimeout(dns.lookup(domain), 4000);
        return true;
      } catch (e) {
        return e.code === 'ETIMEOUT';
      }
    }
    return true; // SERVFAIL / timeout / network error → don't punish the user
  }
}

/** Returns an error message, or null when the address is acceptable for sign-up. */
export async function checkSignupEmail(email) {
  if (!isValidEmailSyntax(email)) return 'Enter a valid email address, like name@gmail.com';
  const domain = email.split('@')[1];
  if (RESERVED.test(domain) || !(await domainAcceptsMail(domain))) {
    return `"${domain}" can't receive email. Check the spelling or use another address.`;
  }
  return null;
}
