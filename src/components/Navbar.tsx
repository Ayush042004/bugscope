
"use client";

import { motion } from "motion/react";
import { Shield, UserIcon, Settings, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from "next-auth";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user: User = session?.user as User;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-lg border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
            <div className="p-2 rounded-xl bg-[#152316] ring-1 ring-[#2d4a25]/60 shadow-lg">
              <Shield className="h-6 w-6 text-[#87cf5f]" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#b6f09c] to-[#86db6d] bg-clip-text text-transparent">
              BugScope
            </span>
          </motion.div>

          {session ? (
            <div className="flex items-center gap-3">
              <motion.div
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-[#0f1711] border border-[#2d4a25]/50 backdrop-blur-sm shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-full bg-[#152316] flex items-center justify-center shadow-lg ring-1 ring-[#2d4a25]/60">
                  <UserIcon className="h-4 w-4 text-[#87cf5f]" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-semibold">{user?.name || user?.email}</div>
                  <div className="text-gray-400 text-xs">Security Researcher</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-[#87cf5f] hover:bg-[#152316] focus-visible:ring-1 focus-visible:ring-[#87cf5f] transition-colors"
                >
                  <Settings className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-[#2db08d]" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-white hover:bg-[#152316] hover:border-[#2d4a25] focus-visible:ring-1 focus-visible:ring-[#87cf5f] transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#2db08d]" />
                  <span className="transition-colors group-hover:text-[#b6f09c]">Logout</span>
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-white/90 hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f] transition-all"
                >
                  <LogIn className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#2db08d]" />
                  <span className="transition-colors group-hover:text-[#b6f09c]">Sign In</span>
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-lg bg-gradient-to-r from-[#8bd46a] to-[#2db08d] hover:from-[#79c85c] hover:to-[#249e7f] text-white shadow-lg ring-1 ring-[#2d4a25]/60">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
