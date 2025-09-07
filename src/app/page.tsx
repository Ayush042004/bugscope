'use client';

import { motion, useMotionValue, useTransform, useScroll, useSpring } from 'motion/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Globe,
  Smartphone,
  Wifi,
  Cloud,
  Brain,
  Network,
  ArrowRight,
  Star,
  Users,
  Target,
  Bug,
  Award,
  TrendingUp,
  Code,
  Database,
  Server,
} from 'lucide-react';
import Link from 'next/link';


const features = [
  {
    icon: Shield,
    title: 'Comprehensive Security Testing',
    description:
      'Complete checklists for web, API, mobile, IoT, cloud, and AI security testing',
    color: 'from-indigo-500 to-sky-600',
  },
  {
    icon: Brain,
    title: 'AI-Powered Suggestions',
    description:
      'Get intelligent recommendations based on your testing scope and progress',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description:
      'Visual progress tracking with detailed analytics and completion metrics',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Code,
    title: 'Export & Reporting',
    description:
      'Export findings in multiple formats: Markdown, CSV, JSON, and PDF',
    color: 'from-rose-500 to-red-600',
  },
];

const scopes = [
  { icon: Globe, name: 'Web Application', count: '400+ checks' },
  { icon: Network, name: 'API Security', count: 'Coming Soon' },
  { icon: Smartphone, name: 'Mobile Security', count: 'Coming Soon' },
  { icon: Wifi, name: 'IoT Security', count: 'Coming Soon' },
  { icon: Cloud, name: 'Cloud Security', count: 'Coming Soon' },
  { icon: Brain, name: 'AI/LLM Security', count: 'Coming Soon' },
  { icon: Server, name: 'Network Security', count: 'Coming Soon' },
  { icon: Database, name: 'Database Security', count: 'Coming Soon' },
];

const stats = [
  { icon: Users, value: 'Growing', label: 'Security Researchers' },
  { icon: Bug, value: 'Early Reports', label: 'Vulnerabilities Found' },
  { icon: Award, value: 'Beta', label: 'Success Rate' },
  { icon: TrendingUp, value: 'In Progress', label: 'Platform Uptime' },
];


const BG_BASE = 'bg-[#070a0d]';
const SURFACE = 'bg-[#0b1015]';
const ELEVATION = 'bg-[#0d1319]';
const BORDER = 'border-white/10';
const TEXT_MUTED = 'text-gray-300';
const ACCENT = 'text-lime-400';
const ACCENT_BG = 'bg-lime-500/12';
const ACCENT_RING = 'ring-1 ring-lime-400/30';
const BTN =
  'bg-gradient-to-r from-lime-500 to-teal-500 hover:from-lime-600 hover:to-teal-600 focus-visible:ring-lime-400';


