"use client";
import { motion } from "motion/react";
import { Shield, UserIcon, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from 'next-auth';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const user: User = session?.user as User;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-lg border-b border-white/20"
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
              BugScope
            </span>
          </motion.div>
          
          {/* Right side - User actions or auth buttons */}
          {session ? (
            <div className="flex items-center gap-3">
              {/* User profile */}
              <motion.div 
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-semibold drop-shadow-sm">{user.name || user.email}</div>
                  <div className="text-white/80 text-xs">Security Researcher</div>
                </div>
              </motion.div>
              
              {/* Settings button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/30 border border-white/20 bg-white/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
              
              {/* Logout button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="border-white/40 text-white hover:bg-white/20 hover:border-white/60 bg-white/10 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg">
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
    
   


