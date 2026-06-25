import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function Waitlist() {
  return (
    <section id="waitlist" className="py-32 px-6 bg-white relative overflow-hidden border-t border-gray-100">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6">
            Be First to Experience Tanvelo
          </h2>
          <p className="text-xl text-gray-500 font-light mb-12">
            Join early supporters and get updates before launch.
          </p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 max-w-lg mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Name" 
              required
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
            <input 
              type="email" 
              placeholder="Email address" 
              required
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 px-8 py-4 w-full bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors"
          >
            Join Waitlist
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.form>
      </div>
    </section>
  );
}
