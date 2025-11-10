"use client";

import { motion } from "framer-motion";
import { UserIcon, Settings, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-lg border-b border-white/10"
    >
  <div className="container mx-auto px-4 sm:px-6 py-1 sm:py-0">


        <div className="flex items-center justify-between w-full overflow-hidden">

          
          <motion.div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer select-none"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src="/bugscope.svg"
              alt="BugScope Logo"
              width={150}
              height={50}
              priority
              className="h-10 w-auto sm:h-12 md:h-14 transition-transform duration-300 will-change-transform"
              style={{ color: "transparent" }}
            />

            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#b6f09c] to-[#86db6d] bg-clip-text text-transparent whitespace-nowrap">
              BugScope
            </span>
          </motion.div>

       
          {session ? (
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

              {/* User Card - Hidden on mobile */}
              <motion.div
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-[#0f1711] border border-[#2d4a25]/50 backdrop-blur-sm shadow-md flex-shrink-0"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-full bg-[#152316] flex items-center justify-center shadow-lg ring-1 ring-[#2d4a25]/60">
                  <UserIcon className="h-4 w-4 text-[#87cf5f]" />
                </div>

                <div className="text-sm">
                  <div className="text-white font-semibold">
                    {user?.name || user?.email}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Security Researcher
                  </div>
                </div>
              </motion.div>

             
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-[#87cf5f] hover:bg-[#152316] focus-visible:ring-1 focus-visible:ring-[#87cf5f]"
                >
                  <Settings className="h-4 w-4 text-zinc-300 group-hover:text-[#2db08d]" />
                </Button>
              </motion.div>

              {/* Logout */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-white hover:bg-[#152316] hover:border-[#2d4a25] focus-visible:ring-1 focus-visible:ring-[#87cf5f]"
                >
                  <LogOut className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-[#2db08d]" />
                  <span className="group-hover:text-[#b6f09c]">Logout</span>
                </Button>
              </motion.div>

            </div>

          ) : (
            /* Not Logged In */
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="group rounded-lg border border-[#2d4a25]/60 bg-transparent text-white/90 hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f] whitespace-nowrap"
                >
                  <LogIn className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-[#2db08d]" />
                  <span className="group-hover:text-[#b6f09c]">Sign In</span>
                </Button>
              </Link>

              <Link href="/sign-up">
                <Button className="rounded-lg bg-gradient-to-r from-[#8bd46a] to-[#2db08d] hover:from-[#79c85c] hover:to-[#249e7f] text-white shadow-lg ring-1 ring-[#2d4a25]/60 whitespace-nowrap">
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
