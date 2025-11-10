"use client";
import {motion} from "motion/react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Centralized tokens (consider moving to a design-tokens file later)
// const BG_BASE = 'bg-[#070a0d]'; // Unused in this component currently
const SURFACE = 'bg-[#0b1015]';
const ELEVATION = 'bg-[#0d1319]';
const BORDER = 'border-white/10';
const TEXT_MUTED = 'text-gray-300';
const ACCENT = 'text-lime-400';
const ACCENT_BG = 'bg-lime-500/12';
const ACCENT_RING = 'ring-1 ring-lime-400/30';
const BTN = 'bg-gradient-to-r from-lime-500 to-teal-500 hover:from-lime-600 hover:to-teal-600 focus-visible:ring-lime-400';

interface HeroProps {
  onPrimaryCtaHref?: string;
  onSecondaryCtaHref?: string;
}

export default function Hero({
  onPrimaryCtaHref = "/sign-in",
  onSecondaryCtaHref = "#features",
}: HeroProps) {
  return (
    <div className="relative pt-28">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1.2fr_1fr]">
        {/* Left content */}
        <div>
          <div className={`inline-flex items-center gap-2 mb-6 border ${BORDER} ${ELEVATION} ${TEXT_MUTED} rounded-xl px-4 py-2 text-sm`}> 
            <Star className="h-4 w-4" />
            <span>Empowering a Growing Security Community</span>
          </div>
          <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl [text-shadow:0_0_30px_rgba(163,230,53,.15)]">
            Next-Gen Security<br />Testing Platform
          </h1>
          <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${TEXT_MUTED}`}>
            Revolutionize your bug bounty hunting with AI-powered suggestions, comprehensive checklists,
            and advanced analytics. Find vulnerabilities faster than ever before.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href={onPrimaryCtaHref}>
              <Button size="lg" className={`rounded-2xl px-9 py-6 text-lg shadow-2xl ${BTN}`}>
                Start Testing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={onSecondaryCtaHref} className={`text-sm ${TEXT_MUTED} hover:text-white`}>
              Explore Features
            </Link>
          </div>
        </div>
        {/* Right visual (simplified; original bento kept inline for now) */}
        <div className="mx-auto w-full max-w-xl">
          <div className={`rounded-3xl border ${BORDER} ${ELEVATION} p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)]`}>
            <div className="grid grid-cols-3 gap-4">
              {["Checks","AI","Reports","Metrics","Cloud","API","Mobile","IoT","LLM"].map(item => (
                <motion.div key={item} whileHover={{scale:1.06}} className={`group relative rounded-2xl border ${BORDER} ${SURFACE} p-4 transition-transform hover:-translate-y-[3px]`}>
                  <div className={`mb-3 inline-flex rounded-xl p-3 ${ACCENT_RING} ${ACCENT_BG}`}> 
                    <span className={`text-xs font-semibold ${ACCENT}`}>{item}</span>
                  </div>
                  <div className="h-2 w-20 rounded bg-white/15" />
                  <div className="mt-2 h-2 w-14 rounded bg-white/10" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
