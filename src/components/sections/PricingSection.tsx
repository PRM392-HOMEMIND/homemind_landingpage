"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Container from "../common/Container";
import ThemeButton from "../common/ThemeButton";
import AppStoreLink from "../common/AppStoreLink";

const b2cPlans = [
  {
    name: "Gói Free",
    kind: "FREE",
    badge: null,
    priceMonthly: 0,
    unit: "/ vĩnh viễn",
    description: "Phù hợp cho cá nhân quản lý số lượng đồ dùng cơ bản.",
    features: [
      "Quản lý tối đa 30 items",
      "15 lượt AI Voice / tháng",
      "Nhập thủ công không giới hạn",
      "Cảnh báo hạn dùng qua app"
    ],
    buttonText: "Bắt đầu miễn phí",
    variant: "secondary" as const
  },
  {
    name: "Gói Premium",
    kind: "SUBSCRIPTION",
    badge: "PHỔ BIẾN NHẤT",
    priceMonthly: 29000,
    priceYearly: 299000,
    unit: "/ tháng",
    description: "Dành cho người nội trợ tối ưu hóa căn bếp thông minh.",
    features: [
      "Không giới hạn số lượng món",
      "60 lượt AI Voice / tháng",
      "Tự động nhắc hạn & gợi ý mua sắm",
      "Phân loại thông minh bằng AI Gemini Flash"
    ],
    buttonText: "Nâng cấp Premium",
    variant: "primary" as const
  },
  {
    name: "Gói Family",
    kind: "SUBSCRIPTION",
    badge: "CHO GIA ĐÌNH",
    priceMonthly: 59000,
    priceYearly: 599000,
    unit: "/ tháng",
    description: "Đồng bộ dữ liệu và danh sách mua sắm cho cả nhà.",
    features: [
      "Bao gồm toàn bộ quyền lợi Premium",
      "Chia sẻ & kết nối tối đa 5 thành viên",
      "100 lượt AI Voice / tháng",
      "Đồng bộ danh sách đi chợ realtime"
    ],
    buttonText: "Chọn gói Family",
    variant: "glass" as const
  },
  {
    name: "Credit",
    kind: "CREDIT",
    badge: "MUA MỘT LẦN",
    priceMonthly: 50000,
    unit: "/ 100 Credit",
    description: "Bổ sung đơn vị cho các thao tác trợ lý đủ điều kiện.",
    features: [
      "100 Credit thuộc tài khoản cá nhân",
      "Không tự gia hạn, không hết hạn theo gói",
      "Dùng sau hạn mức định kỳ đủ điều kiện",
      "Không chuyển, rút tiền hoặc trả phí gói"
    ],
    buttonText: "Chưa mở mua",
    variant: "secondary" as const
  }
] as const;

const microPosPrices = { priceMonthly: 149000, priceYearly: 1499000 };

