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
  { id: 'Web', name: 'Web App', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'api', name: 'API', icon: Network, color: 'from-green-500 to-emerald-500' },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'from-purple-500 to-pink-500' },
  { id: 'iot', name: 'IoT', icon: Wifi, color: 'from-orange-500 to-red-500' },
  { id: 'cloud', name: 'Cloud', icon: Cloud, color: 'from-indigo-500 to-blue-500' },
  { id: 'aiml', name: 'AI/ML', icon: Brain, color: 'from-violet-500 to-purple-500' },
  { id: 'network', name: 'Network', icon: Server, color: 'from-teal-500 to-cyan-500' },
  { id: 'database', name: 'Database', icon: Database, color: 'from-amber-500 to-orange-500' },
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

      // Optimistic UI update
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 grid place-items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 mx-auto mb-4"
          />
          <p className="text-white/70">Loading your security workspace...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 grid place-items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Shield className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-white/70 mb-6">Please sign in to access your dashboard</p>
          <Button onClick={() => signIn()} className="bg-gradient-to-r from-blue-500 to-purple-600">
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  const selectedScopeData = SCOPES.find(s => s.id === selectedScope);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Enhanced Navbar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/10"
        >
          <div className="container flex h-16 items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  BugScope
                </span>
                <div className="text-xs text-white/60">Security Testing Platform</div>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <motion.div 
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-medium">{session.user?.name || session.user?.email}</div>
                  <div className="text-white/60 text-xs">Security Researcher</div>
                </div>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <main className="container py-8 space-y-8">
          {/* Welcome Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Security Testing Dashboard
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Comprehensive security checklists powered by AI to help you find vulnerabilities faster
            </p>
          </motion.section>

          {/* Stats Overview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Total Checks</p>
                    <p className="text-2xl font-bold text-white">{total}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Completed</p>
                    <p className="text-2xl font-bold text-white">{done}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Progress</p>
                    <p className="text-2xl font-bold text-white">{progressPct}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Remaining</p>
                    <p className="text-2xl font-bold text-white">{total - done}</p>
                  </div>
                  <Zap className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Scope Selector */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-blue-400" />
                  Select Testing Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
                  {SCOPES.map((scope, index) => {
                    const Icon = scope.icon;
                    const isSelected = selectedScope === scope.id;
                    
                    return (
                      <motion.div
                        key={scope.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => setSelectedScope(scope.id)}
                          className={`w-full h-20 flex flex-col gap-2 relative overflow-hidden ${
                            isSelected 
                              ? `bg-gradient-to-r ${scope.color} text-white border-transparent` 
                              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="scope-selector"
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <Icon className="h-6 w-6" />
                          <span className="text-xs font-medium">{scope.name}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Search + Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search security checks, tooltips, or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={() => loadChecklist(selectedScope)}
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={loadingChecklist}
                >
                  {loadingChecklist ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full mr-2"
                    />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={fetchSuggestions} 
                  disabled={!checklist || suggestLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {suggestLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full mr-2"
                    />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {suggestLoading ? 'Analyzing…' : 'AI Suggestions'}
                </Button>
              </motion.div>
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <section className="grid gap-6 lg:grid-cols-4">
            {/* Checklist - Takes 3 columns */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.4 }}
              className="lg:col-span-3"
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-white">
                      {selectedScopeData && (
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedScopeData.color}`}>
                          <selectedScopeData.icon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      {selectedScopeData?.name} Security Checklist
                    </CardTitle>
                    
                    {saving && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-sm text-white/70"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-blue-400/50 border-t-blue-400 rounded-full"
                        />
                        Saving...
                      </motion.div>
                    )}
                  </div>
                  
                  {checklist && (
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1">
                        <Progress value={progressPct} className="h-2" />
                      </div>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {done}/{total} completed
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {loadingChecklist && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid place-items-center py-16"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 mb-4"
                      />
                      <p className="text-white/70">Loading security checklist...</p>
                    </motion.div>
                  )}

                  {!loadingChecklist && !checklist && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16"
                    >
                      <Bug className="h-16 w-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70">No checklist found for this scope</p>
                      <Button 
                        onClick={() => loadChecklist(selectedScope)}
                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
                      >
                        Create Checklist
                      </Button>
                    </motion.div>
                  )}

                  {!loadingChecklist && checklist && (
                    <div className="space-y-6">
                      <AnimatePresence mode="wait">
                        {filteredCategories.map((cat, catIndex) => (
                          <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: catIndex * 0.05 }}
                            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
                          >
                            <div className="p-4 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white text-lg">{cat.name}</h3>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: catIndex * 0.1 + 0.2 }}
                                >
                                  <Badge 
                                    variant="outline" 
                                    className="bg-white/10 border-white/20 text-white"
                                  >
                                    {cat.items.filter((i) => i.checked).length}/{cat.items.length}
                                  </Badge>
                                </motion.div>
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              <AnimatePresence>
                                {cat.items.map((item, itemIndex) => (
                                  <motion.div
                                    key={`${cat.name}-${item.text}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: itemIndex * 0.02 }}
                                    whileHover={{ scale: 1.01 }}
                                    className={`rounded-lg border p-4 transition-all duration-200 ${
                                      item.checked 
                                        ? 'bg-green-500/10 border-green-500/30' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <Checkbox
                                          checked={item.checked}
                                          onCheckedChange={(v) =>
                                            patchItem(checklist.scope, cat.name, item.text, {
                                              checked: Boolean(v),
                                            })
                                          }
                                          className="mt-1 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        />
                                      </motion.div>
                                      
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-start gap-2">
                                          <span
                                            className={`text-sm leading-relaxed ${
                                              item.checked 
                                                ? 'line-through text-white/50' 
                                                : 'text-white'
                                            }`}
                                          >
                                            {item.text}
                                          </span>
                                          {item.tooltip && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <motion.span 
                                                  whileHover={{ scale: 1.1 }}
                                                  className="text-xs cursor-help text-blue-400 underline decoration-dotted hover:text-blue-300"
                                                >
                                                  info
                                                </motion.span>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" align="start" className="max-w-xs bg-black/90 text-white border-white/20">
                                                {item.tooltip}
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </div>
                                        
                                        <motion.div
                                          initial={false}
                                          animate={{ opacity: item.checked ? 0.7 : 1 }}
                                        >
                                          <Textarea
                                            placeholder="Add investigation notes, findings, or remediation steps…"
                                            defaultValue={item.note}
                                            onBlur={(e) =>
                                              e.currentTarget.value !== item.note &&
                                              patchItem(checklist.scope, cat.name, item.text, {
                                                note: e.currentTarget.value,
                                              })
                                            }
                                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                                            rows={2}
                                          />
                                        </motion.div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar - AI Suggestions + Export */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {/* AI Suggestions */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-lg">
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <Brain className="h-12 w-12 text-white/30 mx-auto mb-3" />
                      <p className="text-sm text-white/70 mb-4">
                        Get AI-powered suggestions for additional security checks and quick fixes
                      </p>
                      <Button 
                        onClick={fetchSuggestions} 
                        disabled={!checklist || suggestLoading}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get Ideas
                      </Button>
                    </motion.div>
                  )}
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {aiSuggestions.map((cat, i) => (
                        <motion.div
                          key={`${cat.name}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <div className="mb-3 font-medium text-white text-sm">{cat.name}</div>
                          <ul className="space-y-2">
                            {(cat.items as any[]).map((it, idx) => (
                              <motion.li 
                                key={idx} 
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 + idx * 0.05 }}
                                className="rounded-md bg-black/20 p-3 border border-white/5"
                              >
                                <div className="text-xs text-white/90 leading-relaxed">{it.text}</div>
                                {it.solution && (
                                  <div className="mt-2 text-xs text-green-400/80 bg-green-500/10 rounded px-2 py-1">
                                    <span className="font-medium">Quick Fix:</span> {it.solution}
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

              {/* Export Card */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-white/70 mb-4">
                    Export your security testing results and findings
                  </p>
                  <div className="grid gap-2">
                    {['Markdown', 'CSV', 'JSON', 'PDF'].map((format, index) => (
                      <motion.div
                        key={format}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled 
                          className="w-full justify-start border-white/20 text-white/50"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {format}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-white/50 mt-3">Coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}