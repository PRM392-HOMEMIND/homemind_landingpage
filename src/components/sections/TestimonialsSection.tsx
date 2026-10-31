"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { testimonials } from "@/config/site";
import { fadeIn, staggerContainer } from "@/lib/animations";
import Container from "../common/Container";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-[#f0fdf4]/20">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            ĐÁNH GIÁ THỰC TẾ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Khách hàng nói gì về HomeMind?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-semibold">
            Hàng ngàn người nội trợ, gia đình trẻ và chủ cửa hàng đã thay đổi thói quen quản lý tủ đồ.
          </p>
        </div>

        {/* Testimonials Grid layout */}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              variants={fadeIn("up", 0.04 * index, 0.4)}
              className="group relative rounded-3xl premium-card p-8 flex flex-col justify-between bg-white"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 group-hover:border-emerald-500/30 transition-colors"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-500 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.role}</p>
                    </div>
                  </div>
                  <Quote className="w-6 h-6 text-slate-100 group-hover:text-emerald-500/10 transition-colors" />
                </div>

                <div className="flex items-center gap-0.5 text-amber-400 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed italic font-semibold">
                  &quot;{item.content}&quot;
                </p>
              </div>

              {/* Decorative top line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-emerald-500/20 transition-all duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