function referencePrice(amount: number) {
  const groups = amount.toLocaleString("vi-VN").split(".");
  return groups.map((group, index) => (
    <Fragment key={index}>
      {group}{index < groups.length - 1 ? <>.<wbr /></> : "đ"}
    </Fragment>
  ));
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-white">
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            BẢNG GIÁ MINH BẠCH
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            Bảng giá linh hoạt cho mọi nhu cầu
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed font-semibold">
            Bắt đầu miễn phí; tìm hiểu Premium, Family, Micro-POS và Credit mua một lần.
          </p>
        </div>

        {/* Toggle Billing */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-bold ${!isYearly ? "text-slate-800" : "text-slate-500"}`}>Gói tháng</span>
          <button
            type="button"
            role="switch"
            aria-label="Xem gói năm"
            aria-checked={isYearly}
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-8 shrink-0 bg-slate-100 rounded-full border border-slate-200 p-1 cursor-pointer transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <div className={`w-6 h-6 rounded-full bg-emerald-500 shadow-sm transition-transform duration-300 ${isYearly ? "translate-x-6" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isYearly ? "text-slate-800" : "text-slate-500"}`}>Gói năm</span>
          </div>
        </div>

        {/* B2C Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch max-w-6xl mx-auto mb-16">
          {b2cPlans.map((plan) => {
            const price = plan.kind === "SUBSCRIPTION" && isYearly ? plan.priceYearly : plan.priceMonthly;
            const isPremium = plan.name === "Gói Premium";
            return (
              <div
                key={plan.name}
                data-offer={plan.kind}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPremium
                    ? "bg-[#f0fdf4]/30 border-2 border-emerald-500 shadow-lg scale-102"
                    : "bg-white border border-slate-100 shadow-sm hover:border-slate-200"
                }`}
              >
                {plan.badge && (
                  <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                    isPremium ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 mb-2 mt-4">{plan.name}</h3>
                  <p className="text-xs text-slate-600 font-semibold mb-6">{plan.description}</p>
                  
                  {/* Price */}
                  {plan.kind !== "FREE" && <p className="text-xs font-semibold text-slate-600 mb-2">Giá tham khảo</p>}
                  <div className="flex flex-wrap items-baseline gap-1 mb-8">
                    <span className="max-w-full [overflow-wrap:anywhere] text-3xl sm:text-4xl font-extrabold text-slate-800">
                      {referencePrice(price)}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{plan.kind === "SUBSCRIPTION" && isYearly ? "/ năm" : plan.unit}</span>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-4 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-slate-600 font-semibold">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.kind === "FREE" ? (
                  <AppStoreLink variant={plan.variant} className="w-full">{plan.buttonText}</AppStoreLink>
                ) : (
                  <div>
                    <ThemeButton type="button" disabled aria-describedby="pricing-availability" variant={plan.variant} className="w-full disabled:opacity-100">Chưa mở mua</ThemeButton>
                    {plan.kind === "CREDIT" && <p className="mt-4 text-xs leading-5 text-slate-600"><Link href="/terms-of-service#credit" className="font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Điều kiện Credit</Link>{" · "}<Link href="/privacy-policy#thanh-toan" className="font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Dữ liệu giao dịch</Link></p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* B2B Plan Section (Micro-POS) */}
        <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/50 p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col lg:max-w-2xl gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[9px] font-bold text-white uppercase tracking-wider">
                Cho Cửa Hàng Nhỏ (B2B)
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">Gói Micro-POS Tạp Hóa</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              Giải pháp chuyên biệt cho tiệm tạp hóa, cửa hàng thực phẩm nhỏ theo dõi tồn kho, quét voice nhập hàng nhanh, tự động cảnh báo đồ cận hạn & quản lý dòng tiền chính xác.
            </p>
          </div>
          
          <div className="flex flex-col items-center lg:items-end gap-4 shrink-0 max-w-full">
            <p className="text-xs font-semibold text-slate-600">Giá tham khảo</p>
            <div className="flex flex-wrap items-baseline gap-1 max-w-full">
              <span className="max-w-full [overflow-wrap:anywhere] text-3xl font-extrabold text-slate-800">
                {referencePrice(isYearly ? microPosPrices.priceYearly : microPosPrices.priceMonthly)}
              </span>
              <span className="text-xs font-bold text-slate-600">{isYearly ? "/ năm" : "/ tháng"}</span>
            </div>
            <ThemeButton type="button" disabled aria-describedby="pricing-availability" variant="secondary" className="w-full lg:w-auto disabled:opacity-100">
              Chưa mở mua
            </ThemeButton>
          </div>
        </div>

        <p id="pricing-availability" className="mt-8 max-w-3xl mx-auto text-center text-sm leading-6 text-slate-600">Hiện chưa mở mua Subscription, Credit hoặc chuyển gói. Giá tham khảo không phải báo giá Apple/Google; giá thực tế được cửa hàng ứng dụng hiển thị và xác nhận trước khi mua khi tính năng được mở. Credit mua một lần không phụ thuộc lựa chọn tháng/năm. Xem <Link href="/terms-of-service" className="font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Điều khoản sử dụng</Link>{" và "}<Link href="/privacy-policy" className="font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Chính sách bảo mật</Link>.</p>

      </Container>
    </section>
  );
}
