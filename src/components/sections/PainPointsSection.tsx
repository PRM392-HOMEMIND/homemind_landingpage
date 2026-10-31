"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShoppingBag, ClipboardCopy } from "lucide-react";
import { fadeIn, staggerContainer } from "@/lib/animations";
import Container from "../common/Container";

const painCards = [
  {
    title: "Đồ ăn hết hạn vứt bỏ âm thầm",
    description: "Rau củ, gia vị, hũ sốt hay thực phẩm mua về để sâu trong tủ lạnh quá lâu rồi hỏng. Mỗi tháng vứt đi hàng trăm ngàn đồng mà không hề hay biết.",
    icon: AlertTriangle,
    color: "text-red-500 bg-red-50"
  },
  {
    title: "Mua trùng lặp — Thiếu vẫn thiếu",
    description: "Đi siêu thị lại mua thêm chai dầu ăn hay nước mắm vì tưởng hết, về nhà mới biết còn 2 chai. Trong khi đó kem đánh răng hết sạch từ hôm qua.",
    icon: ShoppingBag,
    color: "text-orange-500 bg-orange-50"
  },
  {
    title: "Ghi chép thủ công phiền phức",
    description: "Ghi chú vào sổ tay hay note điện thoại nhưng đến lúc đi chợ lại quên xem. Mỗi người trong nhà lại giữ một danh sách khác nhau.",
    icon: ClipboardCopy,
    color: "text-slate-500 bg-slate-100"
  }
];

export default function PainPointsSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-red-500/20 bg-red-50 text-[10px] font-bold text-red-600 uppercase tracking-widest">
            THỰC TRẠNG PHỔ BIẾN
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Bạn đã từng lãng phí tiền bạc vì những chuyện này?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-semibold">
            Theo khảo sát 96 hộ gia đình Việt, trung bình mỗi nhà lãng phí từ <span className="text-red-500 font-bold">123.000đ đến 550.000đ</span> mỗi tháng chỉ vì quên đồ dùng trong tủ!
          </p>
        </div>

        {/* 3-column Grid layout */}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {painCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={fadeIn("up", 0.04 * index, 0.4)}
                className="group relative rounded-3xl premium-card p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 group-hover:text-red-500 transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </Container>
    </section>
  );
}
