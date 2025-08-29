"use client";
import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
    return (
        <motion.nav 
initial={{ y: -100 }}
animate={{ y: 0 }}
className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10"
>
<div className="container mx-auto px-6 py-4">
  <div className="flex items-center justify-between">
    <motion.div 
      className="flex items-center gap-3"
      whileHover={{ scale: 1.05 }}
    >
      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
        <Shield className="h-6 w-6 text-white" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        BugScope
      </span>
    </motion.div>
    
    <div className="flex items-center gap-4">
      <Link href="/sign-in">
        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          Get Started
        </Button>
      </Link>
    </div>
  </div>
</div>
</motion.nav>
        
    )
}
    
   


