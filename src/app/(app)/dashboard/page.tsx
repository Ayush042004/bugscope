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
  Shield,
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
  const [aiSuggestions, setAiSuggestions] = useState<ChecklistCategory[]>([]);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
      const content = `# ${selectedScope} Security Checklist\n\n` +
        checklist.categories
          .map((cat) => {
            return `## ${cat.name}\n` +
              cat.items
                .map(
                  (item) =>
                    `- [${item.checked ? 'x' : ' '}] ${item.text}\n` +
                    (item.tooltip ? `  - **Tooltip**: ${item.tooltip}\n` : '') +
                    (item.note ? `  - **Note**: ${item.note}\n` : '')
                )
                .join('\n');
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
    } catch (error) {
      console.error('Failed to export Markdown', error);
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
    } catch (error) {
      console.error('Failed to export CSV', error);
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
    } catch (error) {
      console.error('Failed to export JSON', error);
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
    } catch (error) {
      console.error('Failed to export PDF', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F19] via-[#1E1B4B] to-[#0B0F19] grid place-items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="p-10 rounded-2xl bg-[rgba(20,25,40,0.8)] border border-[#2D3748] backdrop-blur-xl shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-16 w-16 rounded-full border-4 border-[#6C63FF]/30 border-t-[#00E0FF] mx-auto mb-6"
            />
            <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-2">Loading Dashboard</h2>
            <p className="text-[#A1A1AA] text-sm">Preparing your security testing workspace...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F19] via-[#1E1B4B] to-[#0B0F19] grid place-items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-[#E5E7EB]"
        >
          <div className="p-8 rounded-2xl bg-[rgba(20,25,40,0.8)] border border-[#2D3748] backdrop-blur-xl shadow-2xl">
            <Shield className="h-16 w-16 mx-auto mb-6 text-[#6C63FF]" />
            <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] bg-clip-text text-transparent">Authentication Required</h2>
            <p className="text-[#A1A1AA] mb-6 text-sm">Please sign in to access your security testing dashboard</p>
            <Button
              onClick={() => signIn()}
              className="bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] text-[#E5E7EB] border-0 px-6 py-2 text-sm font-semibold rounded-full shadow-lg transition-all duration-300 relative
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#00E0FF44] before:to-[#6C63FF44] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              aria-label="Sign in to access the dashboard"
            >
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
      <div className="min-h-screen w-full bg-[rgba(10,12,20,0.95)] relative overflow-x-hidden box-border font-sans">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-tr from-[#6C63FF]/10 via-[#00E0FF]/5 to-transparent animate-gradientMove" />
        </div>
        <header className="sticky top-0 z-20 bg-[rgba(10,12,20,0.85)] backdrop-blur-xl shadow-md border-b border-[#2D3748]">
          <div className="w-full mx-auto flex items-center justify-between py-4 px-10">
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-[#E5E7EB]" />
              <span className="font-display text-xl font-semibold text-[#E5E7EB] tracking-tight">BugScope</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#A1A1AA] tracking-tight">Hi, {session?.user?.name?.split(' ')[0] || 'User'}</span>
              <Image
                src={session?.user?.image || '/avatar.svg'}
                alt="User avatar"
                className="h-8 w-8 rounded-full border-2 border-[#6C63FF] shadow-md hover:shadow-[0_0_10px_rgba(108,99,255,0.5)] transition-all duration-300"
              />
            </div>
          </div>
        </header>
        <main className="w-full mx-auto py-12 px-10 space-y-10 relative z-10">
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[#E5E7EB] mb-1 tracking-tight">Security Testing Dashboard</h1>
              <p className="text-[#A1A1AA] text-sm font-medium tracking-tight">Track, manage, and document your security checks with ease.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadChecklist(selectedScope)}
                className="relative bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] text-[#E5E7EB] rounded-full px-5 py-2 text-sm font-semibold shadow-md border-0 btn-shimmer transition-all duration-300 overflow-hidden
                  before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-[#00E0FF44] before:to-[#6C63FF44] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                disabled={loadingChecklist}
                aria-label="Refresh the checklist"
              >
                {loadingChecklist ? (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-[#E5E7EB] border-t-[#6C63FF] rounded-full" />
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
                      ? 'bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] text-[#E5E7EB] border-0 ring-1 ring-[#6C63FF]'
                      : 'bg-[rgba(20,25,40,0.7)] border-[#2D3748] text-[#A1A1AA] hover:bg-[rgba(30,35,50,0.7)] hover:text-[#E5E7EB] hover:border-[#6C63FF]'}
                    before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-[#00E0FF44] before:to-[#6C63FF44] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                  `}
                  aria-label={`Select ${scope.name} scope`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isSelected ? 'text-[#E5E7EB]' : 'text-[#A1A1AA] group-hover:text-[#E5E7EB]'
                    }`}
                  />
                  <span>{scope.name}</span>
                  {isSelected && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" /> // Changed dot color to #FF6B6B (red)
                  )}
                </Button>
              );
            })}
          </section>
          <section className="grid gap-6 md:grid-cols-4">
            {[
              { label: 'Total Checks', value: total, icon: <Activity className="h-6 w-6 text-[#E5E7EB]" /> },
              { label: 'Completed', value: done, icon: <CheckCircle2 className="h-6 w-6 text-[#E5E7EB]" /> },
              { label: 'Progress', value: `${progressPct}%`, icon: <TrendingUp className="h-6 w-6 text-[#E5E7EB]" /> },
              { label: 'Remaining', value: total - done, icon: <Zap className="h-6 w-6 text-[#E5E7EB]" /> },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="rounded-xl border border-[#2D3748] shadow-lg bg-[rgba(20,25,40,0.7)] backdrop-blur-md transition relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A1A1AA] mb-1 font-medium tracking-tight">{stat.label}</p>
                      <p className="text-2xl font-semibold text-[#E5E7EB] tracking-tight">{stat.value}</p>
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
                  className="w-full px-5 py-3 border border-[#2D3748] rounded-xl text-[#E5E7EB] placeholder:text-[#6B7280] text-sm font-medium focus:border-[#6C63FF] focus:ring-0 shadow-sm bg-[rgba(20,25,40,0.7)] backdrop-blur-md"
                  aria-label="Search checklist items"
                />
              </div>
              <Card className="rounded-xl border border-[#2D3748] shadow-lg bg-[rgba(20,25,40,0.7)] backdrop-blur-md transition relative
                before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-[#E5E7EB] text-xl font-semibold tracking-tight">
                      {selectedScopeData && <selectedScopeData.icon className="h-5 w-5 text-[#E5E7EB]" />}
                      {selectedScopeData?.name} Security Checklist
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAll}
                      className="text-[#6C63FF] hover:text-[#00E0FF] hover:bg-[#6C63FF]/10 text-sm"
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
                        <Progress value={progressPct} className="h-2.5 rounded-full bg-[#2D3748] shadow-sm" />
                        <motion.div
                          className="absolute inset-0 h-2.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] opacity-90 shadow-[0_0_8px_rgba(108,99,255,0.5)]"
                          style={{ width: `${progressPct}%` }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                        <span className="absolute right-0 top-[-20px] text-xs font-medium text-[#00E0FF] bg-[rgba(20,25,40,0.7)] px-1 rounded">{progressPct}%</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-[#6C63FF]/10 text-[#6C63FF] border-[#6C63FF] text-xs font-medium px-2 py-1"
                      >
                        {done}/{total} completed
                      </Badge>
                      {progressPct === 100 && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[#00E0FF] text-sm font-medium flex items-center gap-1"
                        >
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
                              className="rounded-xl border border-[#2D3748] bg-[rgba(20,25,40,0.7)] p-6 shadow-sm relative
                                before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                            >
                              <button
                                className="flex items-center justify-between w-full mb-3 cursor-pointer focus:outline-none"
                                onClick={() => toggleCategory(cat.name)}
                                aria-expanded={expanded}
                                aria-label={`Toggle ${cat.name} category`}
                              >
                                <h3 className="font-semibold text-[#E5E7EB] text-base tracking-tight">{cat.name}</h3>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                      ${allDone ? 'bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] text-white' : 'bg-[#6C63FF]/10 text-[#6C63FF]'}
                                    `}
                                  >
                                    {allDone && <CheckCircle2 className="h-3 w-3 text-white mr-1" />}
                                    {completed}/{cat.items.length}
                                  </div>
                                  <ChevronRight
                                    className={`h-4 w-4 transition-transform duration-300 ${
                                      expanded ? 'rotate-90' : 'rotate-0'
                                    } ${allDone ? 'text-[#00E0FF]' : 'text-[#A1A1AA]'}`}
                                  />
                                </div>
                              </button>
                              <AnimatePresence>
                                {expanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                  >
                                    {cat.items.map((item) => (
                                      <motion.div
                                        key={`${cat.name}-${item.text}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl border px-5 py-4 flex gap-4 items-center cursor-pointer relative
                                          ${item.checked
                                            ? 'bg-gradient-to-r from-[#6C63FF]/20 to-[#00E0FF]/10 border-[#6C63FF]'
                                            : 'bg-[rgba(20,25,40,0.7)] border-[#2D3748]'}
                                          before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-2/3 before:h-[1px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                                        `}
                                        onClick={() =>
                                          patchItem(checklist.scope, cat.name, item.text, {
                                            checked: !item.checked,
                                            note: item.note,
                                          })
                                        }
                                        aria-label={`Toggle ${item.text} checklist item`}
                                      >
                                        <span
                                          className={`w-6 h-6 flex items-center justify-center rounded-md border
                                            ${item.checked ? 'bg-[#6C63FF] border-[#00E0FF] text-white' : 'bg-[rgba(20,25,40,0.7)] border-[#6C63FF]'}
                                          `}
                                        >
                                          {item.checked ? <CheckCircle2 className="h-5 w-5" /> : <span />}
                                        </span>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`text-sm font-medium ${item.checked ? 'line-through text-[#6C63FF]' : 'text-[#E5E7EB]'}`}
                                            >
                                              {item.text}
                                            </span>
                                            {item.tooltip && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-xs text-[#00E0FF] underline decoration-dotted cursor-help">info</span>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="top"
                                                  align="start"
                                                  className="max-w-xs bg-[rgba(20,25,40,0.9)] text-[#E5E7EB] border-[#6C63FF] text-xs"
                                                >
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
                                            className="bg-[rgba(20,25,40,0.7)] border-[#2D3748] text-[#E5E7EB] placeholder:text-[#6B7280] resize-none focus:border-[#6C63FF] focus:ring-0 rounded-lg text-sm font-medium px-3 py-2"
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
                className="rounded-xl border border-[#2D3748] bg-[rgba(20,25,40,0.7)] backdrop-blur-md shadow-lg p-6 relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[#E5E7EB] text-lg font-semibold tracking-tight">
                    <Lightbulb className="h-5 w-5" />
                    AI Suggestions
                  </CardTitle>
                  <div className="absolute top-6 right-6">
                    <Button
                      onClick={fetchSuggestions}
                      disabled={!checklist || suggestLoading}
                      size="sm"
                      className="bg-gradient-to-r from-[#6C63FF] to-[#00E0FF] text-[#E5E7EB] rounded-full text-sm font-semibold shadow-md border-0 btn-shimmer transition-all duration-300 relative
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#00E0FF44] before:to-[#6C63FF44] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                      aria-label="Fetch AI suggestions"
                    >
                      {suggestLoading ? (
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-[#E5E7EB] border-t-[#6C63FF] rounded-full" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {suggestLoading ? 'Analyzing…' : 'Get Ideas'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!aiSuggestions.length && (
                    <div className="text-center py-6">
                      <Brain className="h-10 w-10 text-[#A1A1AA] mx-auto mb-2" />
                      <p className="text-xs text-[#A1A1AA] tracking-tight">
                        Get AI-powered suggestions for additional security checks
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    {aiSuggestions.map((cat, i) => (
                      <div
                        key={`${cat.name}-${i}`}
                        className="rounded-lg border border-[#2D3748] bg-[rgba(20,25,40,0.7)] p-4 relative
                          before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                      >
                        <div className="mb-2 font-semibold text-[#00E0FF] text-sm tracking-tight">{cat.name}</div>
                        <ul className="space-y-2">
                          {(cat.items as Array<{ text: string; solution?: string }>).map((it, idx) => (
                            <li key={idx} className="rounded-lg bg-[rgba(10,12,20,0.9)] p-3 border border-[#2D3748]">
                              <div className="text-xs text-[#E5E7EB] tracking-tight">{it.text}</div>
                              {it.solution && (
                                <div className="mt-1 text-xs text-[#00E0FF] bg-[#00E0FF]/10 rounded px-2 py-1">
                                  <span className="font-medium">Quick Fix:</span> {it.solution}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#2D3748] bg-[rgba(20,25,40,0.7)] backdrop-blur-md shadow-lg p-6 relative
                  before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6C63FF] before:to-[#00E0FF] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[#E5E7EB] text-lg font-semibold tracking-tight">
                    <FileText className="h-5 w-5" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-[#A1A1AA] tracking-tight">Export your security testing results</p>
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
                        className="w-full justify-start border border-[#2D3748] text-[#E5E7EB] bg-[rgba(20,25,40,0.7)] h-9 text-sm font-medium rounded-lg relative
                          before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#00E0FF44] before:to-[#6C63FF44] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                        aria-label={`Export checklist as ${format}`}
                      >
                        {exportLoading === format ? (
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-[#E5E7EB] border-t-[#6C63FF] rounded-full" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {format}
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