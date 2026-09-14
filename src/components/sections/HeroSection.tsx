"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, CheckCircle2, Star } from "lucide-react";
import Container from "../common/Container";
import AppStoreLink from "../common/AppStoreLink";
import Phone3D from "../common/Phone3D";
import FeedbackCampaign from "@/features/feedback/FeedbackCampaign";

export default function HeroSection() {
  const tags = [
    "Nói tự nhiên 3 giây",
    "Cảnh báo hạn dùng",
    "Tự gom danh sách mua"
  ];

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#f0fdf4]/50 grid-pattern-light">
      {/* Light background decorative glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] rounded-full bg-emerald-400/5 blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left: Content split */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-100/60 px-4 py-1.5 text-xs font-bold text-emerald-700 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              Trợ lý AI Quản Lý Tủ Đồ Nhanh Và Chính Xác
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-800 leading-[1.15]"
            >
              Quản lý tủ đồ gia đình <br />
              <span className="text-emerald-500 text-glow">bằng AI giọng nói.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-medium"
            >
              Đừng để thực phẩm & đồ dùng trong nhà bị lãng phí âm thầm. HomeMind giúp bạn nhớ mọi thứ: từ thức ăn, mỹ phẩm, thuốc đến gia vị. Tự động cảnh báo hạn dùng và lập danh sách đi chợ - chỉ bằng 1 câu nói.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:flex-wrap items-start gap-3 w-full mt-2"
            >
              <AppStoreLink className="w-full sm:w-auto flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" />
                Dùng thử miễn phí ngay
              </AppStoreLink>
              <div className="w-full sm:w-auto min-h-[48px] sm:min-w-[276px]">
                <FeedbackCampaign />
              </div>
            </motion.div>

            {/* Quick feature tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 mt-2"
            >
              {tags.map((tag) => (
                <div key={tag} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {tag}
                </div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6 pt-6 border-t border-slate-200/60 w-full"
            >
              <div className="flex -space-x-2">
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" alt="user" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" alt="user" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" alt="user" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=80&h=80&q=80" alt="user" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-700">+1.059 gia đình</span>
                  <span className="text-xs text-slate-500 font-medium">đang quản lý thông minh hơn</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">4.9/5</span>
                  <span className="text-[11px] text-slate-500">(98% hài lòng)</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Mockup split */}
          <div className="lg:col-span-6 w-full flex justify-center relative">
            <Phone3D />

            {/* Float Badge 1: Cảnh báo hạn dùng sữa tươi */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute top-20 -right-4 sm:-right-8 p-3 rounded-2xl border border-red-500/20 bg-white shadow-xl max-w-[180px] flex items-start gap-2.5 z-20"
            >
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                ⚠️
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-red-600">Cảnh báo hạn dùng</span>
                <span className="text-[10px] font-semibold text-slate-700 leading-tight">Sữa tươi hết hạn trong 2 ngày</span>
              </div>
            </motion.div>

            {/* Float Badge 2: Tiết kiệm chi tiêu */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-12 -left-4 sm:-left-8 p-3 rounded-2xl border border-emerald-500/20 bg-white shadow-xl max-w-[190px] flex items-start gap-2.5 z-20"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                💸
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-600">Tiết kiệm hiệu quả</span>
                <span className="text-[10px] font-semibold text-slate-700 leading-tight">Giảm 123.000đ lãng phí/tháng</span>
              </div>
            </motion.div>
          </div>

        </div>
      </Container>
    </section>
  );
}
