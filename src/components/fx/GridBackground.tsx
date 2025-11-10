"use client";

import { motion } from "framer-motion";

export function GridBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 opacity-[0.08]">
      <motion.div
        className="absolute inset-0 [background:linear-gradient(#ffffff0f_1px,transparent_1px),linear-gradient(90deg,#ffffff0f_1px,transparent_1px)] [background-size:40px_40px]"
        animate={{ backgroundPosition: ["0px 0px,0px 0px", "40px 40px,40px 40px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
