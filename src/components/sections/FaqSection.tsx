"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import Container from "../common/Container";

const faqs = [
  {
    question: "HomeMind nhận diện giọng nói tiếng Việt như thế nào?",
    answer: "AI của chúng tôi được tối ưu hóa đặc biệt cho giọng nói tiếng Việt của cả 3 miền Bắc - Trung - Nam. Khi bạn nói tự nhiên, AI tự động phân tích và trích xuất chính xác các thông tin như tên món đồ, số lượng, hạn sử dụng để lưu trữ ngay lập tức."
  },
  {
    question: "Gói Family hoạt động ra sao và chia sẻ như thế nào?",
    answer: "Khi đăng ký gói Family, bạn có thể mời tối đa 5 thành viên trong nhà tham gia thông qua mã chia sẻ nhanh. Mọi hoạt động thêm mới đồ ăn, báo hết hay mua sắm đều được đồng bộ hóa tức thì tới điện thoại của tất cả mọi người."
  },
  {
    question: "HomeMind có cảnh báo hạn sử dụng qua những kênh nào?",
    answer: "Ứng dụng sẽ gửi thông báo đẩy (Push Notification) thông minh trên điện thoại trước từ 1 đến 3 ngày (tùy bạn cài đặt) khi phát hiện thực phẩm hay thuốc tây trong tủ sắp hết hạn sử dụng."
  },
  {
    question: "Tôi có thể hủy đăng ký các gói trả phí bất cứ lúc nào không?",
    answer: "Hoàn toàn được. Bạn có thể tự do nâng cấp, hạ cấp hoặc hủy bỏ gói Premium, Family hay Micro-POS bất kỳ lúc nào trực tiếp ngay trong cài đặt ứng dụng mà không cần làm thủ tục phức tạp."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-[#f0fdf4]/20">
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10 max-w-4xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            HỎI ĐÁP PHỔ BIẾN
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Những câu hỏi thường gặp
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-semibold">
            Tìm câu trả lời nhanh chóng cho các thắc mắc về cách hoạt động và gói dịch vụ của HomeMind.
          </p>
        </div>

        {/* Accordion FAQ list */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-800 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3 text-xs sm:text-sm">
                    <HelpCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[200px] border-t border-slate-50" : "max-h-0"
                  }`}
                >
                  <p className="p-6 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </Container>
    </section>
  );
}
