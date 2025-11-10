import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- Simple in-memory LRU-ish cache (small) ---
function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}
// Response typing
interface NextStep { step: string; why?: string; impact?: 'high'|'medium'|'low'; confidence?: number }
interface MissingCritical { text: string; reason?: string; risk?: 'critical'|'high'|'medium'|'low' }
interface SuggestionItem { text: string; solution?: string; impact?: 'high'|'medium'|'low' }
interface SuggestionCategory { name: string; items: SuggestionItem[] }
interface ProgressCategory { name: string; percent: number }
interface ProgressSummary { overallPercent: number; completed: number; total: number; notableGaps?: string[]; categories?: ProgressCategory[] }
interface ResponseData { version?: string; progressSummary?: ProgressSummary; nextSteps: NextStep[]; missingCritical: MissingCritical[]; suggestions: SuggestionCategory[]; cached?: boolean }

type CacheEntry = { value: ResponseData; ts: number };
const RESPONSE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes
const CACHE_MAX = 40;

function getCache(key: string) {
  const entry = RESPONSE_CACHE.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    RESPONSE_CACHE.delete(key);
    return undefined;
  }
  return entry.value;
}
function setCache(key: string, value: ResponseData) {
  if (RESPONSE_CACHE.size >= CACHE_MAX) {
    // delete oldest
    let oldestKey: string | undefined;
    let oldestTs = Infinity;
    for (const [k, v] of RESPONSE_CACHE.entries()) {
      if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
    }
    if (oldestKey) RESPONSE_CACHE.delete(oldestKey);
  }
  RESPONSE_CACHE.set(key, { value, ts: Date.now() });
}

// --- Very basic per-IP rate limiter (burst) ---
const RATE_BUCKET = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 15; // 15 calls / min / ip

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKET.get(ip);
  if (!bucket) {
    RATE_BUCKET.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (now - bucket.windowStart > RATE_WINDOW_MS) {
    bucket.count = 1;
    bucket.windowStart = now;
    return true;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX) return false;
  return true;
}

// --- Zod Schemas ---
const SuggestionItemSchema = z.object({
  text: z.string().min(2).max(400),
  solution: z.string().min(2).max(500).optional(),
  impact: z.enum(['high','medium','low']).optional(),
});
const SuggestionCategorySchema = z.object({
  category: z.string().optional(),
  name: z.string().optional(), // some models may return name vs category
  items: z.array(SuggestionItemSchema).default([]),
});
const NextStepSchema = z.object({
  step: z.string().min(2).max(300),
  why: z.string().min(2).max(500).optional(),
  impact: z.enum(['high','medium','low']).optional(),
  confidence: z.number().min(0).max(100).optional(),
});
const MissingCriticalSchema = z.object({
  text: z.string().min(2).max(300),
  reason: z.string().min(2).max(500).optional(),
  risk: z.enum(['critical','high','medium','low']).optional(),
});
const ProgressCategorySchema = z.object({
  name: z.string(),
  percent: z.number().min(0).max(100),
});
const ProgressSummarySchema = z.object({
  overallPercent: z.number().min(0).max(100),
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  notableGaps: z.array(z.string()).optional().default([]),
  categories: z.array(ProgressCategorySchema).optional().default([]),
});
const ResponseSchema = z.object({
  version: z.string().optional(),
  progressSummary: ProgressSummarySchema.optional(),
  nextSteps: z.array(NextStepSchema).optional().default([]),
  missingCritical: z.array(MissingCriticalSchema).optional().default([]),
  suggestions: z.array(z.union([SuggestionCategorySchema, z.object({ name: z.string(), items: z.array(SuggestionItemSchema) })])).optional().default([]),
});

interface CategoryInput { name: string; items: Array<{ text: string; checked?: boolean; tooltip?: string; note?: string }> }

function buildCacheKey(scope: string, categories?: CategoryInput[], temperature?: number, maxSteps?: number) {
  const base = JSON.stringify({ scope, categories, temperature, maxSteps });
  return base.length > 10_000 ? base.slice(0, 10_000) : base; // limit key size
}

