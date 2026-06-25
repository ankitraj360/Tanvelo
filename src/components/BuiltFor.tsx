import { motion } from "motion/react";
import { Briefcase, GraduationCap, Rocket, Lightbulb } from "lucide-react";

const audiences = [
  { title: "Professionals", icon: Briefcase },
  { title: "Students", icon: GraduationCap },
  { title: "Founders", icon: Rocket },
  { title: "Researchers", icon: Lightbulb },
];

export function BuiltFor() {
  return (
    <section className="py-32 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
            Built For
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {audiences.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square hover:shadow-md transition-shadow"
            >
              <item.icon className="w-10 h-10 text-gray-900 mb-6" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
