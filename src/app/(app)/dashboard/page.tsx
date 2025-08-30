'use client';

import * as React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/types/ApiResponse';

import {
  Shield,
  Target,
  Bug,
  Lightbulb,
  FileText,
  LogOut,
  Settings,
  User as UserIcon,
  Search,
  Download,
  Sparkles,
  CheckCircle2,
  Circle,
  TrendingUp,
  Activity,
  Zap,
  Globe,
  Smartphone,
  Wifi,
  Cloud,
  Brain,
  Network,
  Database,
  Server,
} from 'lucide-react';

/* --------------------- ROUTE CONSTANTS (edit if needed) -------------------- */
const ROUTES = {
  CREATE_CHECKLIST: '/api/checklists/create', // POST { scope }
  GET_USER_CHECKLIST: (scope: string) => `/api/checklists/${encodeURIComponent(scope)}`,
  GET_TEMPLATE: (scope: string) => `/api/get-temp/${encodeURIComponent(scope)}`,
  PATCH_ITEM: '/api/checklists/update',       // PATCH { scope, categoryName, itemText, checked?, note? }
  AI_SUGGEST: '/api/suggest',                 // POST { scope, categories }
};

/* ------------------------------ TYPES (match DB) --------------------------- */
type ChecklistItem = {
  text: string;
  tooltip?: string | null;
  checked: boolean;
  note: string;
};

type ChecklistCategory = {
  name: string;
  items: ChecklistItem[];
};

type ChecklistDoc = {
  _id: string;
  userId: string;
  scope: string;
  categories: ChecklistCategory[];
};

