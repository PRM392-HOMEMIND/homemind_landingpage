"use client";

import { motion } from "framer-motion";
import { Mic, Bell, ClipboardList, Users, Search, Store } from "lucide-react";
import { bentoFeatures } from "@/config/site";
import { fadeIn, staggerContainer } from "@/lib/animations";
import Container from "../common/Container";

const iconMap = {
  Mic: Mic,
  BellRing: Bell,
  ClipboardList: ClipboardList,
  Users: Users,
  SearchCode: Search,
  Store: Store,
};

export default function BentoGridSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#f0fdf4]/20">
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            GIẢI PHÁP TOÀN DIỆN
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Mọi thứ trong nhà, quản lý thông minh hơn
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-semibold">
            Thiết kế tối ưu cho thói quen sinh hoạt của gia đình Việt Nam và các tiệm tạp hóa nhỏ.
          </p>
        </div>

        {/* Bento Grid layout */}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {bentoFeatures.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap] || Mic;
            return (
              <motion.div
                key={feature.title}
                variants={fadeIn("up", 0.04 * index, 0.4)}
                className={`group relative overflow-hidden rounded-3xl premium-card p-8 flex flex-col justify-between min-h-[250px] ${
                  feature.colSpan || ""
                }`}
              >
                {/* Glow light spot on card hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-500 group-hover:text-white group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    {feature.tag && (
                      <span className="px-2.5 py-0.5 rounded-full border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 group-hover:border-emerald-500/20 group-hover:text-emerald-600 transition-colors">
                        {feature.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-500 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom border highlight line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/30 transition-all duration-500" />
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
