"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Tokens
const SURFACE = "bg-[#0b1015]";
const ELEVATION = "bg-[#0d1319]";
const BORDER = "border-white/10";
const TEXT_MUTED = "text-gray-300";
const ACCENT = "text-lime-400";
const ACCENT_BG = "bg-lime-500/12";
const ACCENT_RING = "ring-1 ring-lime-400/30";
const BTN =
  "bg-gradient-to-r from-lime-500 to-teal-500 hover:from-lime-600 hover:to-teal-600 focus-visible:ring-lime-400";

interface HeroProps {
  onPrimaryCtaHref?: string;
  onSecondaryCtaHref?: string;
}

export default function Hero({
  onPrimaryCtaHref = "/sign-in",
  onSecondaryCtaHref = "#features",
}: HeroProps) {
  return (
    <div className="relative pt-24 sm:pt-28">
      <div className="grid grid-cols-1 items-center gap-10 md:gap-12 md:grid-cols-[1.15fr_1fr]">
        {/* Left content */}
        <div>
          <div className={`inline-flex items-center gap-2 mb-5 sm:mb-6 border ${BORDER} ${ELEVATION} ${TEXT_MUTED} rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm`}>
            <Star className="h-4 w-4" />
            <span className="truncate max-w-[180px] sm:max-w-none">Empowering a Growing Security Community</span>
          </div>
          <h1 className="text-balance text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight tracking-tight [text-shadow:0_0_30px_rgba(163,230,53,.15)]">
            Next-Gen Security<br />
            Testing Platform
          </h1>
          <p className={`mt-5 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed ${TEXT_MUTED}`}>
            Revolutionize your bug bounty hunting with AI-powered suggestions, comprehensive checklists, and advanced analytics. Find vulnerabilities faster than ever before.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href={onPrimaryCtaHref}>
              <Button size="lg" className={`rounded-2xl px-7 sm:px-9 py-5 sm:py-6 text-base sm:text-lg shadow-2xl ${BTN}`}>
                Start Testing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={onSecondaryCtaHref} className={`text-sm ${TEXT_MUTED} hover:text-white`}>Explore Features</Link>
          </div>
        </div>
        {/* Right visual grid */}
        <div className="mx-auto w-full max-w-xl">
          <div className={`rounded-3xl border ${BORDER} ${ELEVATION} p-4 sm:p-5 md:p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)] overflow-hidden`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {["Checks","AI","Reports","Metrics","Cloud","API","Mobile","IoT","LLM"].map(item => (
                <motion.div key={item} whileHover={{scale:1.06}} className={`group relative rounded-xl sm:rounded-2xl border ${BORDER} ${SURFACE} p-3 sm:p-4 transition-transform hover:-translate-y-[3px] min-w-0`}>
                  <div className={`mb-2 sm:mb-3 inline-flex rounded-lg sm:rounded-xl p-2 sm:p-3 ${ACCENT_RING} ${ACCENT_BG}`}>
                    <span className={`text-[10px] sm:text-xs font-semibold ${ACCENT}`}>{item}</span>
                  </div>
                  <div className="h-2 w-14 sm:w-20 rounded bg-white/15" />
                  <div className="mt-1 sm:mt-2 h-2 w-10 sm:w-14 rounded bg-white/10" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
