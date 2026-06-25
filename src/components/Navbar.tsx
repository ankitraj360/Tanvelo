import { motion } from "motion/react";
import { Mountain } from "lucide-react";

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="flex items-center gap-2 font-medium text-lg tracking-tight">
        <Mountain className="w-6 h-6" />
        Tanvelo
      </div>
      <a 
        href="#waitlist" 
        className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        Join Waitlist
      </a>
    </motion.nav>
  );
}
