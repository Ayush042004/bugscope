This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Security Hardening (Applied)

The application includes several baseline security measures beyond the default Next.js setup:

### Headers (via `middleware.ts`)
- **Content-Security-Policy**: Restricts sources to `'self'` plus explicit allowances for images, fonts, Gemini API.
- **X-Frame-Options: DENY**: Prevents clickjacking via iframing.
- **X-Content-Type-Options: nosniff**: Blocks MIME sniffing.
- **Referrer-Policy: strict-origin-when-cross-origin**: Reduces referrer leakage.
- **Permissions-Policy**: Disables camera / mic / geolocation.
- **X-XSS-Protection: 0**: Ensures modern CSP-driven XSS strategy (legacy header disabled intentionally).
- **HSTS** (commented placeholder) ready for production HTTPS enforcement.

### Rate Limiting
Reusable in‑memory per‑IP sliding window limiter (`src/lib/rateLimit.ts`) applied to AI suggestion endpoint to reduce abuse.

### AI Endpoint Hardening (`/api/suggest`)
- Body size limit (~50 KB) + explicit JSON parse guard.
- Category / scope length + count validation to prevent oversized / malicious payloads.
- Zod schema validation + fallback logic to avoid malformed responses from the model.
- Caching + rate limiting for cost control and resilience.

### Removed Surface
- Disabled `x-powered-by` header (`next.config.ts`).

## Recommended Next Steps (Future Hardening)
| Priority | Recommendation | Notes |
|----------|----------------|-------|
| High | Implement authz checks on all future API endpoints | Ensure only owner accesses checklist data |
| High | Add Helmet-style header review in integration tests | Snapshot expected security headers |
| High | Persist rate limit metrics (Redis) | Current memory map resets on deploy |
| Medium | Add CSRF protection for state-changing POST/PATCH (if non-API token flows added) | Use SameSite=strict + double submit token |
| Medium | Introduce input sanitation validation layer | Zod already covers structure; extend to patterns |
| Medium | Add audit logging for admin-like actions | Store in append-only collection |
| Medium | Implement dependency scanning (npm audit / osv) CI step | Fails pipeline on critical severity |
| Low | Subresource Integrity (SRI) if CDN scripts introduced | Only if external scripts added |
| Low | Security.txt endpoint & well-known metadata | For disclosure policy |

### Threat Modeling Quick Notes
- Primary abuse vector now would be automated hitting of AI endpoint → mitigated with rate limit & size guard.
- Checklist manipulation risk limited by authentication middleware (ensure session enforcement stays intact on future routes).
- CSP can be tightened (remove `'unsafe-inline'`) after migrating any inline styles / scripts.

### How to Tighten CSP Further
1. Eliminate inline `<style>` or `dangerouslySetInnerHTML` usage.
2. Add a nonce or hash-based CSP for any dynamic scripts.
3. Remove `'unsafe-eval'` once dev tooling (e.g., source maps) no longer requires it in production.

### Monitoring Ideas
- Add `/api/health` with header echo to verify security headers in uptime checks.
- Periodic job to diff dependency list + alert on new critical CVEs.

---

