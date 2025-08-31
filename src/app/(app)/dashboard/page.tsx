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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';


import {
  Shield,
  Target,
  Bug,
  Lightbulb,
  FileText,
  Search,
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
} from 'lucide-react';


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
  { id: 'Web', name: 'Web App', icon: Globe, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'api', name: 'API', icon: Network, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-500/20 to-emerald-500/20' },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-500/20 to-pink-500/20' },
  { id: 'iot', name: 'IoT', icon: Wifi, color: 'from-orange-500 to-red-500', bgColor: 'from-orange-500/20 to-red-500/20' },
  { id: 'cloud', name: 'Cloud', icon: Cloud, color: 'from-indigo-500 to-blue-500', bgColor: 'from-indigo-500/20 to-blue-500/20' },
  { id: 'aiml', name: 'AI/ML', icon: Brain, color: 'from-violet-500 to-purple-500', bgColor: 'from-violet-500/20 to-purple-500/20' },
  { id: 'network', name: 'Network', icon: Server, color: 'from-teal-500 to-cyan-500', bgColor: 'from-teal-500/20 to-cyan-500/20' },
  { id: 'database', name: 'Database', icon: Database, color: 'from-amber-500 to-orange-500', bgColor: 'from-amber-500/20 to-orange-500/20' },
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Could not update item';
      toast.error(errorMessage);
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Could not fetch suggestions';
      toast.error(errorMessage);
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
          <div className="p-8 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-20 w-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-white mb-3">Loading Dashboard</h2>
            <p className="text-white/70">Preparing your security testing workspace...</p>
          </div>
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
          <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl">
            <Shield className="h-20 w-20 mx-auto mb-6 text-blue-400" />
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Authentication Required</h2>
            <p className="text-white/70 mb-8 text-lg">Please sign in to access your security testing dashboard</p>
            <Button 
              onClick={() => signIn()} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedScopeData = SCOPES.find(s => s.id === selectedScope);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <main className="container py-6 space-y-8 pt-24">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 py-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 mb-1">Total Checks</p>
                    <p className="text-3xl font-bold text-white">{total}</p>
                  </div>
                  <div className="p-4 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <Activity className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-white">{done}</p>
                  </div>
                  <div className="p-4 rounded-full bg-green-500/20 border border-green-500/30">
                    <CheckCircle2 className="h-7 w-7 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 mb-1">Progress</p>
                    <p className="text-3xl font-bold text-white">{progressPct}%</p>
                  </div>
                  <div className="p-4 rounded-full bg-purple-500/20 border border-purple-500/30">
                    <TrendingUp className="h-7 w-7 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 mb-1">Remaining</p>
                    <p className="text-3xl font-bold text-white">{total - done}</p>
                  </div>
                  <div className="p-4 rounded-full bg-orange-500/20 border border-orange-500/30">
                    <Zap className="h-7 w-7 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

        
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg shadow-xl">
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
                          className={`w-full h-24 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                            isSelected 
                              ? `bg-gradient-to-r ${scope.color} text-white border-transparent shadow-xl` 
                              : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-lg'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="scope-selector"
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <Icon className="h-7 w-7" />
                          <span className="text-sm font-medium">{scope.name}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>


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
                className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-blue-400/50 focus:ring-blue-400/20 h-12 text-base"
              />
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={() => loadChecklist(selectedScope)}
                  className="border-white/30 text-white hover:bg-white/20 hover:border-white/40 bg-white/5 h-12 px-6"
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg h-12 px-6"
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

         
          <section className="grid gap-6 lg:grid-cols-4">
          
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.4 }}
              className="lg:col-span-3"
            >
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-white">
                      {selectedScopeData && (
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedScopeData.color} shadow-lg`}>
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
                        <Progress value={progressPct} className="h-3 bg-white/10" />
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
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
                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg"
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
                            className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm overflow-hidden shadow-lg"
                          >
                            <div className="p-4 bg-gradient-to-r from-white/10 to-transparent border-b border-white/20">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white text-lg">{cat.name}</h3>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: catIndex * 0.1 + 0.2 }}
                                >
                                  <Badge 
                                    variant="outline" 
                                    className="bg-white/20 border-white/30 text-white"
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
                                        ? 'bg-green-500/20 border-green-500/40 shadow-lg' 
                                        : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 hover:shadow-md'
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
                                            patchItem(checklist.scope, cat.name, item.text , {
                                              checked: Boolean(v),
                                              note: item.note,
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
                                                checked: item.checked,

                                              })
                                            }
                                            className="bg-white/10 border-white/30 text-white placeholder:text-white/40 resize-none focus:border-blue-400/50 focus:ring-blue-400/20 transition-all duration-200"
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

          
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
             
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-lg shadow-xl">
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
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
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
                          className="rounded-lg border border-white/20 bg-white/10 p-3 shadow-md"
                        >
                          <div className="mb-3 font-medium text-white text-sm">{cat.name}</div>
                          <ul className="space-y-2">
                            {(cat.items as Array<{ text: string; solution?: string }>).map((it, idx) => (
                              <motion.li 
                                key={idx} 
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 + idx * 0.05 }}
                                className="rounded-md bg-black/30 p-3 border border-white/10"
                              >
                                <div className="text-xs text-white/90 leading-relaxed">{it.text}</div>
                                {it.solution && (
                                  <div className="mt-2 text-xs text-green-400/80 bg-green-500/20 rounded px-2 py-1">
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

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-lg shadow-xl">
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
                          className="w-full justify-start border-white/30 text-white/50 hover:bg-white/10 hover:border-white/40 bg-white/5 h-10 transition-all duration-200"
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
