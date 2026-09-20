"use client";

import { useState } from "react";
import { Calculator, AlertTriangle, TrendingUp } from "lucide-react";
import Container from "../common/Container";
import AppStoreLink from "../common/AppStoreLink";

export default function RoiCalculatorSection() {
  const [members, setMembers] = useState(3);
  const [budget, setBudget] = useState(6000000);

  // Formulas
  const waste = budget * 0.1;
  const savings = waste * 0.85;
  const yearlySavings = savings * 12;
  const premiumCost = 29000;
  const roiMultiplier = Math.round(savings / premiumCost);

  return (
    <section id="calculator" className="py-24 relative overflow-hidden bg-white">
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            CÔNG CỤ TÍNH TOÁN TIẾT KIỆM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Xem HomeMind giúp gia đình bạn tiết kiệm bao nhiêu tiền?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
            Điều chỉnh quy mô gia đình & chi phí mua sắm để thấy kết quả ước tính hàng tháng.
          </p>
        </div>

        {/* Split layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Left Column: Sliders */}
          <div className="lg:col-span-6 p-8 rounded-3xl border border-slate-100 bg-[#f0fdf4]/20 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              {/* Slider 1: Members */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span>Số thành viên trong nhà:</span>
                  <span className="text-emerald-600 font-bold">{members} người</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={members}
                  onChange={(e) => setMembers(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 người</span>
                  <span>10 người</span>
                </div>
              </div>

              {/* Slider 2: Budget */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span>Chi phí đi chợ/mua sắm tháng:</span>
                  <span className="text-emerald-600 font-bold">{(budget).toLocaleString('vi-VN')}đ</span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="20000000"
                  step="500000"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.000.000đ</span>
                  <span>20.000.000đ</span>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100/80 flex gap-3 text-xs text-slate-500 leading-relaxed font-semibold">
              <Calculator className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                Dựa trên khảo sát thực tế: Mỗi gia đình lãng phí trung bình 10% ngân sách đi chợ do bỏ quên đồ hết hạn hoặc mua trùng lặp!
              </p>
            </div>
          </div>

          {/* Right Column: Result Board (Dark Slate background) */}
          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between gap-6 shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
              
              <div className="flex flex-col gap-5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">KẾT QUẢ ƯỚC TÍNH</span>
                
                {/* Former waste */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Tiền lãng phí trước đây:
                  </span>
                  <span className="text-sm font-semibold text-red-500 line-through">
                    ~{(waste).toLocaleString('vi-VN')}đ / tháng
                  </span>
                </div>

                {/* Savings with HomeMind */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Tiết kiệm cùng HomeMind:
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                    +{(savings).toLocaleString('vi-VN')}đ / tháng
                  </span>
                </div>

                {/* Annual projection */}
                <span className="text-[11px] text-slate-400 font-mono pl-6">
                  Tương đương ~{(yearlySavings).toLocaleString('vi-VN')}đ mỗi năm!
                </span>
              </div>

              {/* Gold border Box */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-300 leading-normal font-semibold">
                Lợi nhuận ROI gói Premium (29k/tháng): <span className="font-bold text-amber-400">Gấp {roiMultiplier} lần</span> chi phí bỏ ra!
              </div>

              {/* Action button */}
              <AppStoreLink className="w-full">
                Bắt đầu giữ lại tiền ngay
              </AppStoreLink>

            </div>
          </div>

        </div>

      </Container>
    </section>
  );
}