function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-7xl px-6 ${className}`}>{children}</div>;
}

function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}


function TopProgress() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return show ? (
    <div className="fixed left-0 right-0 top-0 z-[60] h-[3px] overflow-hidden">
      <motion.div 
        className="h-full w-full origin-left bg-gradient-to-r from-lime-400 via-teal-400 to-cyan-400"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ 
          duration: 1.4, 
          ease: "easeOut"
        }}
      />
    </div>
  ) : null;
}


function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-0 h-[70vh] w-[70vw] rotate-[8deg] rounded-[999px] blur-3xl"
        style={{
          background:
            'conic-gradient(from 180deg, rgba(34,197,94,.12), rgba(13,148,136,.12), rgba(56,189,248,.08), rgba(34,197,94,.12))',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -right-24 top-32 h-[60vh] w-[60vw] -rotate-[12deg] rounded-[999px] blur-3xl"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(56,189,248,.1), rgba(34,197,94,.12), rgba(20,184,166,.12), rgba(56,189,248,.1))',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}


function AnimatedGrid() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 opacity-[0.05]">
      <motion.div 
        className="absolute inset-0 [background:linear-gradient(#fff1_1px,transparent_1px),linear-gradient(90deg,#fff1_1px,transparent_1px)] [background-size:22px_22px]"
        animate={{ 
          backgroundPosition: ["0px 0px, 0px 0px", "22px 22px, 22px 22px"]
        }}
        transition={{ 
          duration: 16, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
    </div>
  );
}


function Spotlight() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--x', `${e.clientX}px`);
      el.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          'radial-gradient(220px 220px at var(--x,50%) var(--y,50%), rgba(163,230,53,0.08), transparent 60%)',
      }}
    />
  );
}

function Magnetic({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rX = useTransform(y, [-20, 20], [8, -8]);
  const rY = useTransform(x, [-20, 20], [-8, 8]);
  return (
    <motion.div
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) / 6);
        y.set((e.clientY - (r.top + r.height / 2)) / 6);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y, rotateX: rX, rotateY: rY, perspective: 600 }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rX = useTransform(rx, [-30, 30], [8, -8]);
  const rY = useTransform(ry, [-30, 30], [-8, 8]);
  return (
    <motion.div
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width) * 60 - 30);
        rx.set(((e.clientY - r.top) / r.height) * 60 - 30);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: rX, rotateY: rY, transformStyle: 'preserve-3d', perspective: 800 }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

// Parallax layers bound to scroll
function ParallaxScene() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const smoothY1 = useSpring(y1, { stiffness: 120, damping: 20 });
  const smoothY2 = useSpring(y2, { stiffness: 120, damping: 20 });
  const smoothY3 = useSpring(y3, { stiffness: 120, damping: 20 });
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div style={{ y: smoothY1 }} className="absolute left-10 top-10 h-40 w-40 rounded-full bg-lime-500/10 blur-3xl" />
      <motion.div style={{ y: smoothY2 }} className="absolute right-16 top-24 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
      <motion.div style={{ y: smoothY3 }} className="absolute left-1/3 top-48 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
}

function DividerGlitch() {
  return (
    <div className="relative my-12 h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <motion.div 
        className="absolute inset-x-0 -top-[1px] h-px bg-[linear-gradient(90deg,transparent,rgba(163,230,53,.4),transparent)] opacity-60"
        animate={{ x: ["-20%", "20%", "-20%"] }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute inset-x-0 top-[1px] h-px bg-[linear-gradient(90deg,transparent,rgba(20,184,166,.35),transparent)] opacity-50"
        animate={{ x: ["-20%", "20%", "-20%"] }}
        transition={{ 
          duration: 3, 
          delay: 1.5,
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </div>
  );
}


export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const statIcons = useMemo(() => [Users, Bug, Award, TrendingUp], []);

  return (
    <div className={`min-h-screen ${BG_BASE} text-white`}>
      <TopProgress />
      <Aurora />
      <AnimatedGrid />
      <Spotlight />

      {/* HERO — parallax background */}
      <section className="relative pt-28">
        <ParallaxScene />
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1.2fr_1fr]">
            <div>
              <Badge className={`mb-6 border ${BORDER} ${ELEVATION} ${TEXT_MUTED}`}>
                <Star className="mr-2 h-4 w-4" />
                Empowering a Growing Security Community
              </Badge>
              <h1 className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl [text-shadow:0_0_30px_rgba(163,230,53,.15)]">
                Next-Gen Security
                <br />
                Testing Platform
              </h1>
              <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${TEXT_MUTED}`}>
                Revolutionize your bug bounty hunting with AI-powered suggestions, comprehensive checklists,
                and advanced analytics. Find vulnerabilities faster than ever before.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Magnetic>
                  <Link href="/sign-in">
                    <Button size="lg" className={`rounded-2xl px-9 py-6 text-lg shadow-2xl ${BTN}`}>
                      Start Testing Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </Magnetic>
                <Link href="#features" className={`text-sm ${TEXT_MUTED} hover:text-white`}>
                  Explore Features
                </Link>
              </div>
            </div>

            {/* Right — glossy 3D bento */}
            <div className="mx-auto w-full max-w-xl">
              <TiltCard>
                <div className={`rounded-3xl border ${BORDER} ${ELEVATION} p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)]`}>
                  <div className="grid grid-cols-3 gap-4">
                    {features.map((f) => (
                      <div
                        key={f.title}
                        className={`group relative rounded-2xl border ${BORDER} ${SURFACE} p-4 transition-transform hover:-translate-y-[3px]`}
                      >
                        <motion.div whileHover={{ scale: 1.06 }} className={`mb-3 inline-flex rounded-xl p-3 ${ACCENT_RING} ${ACCENT_BG}`}>
                          <f.icon className={`h-6 w-6 ${ACCENT}`} />
                        </motion.div>
                        <div className="h-2 w-20 rounded bg-white/15" />
                        <div className="mt-2 h-2 w-14 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </Container>
      </section>

      <DividerGlitch />

      {/* FEATURES */}
      <Section id="features">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="mb-2 text-4xl font-bold md:text-5xl">Powerful Features for Security Professionals</h2>
          <p className={`text-lg ${TEXT_MUTED}`}>
            Everything you need to conduct thorough security assessments and find critical vulnerabilities
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.05 }}
              onHoverStart={() => setHoveredFeature(i)}
              onHoverEnd={() => setHoveredFeature(null)}
            >
              <div className="relative rounded-2xl p-[1px] transition-transform hover:-translate-y-[3px]">
                <div className="absolute inset-0 rounded-2xl opacity-30 blur-md [background:conic-gradient(from_0deg,rgba(163,230,53,.5),rgba(20,184,166,.4),rgba(56,189,248,.3),rgba(163,230,53,.5))]" />
                <Card className={`relative h-full rounded-2xl border ${BORDER} ${ELEVATION}`}>
                  <CardContent className="p-7">
                    <div className="flex items-start gap-5">
                      <motion.div animate={{ scale: hoveredFeature === i ? 1.06 : 1 }} className={`rounded-xl p-4 ${ACCENT_RING} ${ACCENT_BG}`}>
                        <feature.icon className={`h-7 w-7 ${ACCENT}`} />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                        <p className={`mt-2 ${TEXT_MUTED}`}>{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      <DividerGlitch />

      {/* COVERAGE */}
      <Section id="coverage" className={`${ELEVATION}`}>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="mb-2 text-4xl font-bold md:text-5xl">Comprehensive Security Coverage</h2>
          <p className={`text-lg ${TEXT_MUTED}`}>Test across all major security domains with our extensive checklist library</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {scopes.map((scope) => (
            <Card
              key={scope.name}
              className={`group rounded-2xl border ${BORDER} ${SURFACE} transition-all hover:-translate-y-[3px] hover:shadow-[0_0_25px_-5px_rgba(163,230,53,0.28)]`}
            >
              <CardContent className="p-6 text-center">
                <motion.div whileHover={{ scale: 1.06 }} className={`mx-auto mb-3 inline-flex rounded-lg p-3 ${ACCENT_RING} ${ACCENT_BG}`}>
                  <scope.icon className={`h-8 w-8 ${ACCENT}`} />
                </motion.div>
                <h3 className="text-base font-semibold text-white">{scope.name}</h3>
                <p className={`mt-1 text-sm ${TEXT_MUTED}`}>{scope.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <DividerGlitch />

      {/* STATS (tighter + heading/subtitle above) */}
      <Section id="stats" className="py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">Platform Growth &amp; Reliability</h2>
          <p className={`text-base ${TEXT_MUTED}`}>Key metrics showcasing our progress and trust among researchers</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = statIcons[i];
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border ${BORDER} ${ELEVATION} p-6 text-center transition-transform hover:-translate-y-[3px]`}
              >
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  className={`mx-auto mb-3 inline-flex items-center justify-center rounded-full p-3 ${ACCENT_RING} ${ACCENT_BG}`}
                >
                  <Icon className={`h-6 w-6 ${ACCENT}`} />
                </motion.div>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <p className={`${TEXT_MUTED}`}>{stat.label}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <DividerGlitch />

      {/* CTA */}
      <Section className="py-20">
        <motion.div 
          className="relative overflow-hidden rounded-2xl border border-white/10 transition-transform hover:scale-[1.01]"
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(163,230,53,0.12),transparent_40%),linear-gradient(-120deg,rgba(20,184,166,0.12),transparent_40%)]" />
          <motion.div 
            className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]"
            animate={{ x: ["-100%", "0%", "100%"] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          />

          <div className="px-6 py-16 text-center md:px-16">
            <h2 className="mb-3 text-4xl font-bold md:text-5xl">Ready to Elevate Your Security Testing?</h2>
            <p className={`mx-auto mb-8 max-w-2xl text-lg ${TEXT_MUTED}`}>
              Join thousands of security researchers who trust BugScope for their vulnerability assessments
            </p>
            <Magnetic>
              <Link href="/sign-up">
                <Button size="lg" className={`rounded-2xl px-10 py-6 text-lg shadow-2xl ${BTN}`}>
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </Section>

      {/* FOOTER */}
      <footer className={`border-t ${BORDER} py-10`}>
        <Container className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <span className={`rounded-lg p-2 ${ACCENT_RING} ${ACCENT_BG}`}>
              <Shield className={`h-5 w-5 ${ACCENT}`} />
            </span>
            <span className="text-xl font-semibold text-white">BugScope</span>
          </div>
          <p className={`text-sm ${TEXT_MUTED}`}>
            © 2025 BugScope. All rights reserved. Securing the digital world, one bug at a time.
          </p>
        </Container>
      </footer>
    </div>
  );
}
