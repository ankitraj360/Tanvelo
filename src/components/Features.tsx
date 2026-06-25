import { motion } from "motion/react";
import { BrainCircuit, Users, MessageSquareText, Pocket } from "lucide-react";

const features = [
  {
    title: "Smart Memory",
    description: "Remembers important conversations and helps you find them later.",
    icon: BrainCircuit,
  },
  {
    title: "Meeting Companion",
    description: "Keeps track of discussions so you can focus on the conversation.",
    icon: Users,
  },
  {
    title: "Ask Naturally",
    description: "Ask questions about previous conversations and get answers instantly.",
    icon: MessageSquareText,
  },
  {
    title: "Always Ready",
    description: "Designed to stay with you throughout the day.",
    icon: Pocket,
  }
];

export function Features() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
            What Can It Do?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gray-50 p-12 rounded-[2rem] flex flex-col items-start hover:bg-gray-100 transition-colors"
            >
              <div className="p-4 bg-white rounded-2xl shadow-sm mb-8">
                <feature.icon className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-lg text-gray-500 font-light leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
