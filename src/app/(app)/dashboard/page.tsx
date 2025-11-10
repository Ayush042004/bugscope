'use client';

import * as React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Lightbulb,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
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
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  LogIn,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import Image from 'next/image';


const ROUTES = {
  CREATE_CHECKLIST: '/api/checklists/create',
  GET_USER_CHECKLIST: (scope: string) => `/api/checklists/${encodeURIComponent(scope)}`,
  GET_TEMPLATE: (scope: string) => `/api/get-temp/${encodeURIComponent(scope)}`,
  PATCH_ITEM: '/api/checklists/update',
  AI_SUGGEST: '/api/suggest',
};

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

// AI response typing
type AIProgressCategory = { name: string; percent: number };
type AIProgressSummary = {
  overallPercent: number;
  completed: number;
  total: number;
  notableGaps?: string[];
  categories?: AIProgressCategory[];
};
type AINextStep = { step: string; why?: string; impact?: 'high'|'medium'|'low'; confidence?: number };
type AIMissingCritical = { text: string; reason?: string; risk?: 'critical'|'high'|'medium'|'low' };
type AISuggestionItem = { text: string; solution?: string; impact?: 'high'|'medium'|'low' };
type AISuggestionCategory = { name: string; items: AISuggestionItem[] };
type AIResponsePayload = {
  version?: string;
  progressSummary?: AIProgressSummary;
  nextSteps?: AINextStep[];
  missingCritical?: AIMissingCritical[];
  suggestions?: AISuggestionCategory[];
};

