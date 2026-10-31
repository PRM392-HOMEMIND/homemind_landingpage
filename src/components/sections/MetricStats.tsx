"use client";

import { motion } from "framer-motion";
import { metrics } from "@/config/site";
import { fadeIn, staggerContainer } from "@/lib/animations";
import Container from "../common/Container";

export default function MetricStats() {
  return (
    <section id="metrics" className="py-16 relative overflow-hidden bg-slate-900 border-y border-slate-850">
      {/* Subtle grid pattern for dark strip */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />

      <Container className="relative z-10">
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              variants={fadeIn("up", 0.04 * index, 0.4)}
              className="p-4 text-center flex flex-col items-center justify-center group"
            >
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                {metric.prefix}
                {metric.value.toLocaleString('vi-VN')}
                {metric.suffix}
              </span>
              
              <span className="text-xs sm:text-sm text-slate-400 font-semibold max-w-[200px] leading-relaxed">
                {metric.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
