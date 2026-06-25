import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section ref={containerRef} className="py-32 px-6 bg-white overflow-hidden flex items-center justify-center min-h-screen">
      <div className="max-w-6xl mx-auto w-full relative">
        <motion.div 
          style={{ scale }}
          className="relative rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-gray-50 aspect-[4/3] md:aspect-video shadow-2xl ring-1 ring-gray-900/5"
        >
          <motion.img 
            style={{ y }}
            src="product_render.jpg" 
            alt="Tanvelo Product" 
            className="absolute inset-0 w-full h-[120%] object-cover -top-[10%]"
            onError={(e) => {
              // Fallback placeholder if image not found
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback View */}
          <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-32 h-32 border-4 border-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="font-semibold text-xl tracking-wider">TANVELO</span>
            </div>
            <p className="text-sm font-medium tracking-widest uppercase">Product Render</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