const SCOPES = [
  { id: 'Web', name: 'Web App', icon: Globe },
  { id: 'api', name: 'API', icon: Network },
  { id: 'mobile', name: 'Mobile', icon: Smartphone },
  { id: 'iot', name: 'IoT', icon: Wifi },
  { id: 'cloud', name: 'Cloud', icon: Cloud },
  { id: 'aiml', name: 'AI/ML', icon: Brain },
  { id: 'network', name: 'Network', icon: Server },
  { id: 'database', name: 'Database', icon: Database },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedScope, setSelectedScope] = useState<string>('Web');
  const [checklist, setChecklist] = useState<ChecklistDoc | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [, setSaving] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionCategory[]>([]);
  const [progressSummary, setProgressSummary] = useState<AIProgressSummary | null>(null);
  const [nextSteps, setNextSteps] = useState<AINextStep[]>([]);
  const [missingCritical, setMissingCritical] = useState<AIMissingCritical[]>([]);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  // Removed advanced AI tuning controls (temperature, confidence filter, sort) per user request.
  const [aiVersion, setAiVersion] = useState<string | null>(null);

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
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 404) {
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
        } catch (innerErr: unknown) {
          const errorMessage = innerErr instanceof Error ? innerErr.message : 'Failed to seed checklist';
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load checklist';
        toast.error(errorMessage);
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Could not update item';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!checklist) return;
    setSuggestLoading(true);
    try {
      const res = await fetch(ROUTES.AI_SUGGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: checklist.scope,
          categories: checklist.categories.map(c => ({
            name: c.name,
            items: c.items.map(i => ({ text: i.text, tooltip: i.tooltip, checked: i.checked }))
          })),
          // options removed
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data) {
        throw new Error(data?.message || 'No AI data returned');
      }
    const payload: AIResponsePayload = data.data as AIResponsePayload;
    if (Array.isArray(payload.suggestions)) setAiSuggestions(payload.suggestions); else setAiSuggestions([]);
    if (typeof payload.version === 'string') setAiVersion(payload.version);
    setProgressSummary(payload.progressSummary || null);
    setNextSteps(Array.isArray(payload.nextSteps) ? payload.nextSteps : []);
    setMissingCritical(Array.isArray(payload.missingCritical) ? payload.missingCritical : []);
      toast.success('AI analysis ready!', { icon: '🤖' });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Could not fetch suggestions';
      toast.error(errorMessage);
    } finally {
      setSuggestLoading(false);
    }
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const expandAll = () => {
    if (!checklist) return;
    const newExpanded: Record<string, boolean> = {};
    checklist.categories.forEach((c) => {
      newExpanded[c.name] = true;
    });
    setExpandedCategories(newExpanded);
  };

  const collapseAll = () => {
    if (!checklist) return;
    const newExpanded: Record<string, boolean> = {};
    checklist.categories.forEach((c) => {
      newExpanded[c.name] = false;
    });
    setExpandedCategories(newExpanded);
  };

  const allExpanded = useMemo(() => {
    if (!checklist) return true;
    return checklist.categories.every((c) => expandedCategories[c.name] ?? true);
  }, [checklist, expandedCategories]);

  const toggleAll = () => {
    if (allExpanded) {
    collapseAll();
    } else {
    expandAll();
    }
  };

  const exportMarkdown = async () => {
    if (!checklist) return;
    setExportLoading('Markdown');
    try {
      const content =
        `# ${selectedScope} Security Checklist\n\n` +
        checklist.categories
          .map((cat) => {
            return (
              `## ${cat.name}\n` +
              cat.items
                .map(
                  (item) =>
                    `- [${item.checked ? 'x' : ' '}] ${item.text}\n` +
                    (item.tooltip ? `  - **Tooltip**: ${item.tooltip}\n` : '') +
                    (item.note ? `  - **Note**: ${item.note}\n` : '')
                )
                .join('\n')
            );
          })
          .join('\n\n');
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedScope}_checklist.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Markdown exported successfully!');
    } catch {
      toast.error('Failed to export Markdown');
    } finally {
      setExportLoading(null);
    }
  };

  const exportCSV = async () => {
    if (!checklist) return;
    setExportLoading('CSV');
    try {
      const headers = ['Category,Item,Status,Tooltip,Note'];
      const rows = checklist.categories.flatMap((cat) =>
        cat.items.map(
          (item) =>
            `"${cat.name}","${item.text.replace(/"/g, '""')}",${item.checked ? 'Completed' : 'Pending'},"${(item.tooltip || '').replace(/"/g, '""')}","${(item.note || '').replace(/"/g, '""')}"`
        )
      );
      const content = headers.concat(rows).join('\n');
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedScope}_checklist.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(null);
    }
  };

  const exportJSON = async () => {
    if (!checklist) return;
    setExportLoading('JSON');
    try {
      const content = JSON.stringify(checklist, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedScope}_checklist.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exported successfully!');
    } catch {
      toast.error('Failed to export JSON');
    } finally {
      setExportLoading(null);
    }
  };

  const exportPDF = async () => {
    if (!checklist) return;
    setExportLoading('PDF');
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`${selectedScope} Security Checklist`, 20, 20);
      let y = 30;
      checklist.categories.forEach((cat) => {
        doc.setFontSize(14);
        doc.text(cat.name, 20, y, { maxWidth: 160 });
        y += 10;
        cat.items.forEach((item) => {
          doc.setFontSize(10);
          doc.text(`- [${item.checked ? 'X' : ' '}] ${item.text}`, 25, y, { maxWidth: 150 });
          y += 6;
          if (item.tooltip) {
            doc.setFontSize(8);
            doc.text(`Tooltip: ${item.tooltip}`, 30, y, { maxWidth: 140 });
            y += 5;
          }
          if (item.note) {
            doc.setFontSize(8);
            doc.text(`Note: ${item.note}`, 30, y, { maxWidth: 140 });
            y += 5;
          }
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
        y += 5;
      });
      doc.save(`${selectedScope}_checklist.pdf`);
      toast.success('PDF exported successfully!');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setExportLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#070a0d] grid place-items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="p-10 rounded-2xl bg-[#0b1015] border border-[#2d4a25] backdrop-blur-xl shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-16 w-16 rounded-full border-4 border-[#87cf5f]/30 border-t-[#2db08d] mx-auto mb-6"
            />
            <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Loading Dashboard</h2>
            <p className="text-zinc-400 text-sm">Preparing your security testing workspace...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-[#070a0d] grid place-items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-zinc-200">
          <div className="p-8 rounded-2xl bg-[#0b1015] border border-[#2d4a25] backdrop-blur-xl shadow-2xl">
            <Image
              src="/bugscope.svg"
              alt="BugScope Logo"
              width={144}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
            <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-[#b6f09c] to-[#86db6d] bg-clip-text text-transparent">Authentication Required</h2>
            <p className="text-zinc-400 mb-6 text-sm">Please sign in to access your security testing dashboard</p>
            <Button
              onClick={() => signIn()}
              className="group relative w-full sm:w-auto justify-center h-10 rounded-full border border-[#1f2d20] bg-[#0b1015] text-white/90 text-sm font-semibold px-6 transition-all hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f]"
              aria-label="Sign in to access the dashboard"
            >
              <LogIn className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#2db08d]" />
              Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedScopeData = SCOPES.find((s) => s.id === selectedScope);

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-[#070a0d] relative overflow-x-hidden box-border font-sans">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-tr from-[#152316]/40 via-[#0f1711]/20 to-transparent" />
        </div>
        <header className="sticky top-0 z-20 bg-[#070a0d]/90 backdrop-blur-xl shadow-md border-b border-[#1c2a1d]">
          <div className="w-full mx-auto flex items-center justify-between py-4 px-10">
            <div className="flex items-center gap-2">
              <span className="rounded-lg p-2 bg-[#152316] ring-1 ring-[#2d4a25]/60">
                <Image
                  src="/bugscope.svg"
                  alt="BugScope Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </span>
              <span className="text-xl font-semibold text-white tracking-tight">BugScope</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-400 tracking-tight">Hi, {session?.user?.name?.split(' ')[0] || 'User'}</span>
             
            </div>
          </div>
        </header>
        <main className="w-full mx-auto py-12 px-10 space-y-10 relative z-10">
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1 tracking-tight">Security Testing Dashboard</h1>
              <p className="text-zinc-400 text-sm font-medium tracking-tight">Track, manage, and document your security checks with ease.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadChecklist(selectedScope)}
                className="relative bg-gradient-to-r from-[#8bd46a] to-[#2db08d] text-white rounded-full px-5 py-2 text-sm font-semibold shadow-md border-0"
                disabled={loadingChecklist}
                aria-label="Refresh the checklist"
              >
                {loadingChecklist ? (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-[#2db08d] rounded-full" />
                ) : (
                  <Activity className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </section>
          <section className="flex gap-3 flex-wrap">
            {SCOPES.map((scope) => {
              const Icon = scope.icon;
              const isSelected = selectedScope === scope.id;
              return (
                <Button
                  key={scope.id}
                  variant="outline"
                  onClick={() => setSelectedScope(scope.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition shadow-sm overflow-hidden
                    ${isSelected
                      ? 'bg-gradient-to-r from-[#8bd46a] to-[#2db08d] text-white border-0 ring-1 ring-[#2d4a25]/60'
                      : 'bg-[#0b1015] border-[#1f2d20] text-zinc-400 hover:bg-[#0f1711] hover:text-white hover:border-[#2d4a25]/60'}
                  `}
                  aria-label={`Select ${scope.name} scope`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{scope.name}</span>
                  {isSelected && <span className="ml-2 w-2 h-2 rounded-full bg-[#ff5c5c] animate-pulse" />}
                </Button>
              );
            })}
          </section>
          <section className="grid gap-6 md:grid-cols-4">
            {[
              { label: 'Total Checks', value: total, icon: <Activity className="h-6 w-6 text-white" /> },
              { label: 'Completed', value: done, icon: <CheckCircle2 className="h-6 w-6 text-white" /> },
              { label: 'Progress', value: `${progressPct}%`, icon: <TrendingUp className="h-6 w-6 text-white" /> },
              { label: 'Remaining', value: total - done, icon: <Zap className="h-6 w-6 text-white" /> },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="rounded-xl border border-[#1f2d20] shadow-lg bg-[#0b1015] backdrop-blur-md transition relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1 font-medium tracking-tight">{stat.label}</p>
                      <p className="text-2xl font-semibold text-white tracking-tight">{stat.value}</p>
                    </div>
                    {stat.icon}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
          <section className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              <div className="mb-6">
                <Input
                  placeholder="🔍 Search checks, tooltips, or notes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-5 py-3 border border-[#1f2d20] rounded-xl text-white placeholder:text-zinc-500 text-sm font-medium focus:border-[#2db08d] focus:ring-0 shadow-sm bg-[#0b1015]"
                  aria-label="Search checklist items"
                />
              </div>
              <Card className="rounded-xl border border-[#1f2d20] shadow-lg bg-[#0b1015] backdrop-blur-md transition relative
                before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-white text-xl font-semibold tracking-tight">
                      {selectedScopeData && <selectedScopeData.icon className="h-5 w-5 text-[#87cf5f]" />}
                      {selectedScopeData?.name} Security Checklist
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAll}
                      className="text-[#87cf5f] hover:text-[#2db08d] hover:bg-[#152316] text-sm"
                      aria-label={allExpanded ? 'Collapse all categories' : 'Expand all categories'}
                    >
                      {allExpanded ? (
                        <>
                          <ChevronsUp className="h-4 w-4 mr-1" />
                          Collapse All
                        </>
                      ) : (
                        <>
                          <ChevronsDown className="h-4 w-4 mr-1" />
                          Expand All
                        </>
                      )}
                    </Button>
                  </div>
                  {checklist && (
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1 relative">
                        <Progress value={progressPct} className="h-2.5 rounded-full bg-[#1f2d20] shadow-sm" />
                        <motion.div
                          className="absolute inset-0 h-2.5 rounded-full bg-gradient-to-r from-[#8bd46a] to-[#2db08d] opacity-90"
                          style={{ width: `${progressPct}%` }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                        <span className="absolute right-0 top-[-20px] text-xs font-medium text-[#2db08d] bg-[#0b1015] px-1 rounded">
                          {progressPct}%
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-[#152316] text-[#87cf5f] border-[#2d4a25] text-xs font-medium px-2 py-1"
                      >
                        {done}/{total} completed
                      </Badge>
                      {progressPct === 100 && (
                        <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[#2db08d] text-sm font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Complete!
                        </motion.span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!loadingChecklist && checklist && (
                    <div className="space-y-6">
                      <AnimatePresence>
                        {filteredCategories.map((cat) => {
                          const completed = cat.items.filter((i) => i.checked).length;
                          const allDone = completed === cat.items.length;
                          const expanded = expandedCategories[cat.name] ?? true;
                          return (
                            <motion.div
                              key={cat.name}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="rounded-xl border border-[#1f2d20] bg-[#0b1015] p-6 shadow-sm relative
                                before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                            >
                              <button
                                className="flex items-center justify-between w-full mb-3 cursor-pointer focus:outline-none"
                                onClick={() => toggleCategory(cat.name)}
                                aria-expanded={expanded}
                                aria-label={`Toggle ${cat.name} category`}
                              >
                                <h3 className="font-semibold text-white text-base tracking-tight">{cat.name}</h3>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                      ${allDone ? 'bg-gradient-to-r from-[#8bd46a] to-[#2db08d] text-white' : 'bg-[#152316] text-[#87cf5f]'}
                                    `}
                                  >
                                    {allDone && <CheckCircle2 className="h-3 w-3 text-white mr-1" />}
                                    {completed}/{cat.items.length}
                                  </div>
                                  <ChevronRight
                                    className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-90' : 'rotate-0'} ${allDone ? 'text-[#2db08d]' : 'text-zinc-400'}`}
                                  />
                                </div>
                              </button>
                              <AnimatePresence>
                                {expanded && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                                    {cat.items.map((item) => (
                                      <motion.div
                                        key={`${cat.name}-${item.text}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl border px-5 py-4 flex gap-4 items-center relative
                                          ${item.checked ? 'bg-gradient-to-r from-[#8bd46a]/20 to-[#2db08d]/10 border-[#2db08d]' : 'bg-[#0b1015] border-[#1f2d20]'}
                                          before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-2/3 before:h-[1px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                                        `}
                                        aria-label={`Toggle ${item.text} checklist item`}
                                      >
                                        <span
                                          className={`w-6 h-6 flex items-center justify-center rounded-md border ${item.checked ? 'bg-[#2db08d] border-[#87cf5f] text-white' : 'bg-[#0b1015] border-[#2d4a25]'} cursor-pointer`}
                                          role="checkbox"
                                          aria-checked={item.checked}
                                          tabIndex={0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            patchItem(checklist.scope, cat.name, item.text, {
                                              checked: !item.checked,
                                              note: item.note,
                                            });
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              patchItem(checklist.scope, cat.name, item.text, {
                                                checked: !item.checked,
                                                note: item.note,
                                              });
                                            }
                                          }}
                                        >
                                          {item.checked ? <CheckCircle2 className="h-5 w-5" /> : <span />}
                                        </span>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${item.checked ? 'line-through text-[#87cf5f]' : 'text-white'}`}>
                                              {item.text}
                                            </span>
                                            {item.tooltip && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-xs text-[#2db08d] underline decoration-dotted cursor-help">info</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" align="start" className="max-w-xs bg-[#0b1015] text-white border-[#2d4a25] text-xs">
                                                  {item.tooltip}
                                                </TooltipContent>
                                              </Tooltip>
                                            )}
                                          </div>
                                          <Textarea
                                            placeholder="Add notes, findings, or remediation steps…"
                                            defaultValue={item.note}
                                            onBlur={(e) =>
                                              e.currentTarget.value !== item.note &&
                                              patchItem(checklist.scope, cat.name, item.text, {
                                                note: e.currentTarget.value,
                                                checked: item.checked,
                                              })
                                            }
                                            className="bg-[#0b1015] border-[#1f2d20] text-white placeholder:text-zinc-500 resize-none focus:border-[#2db08d] focus:ring-0 rounded-lg text-sm font-medium px-3 py-2"
                                            rows={2}
                                            aria-label={`Notes for ${item.text}`}
                                          />
                                        </div>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <aside className="w-full lg:w-[480px] flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#1f2d20] bg-[#0b1015] backdrop-blur-md shadow-lg p-6 relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold tracking-tight">
                    <Lightbulb className="h-5 w-5 text-[#87cf5f]" />
                    AI Suggestions {aiVersion && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#152316] border border-[#1f2d20] text-[#2db08d]">{aiVersion}</span>}
                  </CardTitle>
                  <div className="absolute top-6 right-6">
                    <Button
                      onClick={fetchSuggestions}
                      disabled={!checklist || suggestLoading}
                      size="sm"
                      className="group h-9 px-4 rounded-full border border-[#1f2d20] bg-[#0b1015] text-white/90 text-sm font-semibold shadow-md transition-all hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f]"
                      aria-label="Fetch AI suggestions"
                    >
                      {suggestLoading ? (
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-white/80 border-t-[#2db08d] rounded-full" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#2db08d]" />
                      )}
                      <span className="transition-colors group-hover:text-[#b6f09c]">
                        {suggestLoading ? 'Analyzing…' : 'Get Ideas'}
                      </span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Advanced AI controls removed */}
                  {(!aiSuggestions.length && !progressSummary) && (
                    <div className="text-center py-6">
                      <Brain className="h-10 w-10 text-zinc-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 tracking-tight">Get AI-powered next steps & suggestions based on your progress</p>
                    </div>
                  )}
                  {progressSummary && (
                    <div className="rounded-xl border border-[#25402c] bg-[#0e1510] p-5 mb-5 shadow-md relative overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_30%_20%,#2db08d,transparent_60%)]" />
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div>
                          <div className="text-[11px] font-semibold text-[#b6f09c] tracking-wide uppercase">Progress Intelligence</div>
                          <div className="mt-1 h-2 w-40 rounded bg-[#1c2a20] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#8bd46a] to-[#2db08d]" style={{width: `${Math.min(progressSummary.overallPercent,100)}%`}} />
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-medium tabular-nums">{progressSummary.completed}/{progressSummary.total} ({progressSummary.overallPercent}%)</div>
                      </div>
                      {Array.isArray(progressSummary.categories) && progressSummary.categories.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2 relative z-10">
                          {progressSummary.categories.slice(0,4).map((c: AIProgressCategory, i: number)=> (
                            <div key={i} className="rounded bg-[#162019] border border-[#223627] px-2 py-1 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-300 truncate mr-2">{c.name}</span>
                              <span className="text-[10px] font-semibold text-[#8bd46a]">{c.percent}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {Array.isArray(progressSummary.notableGaps) && progressSummary.notableGaps.length > 0 && (
                        <div className="mt-3 space-y-1 relative z-10">
                          {progressSummary.notableGaps.slice(0,3).map((g: string, i: number) => (
                            <div key={i} className="text-[11px] text-zinc-400 flex gap-1">
                              <span className="text-[#2db08d]">•</span><span className="line-clamp-2">{g}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {nextSteps?.length > 0 && (
                    <div className="rounded-xl border border-[#25402c] bg-[#0e1510] p-6 mb-6 shadow-md">
                      <div className="mb-4 font-semibold text-[#2db08d] text-sm md:text-[15px] tracking-tight flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#8bd46a]"/>Recommended Next Steps</div>
                      <ol className="space-y-4 list-decimal ml-6">
                        {nextSteps.slice(0,6).map((s: AINextStep, i: number) => {
                          const impactColor = s.impact === 'high' ? 'text-red-300 bg-red-500/10 border-red-500/30' : s.impact === 'medium' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-sky-300 bg-sky-500/10 border-sky-500/30';
                          return (
                            <li key={i} className="text-[14px] md:text-[15px] text-white/90 leading-snug">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{s.step}</span>
                                {s.impact && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${impactColor}`}>{s.impact.toUpperCase()}</span>}
                              </div>
                              {s.why && <div className="text-[12px] md:text-[13px] text-zinc-400 mt-1 ml-0.5 leading-snug">{s.why}</div>}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                  {missingCritical?.length > 0 && (
                    <div className="rounded-xl border border-[#352a1f] bg-[#16110c] p-6 mb-6 shadow-md">
                      <div className="mb-4 font-semibold text-[#f3e7d3] text-sm md:text-[15px] tracking-tight flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#f3e7d3]"/>Potential Gaps</div>
                      <ul className="space-y-4">
                        {missingCritical.slice(0,6).map((m: AIMissingCritical, i: number) => {
                          const riskColor = m.risk === 'critical' ? 'bg-red-500/15 text-red-300 border-red-500/30' : m.risk === 'high' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : m.risk === 'medium' ? 'bg-amber-500/15 text-amber-200 border-amber-500/30' : 'bg-sky-500/15 text-sky-200 border-sky-500/30';
                          return (
                            <li key={i} className="text-[13px] md:text-[14px] text-white/85 leading-snug rounded-lg border border-[#2d4a25]/30 bg-[#0f1410] p-4">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-medium text-[#2db08d]">{m.text}</span>
                                {m.risk && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${riskColor}`}>{m.risk.toUpperCase()}</span>}
                              </div>
                              {m.reason && <div className="text-[12px] md:text-[13px] text-zinc-400 leading-snug mt-1">{m.reason}</div>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-5">
                      {aiSuggestions.map((cat, i) => (
                        <div
                          key={`${cat.name}-${i}`}
                          className="rounded-xl border border-[#1f2d20] bg-[#0b1015] p-5 relative shadow-md
                            before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                        >
                          <div className="mb-3 font-semibold text-[#2db08d] text-[13px] tracking-tight flex items-center gap-2"><Brain className="h-4 w-4 text-[#2db08d]"/>{cat.name}</div>
                          <ul className="space-y-3">
                            {cat.items.map((it: AISuggestionItem, idx: number) => {
                              const impactColor = it.impact === 'high' ? 'text-red-300 bg-red-500/10 border-red-500/30' : it.impact === 'medium' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : it.impact === 'low' ? 'text-sky-300 bg-sky-500/10 border-sky-500/30' : 'text-zinc-300 bg-zinc-500/5 border-zinc-500/20';
                              return (
                                <li key={idx} className="rounded-lg bg-[#070a0d] p-4 border border-[#1f2d20]">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <div className="text-[12px] text-white tracking-tight flex-1">{it.text}</div>
                                    {it.impact && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${impactColor}`}>{it.impact.toUpperCase()}</span>}
                                  </div>
                                  {it.solution && (
                                    <div className="mt-1 text-[11px] text-[#2db08d] bg-[#2db08d]/10 rounded px-2 py-1 leading-snug">
                                      <span className="font-medium">Quick Fix:</span> {it.solution}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#1f2d20] bg-[#0b1015] backdrop-blur-md shadow-lg p-6 relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#8bd46a] before:to-[#2db08d] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold tracking-tight">
                    <FileText className="h-5 w-5 text-[#87cf5f]" />
                    Export Results
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-zinc-400 tracking-tight">Export your security testing results</p>
                  <div className="grid gap-2">
                    {[
                      { format: 'Markdown', handler: exportMarkdown },
                      { format: 'CSV', handler: exportCSV },
                      { format: 'JSON', handler: exportJSON },
                      { format: 'PDF', handler: exportPDF },
                    ].map(({ format, handler }) => (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        onClick={handler}
                        disabled={!checklist || exportLoading === format}
                        className="group w-full justify-start h-10 rounded-lg border border-[#1f2d20] bg-[#0b1015] text-white/90 text-sm font-medium transition-all hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f] disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label={`Export checklist as ${format}`}
                      >
                        {exportLoading === format ? (
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-white/80 border-t-[#2db08d] rounded-full" />
                        ) : (
                          <Download className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#2db08d]" />
                        )}
                        <span className="transition-colors group-hover:text-[#b6f09c]">{format}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            </aside>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
