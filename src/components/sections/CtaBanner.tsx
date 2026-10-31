"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Container from "../common/Container";
import ThemeButton from "../common/ThemeButton";
import AppStoreLink from "../common/AppStoreLink";

export default function CtaBanner() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-900">
      {/* Intense glow backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none animate-pulse-slow" />

      <Container>
        <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-12 sm:p-16 overflow-hidden text-center flex flex-col items-center gap-6 max-w-5xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight max-w-2xl">
              Sẵn sàng quản lý tủ đồ thông minh cùng HomeMind?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed font-semibold">
              Bắt đầu chống lãng phí thực phẩm và tối ưu hóa chi tiêu đi chợ của gia đình bạn ngay hôm nay chỉ bằng một câu nói.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
              <AppStoreLink className="w-full sm:w-auto">
                Bắt đầu dùng thử miễn phí
              </AppStoreLink>
              <ThemeButton variant="secondary" className="w-full sm:w-auto bg-transparent border-slate-800 text-white hover:bg-slate-900">
                Tìm hiểu thêm
              </ThemeButton>
            </div>
          </motion.div>

          {/* Colorful bottom beam */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-teal-500/30" />
        </div>
      </Container>
    </section>
  );
}