function heuristicNextSteps(categories?: CategoryInput[], limit = 5): NextStep[] {
  if (!categories) return [];
  const remaining: string[] = [];
  for (const c of categories) {
    for (const it of c.items) {
      if (!it.checked) remaining.push(it.text);
    }
  }
  return remaining.slice(0, limit).map(r => ({ step: r, why: 'Uncovered checklist item', impact: 'medium', confidence: 50 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scope, categories, options } = body as {
      scope: string;
      categories?: CategoryInput[];
      options?: { temperature?: number; maxSteps?: number };
    };

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    if (!rateLimit(ip)) {
      return Response.json({ success: false, message: 'Rate limit exceeded. Try again shortly.' }, { status: 429 });
    }

    const temperature = typeof options?.temperature === 'number' ? Math.min(Math.max(options.temperature, 0), 1) : 0.35;
    const maxSteps = Math.min(Math.max(options?.maxSteps ?? 7, 1), 10);

    let total = 0;
    let done = 0;
    const perCategory: Array<{ name: string; total: number; done: number; percent: number; remaining: string[] }> = [];
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        const t = cat.items.length;
        const d = cat.items.filter(i => i.checked).length;
        total += t; done += d;
        const remaining = cat.items.filter(i => !i.checked).slice(0, 8).map(i => i.text);
        perCategory.push({ name: cat.name, total: t, done: d, percent: t ? Math.round((d / t) * 100) : 0, remaining });
      }
    }
    const overallPercent = total ? Math.round((done / total) * 100) : 0;
    const progressDescriptor = perCategory.map(c => `${c.name}:${c.done}/${c.total}(${c.percent}%)`).join('; ');

    const cacheKey = buildCacheKey(scope, categories, temperature, maxSteps);
    const cached = getCache(cacheKey);
    if (cached) {
      return Response.json({ success: true, data: { ...cached, cached: true } }, { status: 200 });
    }

  const prompt = `You are an elite application security / bug bounty assistant.
INSTRUCTIONS: Return ONLY JSON. Do not include markdown or commentary. You may think internally but output must be valid JSON.
Scope: ${scope}
Progress: overall ${overallPercent}% (${done}/${total}). Categories: ${progressDescriptor || 'none'}.
REQUIREMENTS:
1. Generate adaptive guidance based ONLY on not-completed checklist items.
2. Choose nextSteps strictly from remaining coverage gaps. No invented or already-completed tasks.
3. Order nextSteps by: (a) highest risk / impact exposure, (b) missing prerequisites blocking deeper tests, (c) efficiency / unlock potential.
4. If remaining unchecked items are fewer than ${maxSteps}, cap nextSteps to that reduced count. Absolutely NO filler.
5. If everything is complete (0 remaining), nextSteps must be an empty array and suggestions should focus on advanced validation / hardening / post-exploitation review.
6. Provide JSON only using this exact structure:
{
  "version": "v2",
  "progressSummary": {"overallPercent": number, "completed": number, "total": number, "notableGaps": [string], "categories": [{"name": string, "percent": number}]},
  "nextSteps": [{"step": string, "why": string, "impact": "high"|"medium"|"low", "confidence": number}],
  "missingCritical": [{"text": string, "reason": string, "risk": "critical"|"high"|"medium"|"low"}],
  "suggestions": [{"category": string, "items": [{"text": string, "solution": string, "impact": "high"|"medium"|"low"}]}]
}
STRATEGY TIERS:
- <30%: focus enumeration, auth surface mapping, input validation baselines.
- 30-70%: logic flaws, privilege escalation, sensitive data exposure, misconfigurations.
- >70%: advanced (race conditions, supply chain chain-of-trust, side channels, post-exploitation validation).
CONSTRAINTS:
- nextSteps <= ${maxSteps}; missingCritical <= 6.
- Confidence is 0-100 integer; if uncertain use a lower number (40-60) rather than omitting.
- Each nextStep must have a distinct primary verb (e.g., "Enumerate", "Test", "Validate", "Probe").
- No duplicate sentences across any array.
- Do NOT output explanatory text outside JSON.
FAILSAFE: If context insufficient, return minimal valid JSON with empty arrays except suggestions offering high-level re-evaluation tasks.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature } });
    const text = result.response.text();

    // Extract JSON block
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    const jsonSlice = (start >= 0 && end > start) ? text.slice(start, end) : '{}';

  let rawParsed: unknown = {};
  try { rawParsed = JSON.parse(jsonSlice); } catch { rawParsed = {}; }

    // Normalize & validate
  let validated = ResponseSchema.safeParse(rawParsed);
    if (!validated.success) {
      // Attempt basic shape adaptation
      const fallbackShape = {
        version: 'v2',
        progressSummary: total ? { overallPercent, completed: done, total, notableGaps: [], categories: perCategory.map(c => ({ name: c.name, percent: c.percent })) } : undefined,
        nextSteps: heuristicNextSteps(categories, Math.min(maxSteps, 5)),
        missingCritical: [],
        suggestions: [],
      };
      validated = ResponseSchema.safeParse(fallbackShape);
    }
  const dataOut: ResponseData = validated.success
    ? (validated.data as ResponseData)
    : { version: 'v2', nextSteps: heuristicNextSteps(categories), missingCritical: [], suggestions: [] };

  // Ensure optional arrays exist for uniform processing
  if (!Array.isArray(dataOut.nextSteps)) dataOut.nextSteps = [];
  if (!Array.isArray(dataOut.missingCritical)) dataOut.missingCritical = [];
  if (!Array.isArray(dataOut.suggestions)) dataOut.suggestions = [];

    // Post normalization adjustments
    // Cap lengths explicitly
    dataOut.nextSteps = (dataOut.nextSteps || []).slice(0, maxSteps);
    dataOut.missingCritical = (dataOut.missingCritical || []).slice(0, 6);

    // Deduplicate nextSteps by step text
    const seenSteps = new Set<string>();
  dataOut.nextSteps = dataOut.nextSteps.filter((ns: NextStep) => {
      if (!ns.step) return false;
      const k = ns.step.toLowerCase();
      if (seenSteps.has(k)) return false;
      seenSteps.add(k);
      if (typeof ns.confidence !== 'number' || Number.isNaN(ns.confidence)) ns.confidence = 55;
      else ns.confidence = Math.max(0, Math.min(100, Math.round(ns.confidence)));
      if (ns.impact && !['high','medium','low'].includes(ns.impact)) delete ns.impact;
      return true;
    });

    // Ensure suggestions categories normalized (name field)
    if (Array.isArray(dataOut.suggestions)) {
      const normalized: SuggestionCategory[] = (dataOut.suggestions as unknown as unknown[]).map((c): SuggestionCategory => {
        let name = 'General';
        let items: SuggestionItem[] = [];
        if (isRecord(c)) {
          const n = c['name'];
          const cat = c['category'];
          if (typeof n === 'string' && n.trim()) name = n;
          else if (typeof cat === 'string' && cat.trim()) name = cat;
          const rawItems = Array.isArray(c['items']) ? (c['items'] as unknown[]) : [];
          items = rawItems.slice(0, 10).map((it): SuggestionItem => {
            if (isRecord(it)) {
              const t = typeof it['text'] === 'string' ? (it['text'] as string) : '';
              const sol = typeof it['solution'] === 'string' ? (it['solution'] as string) : undefined;
              const impRaw = it['impact'];
              const imp = impRaw === 'high' || impRaw === 'medium' || impRaw === 'low' ? (impRaw as 'high'|'medium'|'low') : undefined;
              return { text: t.slice(0, 400), solution: sol ? sol.slice(0, 500) : undefined, impact: imp };
            }
            return { text: '' };
          });
        }
        return { name, items };
      });
      dataOut.suggestions = normalized;
    }

  setCache(cacheKey, dataOut);
    return Response.json({ success: true, data: dataOut }, { status: 200 });
  } catch (error) {
    console.error('Gemini AI Suggestion Error:', error);
    return Response.json({ success: false, message: 'Failed to get AI suggestions' }, { status: 500 });
  }
}