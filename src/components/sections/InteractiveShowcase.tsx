"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Check } from "lucide-react";
import Container from "../common/Container";

const promptTemplates = [
  {
    id: "prompt1",
    buttonText: "Thêm 2 lốc sữa chua Vinamilk hạn dùng 10 ngày",
    speech: "Thêm 2 lốc sữa chua Vinamilk hạn dùng 10 ngày",
    parsed: {
      action: "Thêm mới vào Tủ Lạnh",
      product: "Sữa chua Vinamilk (2 lốc)",
      expiry: "10 ngày nữa (Hạn: 31/08/2026)",
      category: "Thực phẩm tươi / Sữa"
    }
  },
  {
    id: "prompt2",
    buttonText: "Vừa dùng hết chai nước mắm Nam Ngư 500ml",
    speech: "Vừa dùng hết chai nước mắm Nam Ngư 500ml",
    parsed: {
      action: "Chuyển vào Danh Sách Cần Mua",
      product: "Nước mắm Nam Ngư 500ml (1 chai)",
      expiry: "Đang trống",
      category: "Gia vị / Đồ khô"
    }
  },
  {
    id: "prompt3",
    buttonText: "Thêm 1 vỉ thuốc Paracetamol 500mg hạn năm 2028",
    speech: "Thêm 1 vỉ thuốc Paracetamol 500mg hạn năm 2028",
    parsed: {
      action: "Thêm mới vào Tủ Thuốc",
      product: "Thuốc Paracetamol 500mg (1 vỉ)",
      expiry: "Hạn năm 2028 (Hạn: 31/12/2028)",
      category: "Y tế / Thuốc tây"
    }
  }
];

export default function InteractiveShowcase() {
  const [activePromptId, setActivePromptId] = useState("prompt1");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const currentPrompt = promptTemplates.find((p) => p.id === activePromptId)!;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activePromptId]);

  return (
    <section id="simulator" className="py-24 relative overflow-hidden bg-white grid-pattern-light">
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            TRẢI NGHIỆM TƯƠNG TÁC
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Thử nghiệm AI Voice của HomeMind ngay!
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
            Bấm thử các câu lệnh mẫu bên dưới để xem cách AI nhận diện, tách thông tin và tự động xử lý chỉ trong chớp mắt.
          </p>
        </div>

        {/* Simulator layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Left Column: Interactive Prompts */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Chọn câu lệnh mẫu</span>
            <div className="flex flex-col gap-3">
              {promptTemplates.map((p) => {
                const isActive = p.id === activePromptId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.id !== activePromptId) {
                        setIsAnalyzing(true);
                        setActivePromptId(p.id);
                      }
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/5 border-emerald-500/40 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isActive
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-semibold transition-colors leading-snug ${
                        isActive ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      &quot;{p.buttonText}&quot;
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Simulated Terminal Screen */}
          <div className="lg:col-span-7 flex">
            <div className="w-full relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-[0_20px_50px_rgba(15,23,42,0.3)] flex flex-col justify-stretch min-h-[350px]">
              
              {/* Window Header Bar (Mac style) */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span className="w-3 h-3 rounded-full bg-[#eab308]" />
                  <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">
                  HomeMind AI Voice Parser Simulator v2.4
                </span>
              </div>

              {/* Terminal Screen Body */}
              <div className="flex-1 p-6 flex flex-col justify-between gap-6 font-mono text-slate-300">
                
                {/* Voice Input Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">BẠN NÓI</span>
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <Mic className="w-4 h-4 shrink-0 text-emerald-500" />
                    &quot;{currentPrompt.speech}&quot;
                  </div>
                </div>

                {/* Parsing Results area */}
                <div className="flex-grow flex flex-col justify-center min-h-[140px] relative">
                  <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                      <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-semibold"
                      >
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-3 rounded bg-emerald-500 animate-pulse" />
                          <span className="w-1.5 h-5 rounded bg-emerald-500 animate-pulse delay-75" />
                          <span className="w-1.5 h-2 rounded bg-emerald-500 animate-pulse delay-150" />
                        </div>
                        AI HomeMind đang phân tích...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-3"
                      >
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">KẾT QUẢ AI TRÍCH XUẤT TỰ ĐỘNG</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
                            <span className="text-slate-500 font-semibold">Hành động:</span>
                            <span className="font-bold text-slate-200">{currentPrompt.parsed.action}</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
                            <span className="text-slate-500 font-semibold">Tên sản phẩm:</span>
                            <span className="font-bold text-emerald-400">{currentPrompt.parsed.product}</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
                            <span className="text-slate-500 font-semibold">Hạn sử dụng:</span>
                            <span className="font-bold text-slate-200">{currentPrompt.parsed.expiry}</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
                            <span className="text-slate-500 font-semibold">Phân loại:</span>
                            <span className="font-bold text-emerald-400">{currentPrompt.parsed.category}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>STATUS: READY</span>
                  </div>
                  {!isAnalyzing && (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      Đã lưu thành công
                    </span>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
