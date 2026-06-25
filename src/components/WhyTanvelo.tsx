import { motion } from "motion/react";
import { X, Check } from "lucide-react";

export function WhyTanvelo() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
            Why Tanvelo?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Without Tanvelo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-50 rounded-[2rem] p-10 md:p-14"
          >
            <h3 className="text-2xl font-medium text-gray-400 mb-10">Without Tanvelo</h3>
            <ul className="space-y-6">
              {[
                "Forgotten details",
                "Lost meeting notes",
                "Information scattered everywhere"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-gray-500 text-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-300">
                    <X className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With Tanvelo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="bg-gray-900 rounded-[2rem] p-10 md:p-14 shadow-2xl"
          >
            <h3 className="text-2xl font-medium text-white mb-10">With Tanvelo</h3>
            <ul className="space-y-6">
              {[
                "Important memories accessible",
                "Conversations organized",
                "Instant recall when needed"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-gray-200 text-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
