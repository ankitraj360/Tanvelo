import { motion } from "motion/react";

const steps = [
  {
    title: "Listen",
    description: "Captures important conversations and moments.",
  },
  {
    title: "Organize",
    description: "Transforms information into structured memories.",
  },
  {
    title: "Recall",
    description: "Ask questions anytime and retrieve important details.",
  }
];

export function HowItWorks() {
  return (
    <section className="py-32 px-6 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
            How It Works
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-[1px] bg-gray-200"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col items-center text-center z-10"
              >
                <div className="w-48 h-48 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-10 relative">
                  <div className="absolute inset-0 bg-gray-50 rounded-full scale-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <span className="text-gray-200 text-8xl font-light select-none tracking-tighter">0{index + 1}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-lg text-gray-500 font-light max-w-[260px] leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
