import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-col items-start text-left z-10"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4"
          >
            Your AI Memory Companion
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-gray-900 leading-[1.1] mb-6">
            Never Forget a <br className="hidden md:block" />
            Conversation Again.
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-light mb-10 max-w-lg leading-relaxed">
            Tanvelo listens, remembers, organizes, and helps you recall important moments whenever you need them.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a 
              href="#waitlist"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Join Waitlist
            </a>
            <a 
              href="#what-is"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-900 rounded-full text-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="relative w-full h-[500px] lg:h-[700px] flex items-center justify-center"
        >
          {/* Using a subtle background glow instead of gradients */}
          <div className="absolute inset-0 bg-gray-50 rounded-full blur-3xl opacity-50 scale-75"></div>
          
          <motion.img 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            src="https://photos.app.goo.gl/z1sbMfKPiVDYmkkA9" 
            alt="Tanvelo Device"
            className="w-full h-full object-contain drop-shadow-2xl z-10"
            onError={(e) => {
              // Fallback for google photos URL that might not embed
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback image if google photos URL fails to embed directly */}
          <div className="hidden absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center border border-gray-100">
               <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                 <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
               </div>
            </div>
          </div>
        </motion.div>

      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-gray-400"
      >
        <span className="text-xs uppercase tracking-widest mb-2 font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