const SCOPES = [
  { id: 'Web',  name: 'Web App' },
  { id: 'api',  name: 'API' },
  { id: 'iot',  name: 'IoT' },
  { id: 'aiml', name: 'AI/ML' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [selectedScope, setSelectedScope] = useState<string>('Web');
  const [checklist, setChecklist] = useState<ChecklistDoc | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ChecklistCategory[]>([]);
  const [search, setSearch] = useState('');

  /* ---------------------- LOAD OR CREATE CHECKLIST FLOW -------------------- */
  const loadChecklist = useCallback(async (scope: string) => {
    setLoadingChecklist(true);
    setChecklist(null);
    setAiSuggestions([]);

    try {
      const res = await axios.get(ROUTES.GET_USER_CHECKLIST(scope));
      if (res.status === 200) {
        setChecklist(res.data as ChecklistDoc);
        return;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const tempRes = await axios.get(ROUTES.GET_TEMPLATE(scope));
          const template = tempRes.data.template;

          if (!template) {
            toast.error(`No template available for ${scope}`);
            return;
          }

          const createRes = await axios.post(ROUTES.CREATE_CHECKLIST, {
            scope,
            categories: template.categories,
          });

        const { checklist: created } = createRes.data;
        setChecklist(created);
        toast.success(`Seeded ${scope} checklist for you.`);
      } catch (innerErr: any) {
        toast.error(innerErr.message ?? 'Failed to seed checklist');
      }
    } else {
      toast.error(err.message ?? 'Failed to load checklist');
    }
  } finally {
    setLoadingChecklist(false);
  }
}, []);

  useEffect(() => {
    if (session?.user) {
      loadChecklist(selectedScope);
    }
  }, [selectedScope, session, loadChecklist]);

  /* ------------------------------- PROGRESS -------------------------------- */
  const { progressPct, total, done } = useMemo(() => {
    if (!checklist) return { progressPct: 0, total: 0, done: 0 };
    const totalItems = checklist.categories.reduce((acc, c) => acc + c.items.length, 0);
    const checkedItems = checklist.categories.reduce(
      (acc, c) => acc + c.items.filter((i) => i.checked).length,
      0
    );
    return {
      progressPct: totalItems ? Math.round((checkedItems / totalItems) * 100) : 0,
      total: totalItems,
      done: checkedItems,
    };
  }, [checklist]);

  /* ----------------------------- FILTERED VIEW ----------------------------- */
  const filteredCategories = useMemo(() => {
    if (!checklist) return [];
    const s = search.trim().toLowerCase();
    if (!s) return checklist.categories;

    return checklist.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (i) =>
            i.text.toLowerCase().includes(s) ||
            (i.tooltip ?? '').toLowerCase().includes(s) ||
            (i.note ?? '').toLowerCase().includes(s)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [checklist, search]);

  /* ------------------------------- MUTATIONS ------------------------------- */
  const patchItem = async (
    scope: string,
    categoryName: string,
    itemText: string,
    patch: Partial<Pick<ChecklistItem, 'checked' | 'note'>>
  ) => {
    setSaving(true);
    try {
      const res = await fetch(ROUTES.PATCH_ITEM, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, categoryName, itemText, ...patch }),
      });
      if (!res.ok) throw new Error(await res.text());

      
      setChecklist((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev) as ChecklistDoc;
        const cat = next.categories.find((c) => c.name === categoryName);
        const item = cat?.items.find((i) => i.text === itemText);
        if (item) {
          if (typeof patch.checked === 'boolean') item.checked = patch.checked;
          if (typeof patch.note === 'string') item.note = patch.note;
        }
        return next;
      });

      if (patch.checked) {
        toast.success('Check completed!', { icon: '✅' });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Could not update item');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------- AI SUGGESTIONS ----------------------------- */
  const fetchSuggestions = async () => {
    if (!checklist) return;
    setSuggestLoading(true);
    try {
      const res = await fetch(ROUTES.AI_SUGGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: checklist.scope,
          categories: checklist.categories.map((c) => ({
            name: c.name,
            items: c.items.map((i) => ({ text: i.text, tooltip: i.tooltip })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.suggestions) {
        throw new Error(data?.message || 'No suggestions returned');
      }
      setAiSuggestions(data.data.suggestions);
      toast.success('AI suggestions loaded!', { icon: '🤖' });
    } catch (e: any) {
      toast.error(e.message ?? 'Could not fetch suggestions');
    } finally {
      setSuggestLoading(false);
    }
  };

  /* --------------------------------- UI ----------------------------------- */
  if (status === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  const selectedScopeData = SCOPES.find(s => s.id === selectedScope);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50"
        >
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">BugScope</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                {session.user?.name || session.user?.email}
              </div>
              <Button variant="ghost" size="icon" aria-label="settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.header>

        <main className="container py-6 space-y-6">
          {/* Scope Selector + Progress */}
          <section className="grid gap-6 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Select Testing Scope
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {SCOPES.map((s) => (
                    <Button
                      key={s.id}
                      variant={selectedScope === s.id ? 'default' : 'outline'}
                      onClick={() => setSelectedScope(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{done} done</span>
                    <Badge variant="secondary">{progressPct}%</Badge>
                  </div>
                  <Progress value={progressPct} />
                  <div className="text-xs text-muted-foreground">{total} total checks</div>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Search + Actions */}
          <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Search security checks, tooltips, or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadChecklist(selectedScope)}>
                Refresh
              </Button>
              <Button onClick={fetchSuggestions} disabled={!checklist || suggestLoading}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {suggestLoading ? 'Getting ideas…' : 'Get AI Suggestions'}
              </Button>
            </div>
          </motion.section>

          {/* Checklist + AI Suggestions */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Checklist */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-destructive" />
                    {SCOPES.find(s => s.id === selectedScope)?.name} Security Checklist
                    <div className="ml-auto text-xs text-muted-foreground">
                      {saving ? 'Saving…' : ' '}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {loadingChecklist && (
                    <div className="grid place-items-center py-12">
                      <div className="animate-spin h-8 w-8 rounded-full border-2 border-muted-foreground border-t-transparent" />
                    </div>
                  )}

                  {!loadingChecklist && checklist && (
                    <div className="space-y-6">
                      <AnimatePresence mode="wait">
                        {filteredCategories.map((cat, catIndex) => (
                          <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="rounded-lg border p-4"
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <h3 className="font-semibold">{cat.name}</h3>
                              <Badge variant="outline">
                                {cat.items.filter((i) => i.checked).length}/{cat.items.length}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {cat.items.map((item) => (
                                <motion.div
                                  key={`${cat.name}-${item.text}`}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="rounded-md border bg-card p-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={item.checked}
                                      onCheckedChange={(v) =>
                                        patchItem(checklist.scope, cat.name, item.text, {
                                          checked: Boolean(v),
                                        })
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm ${
                                            item.checked ? 'line-through text-muted-foreground' : ''
                                          }`}
                                        >
                                          {item.text}
                                        </span>
                                        {item.tooltip ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-xs cursor-help text-muted-foreground underline decoration-dotted">
                                                details
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="start" className="max-w-xs">
                                              {item.tooltip}
                                            </TooltipContent>
                                          </Tooltip>
                                        ) : null}
                                      </div>
                                      {/* Note */}
                                      <div className="mt-2">
                                        <Textarea
                                          placeholder="Add investigation notes or remediation steps…"
                                          defaultValue={item.note}
                                          onBlur={(e) =>
                                            e.currentTarget.value !== item.note &&
                                            patchItem(checklist.scope, cat.name, item.text, {
                                              note: e.currentTarget.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Suggestions Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <motion.div
                      animate={{ rotate: aiSuggestions.length > 0 ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                    </motion.div>
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!aiSuggestions.length && (
                    <p className="text-sm text-muted-foreground">
                      Ask AI for additional checks and one-line fixes based on the current scope & checklist.
                    </p>
                  )}
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {aiSuggestions.map((cat, i) => (
                        <motion.div
                          key={`${cat.name}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-md border p-3 bg-muted/30"
                        >
                          <div className="mb-3 font-medium text-white text-sm">{cat.name}</div>
                          <ul className="space-y-2">
                            {(cat.items as any[]).map((it, idx) => (
                              <li key={idx} className="rounded bg-background p-2 border">
                                <div className="text-sm">{it.text}</div>
                                {it.solution && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    <span className="font-medium">Fix:</span> {it.solution}
                                  </div>
                                )}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {/* Export placeholder — wire up when you add export API */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" disabled>Markdown</Button>
                  <Button variant="outline" disabled>CSV</Button>
                  <Button variant="outline" disabled>JSON</Button>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}