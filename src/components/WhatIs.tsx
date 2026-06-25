import { motion } from "motion/react";

export function WhatIs() {
  return (
    <section id="what-is" className="py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-12">
            What is Tanvelo?
          </h2>
          
          <div className="space-y-8 text-xl md:text-2xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
            <p>
              Tanvelo is a compact AI companion that helps you capture conversations, meetings, ideas, and important moments throughout your day.
            </p>
            <p>
              Instead of taking manual notes, Tanvelo helps you stay present while keeping your memories accessible whenever you need them.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-8"
        >
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Always Present</h3>
          </div>
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <div className="w-12 h-1 bg-gray-200 rounded-full shadow-[0_8px_0_0_#e5e7eb,0_-8px_0_0_#e5e7eb]"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Never Distracting</h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
