# Phân Tích Phong Cách Thiết Kế (Styling Summary) - HomeMind

Tài liệu này mô tả chi tiết phong cách triển khai UI/UX, thiết kế hệ thống (Design System) và cấu trúc component của landing page HomeMind. Các khía cạnh được phân tích dưới góc nhìn của một frontend developer, tập trung vào khả năng tái sử dụng, kiến trúc component và trải nghiệm người dùng.

## 1. Hệ thống Màu sắc (Color Palette)
Trang web sử dụng bảng màu hiện đại, mang lại cảm giác thân thiện, sạch sẽ và liên quan đến sức khỏe/thực phẩm:
- **Màu chủ đạo (Primary):** Xanh ngọc/Emerald Green (khoảng `#10b981` hoặc `emerald-500` trong Tailwind). Được sử dụng cho các Call-to-Action (CTA) chính, badge, icon và các điểm nhấn quan trọng.
- **Màu nền (Backgrounds):**
  - Trắng tinh (White): Dành cho các thẻ (cards), header, và khu vực nội dung cần làm nổi bật văn bản.
  - Xanh lá nhạt (Light Green Tint - e.g., `#f0fdf4` / `green-50`): Dùng làm màu nền xen kẽ cho các section (như Hero section, Features section), tạo phân tầng thị giác (Visual Hierarchy) rõ ràng mà không bị gắt.
  - Xanh đen đậm (Dark Slate - e.g., `#0f172a` / `slate-900`): Dùng cho dải phân cách số liệu (Stats strip) và khối giả lập AI (Simulator), tạo độ tương phản cực mạnh, thu hút sự chú ý.
- **Màu văn bản (Text Colors):** 
  - Tiêu đề: Đen xám đậm (Slate-800 hoặc Gray-900).
  - Văn bản phụ (Body text): Xám nhạt hơn (Gray-500 hoặc Gray-600) để giảm mỏi mắt.

## 2. Nghệ thuật Chữ (Typography)
- **Font chữ:** Sử dụng font Sans-serif hiện đại, gọn gàng (có thể là Inter, Roboto hoặc SF Pro Display), tối ưu tốt cho việc hiển thị trên đa thiết bị.
- **Phân cấp (Hierarchy):**
  - **H1 (Hero Heading):** Kích thước lớn, nét đậm (Bold/Extrabold), line-height hẹp để tạo sự chặt chẽ. Có sử dụng kĩ thuật bôi màu text (text-emerald-500) ở cụm từ "bằng AI giọng nói".
  - **H2 (Section Headings):** Kích thước vừa phải, căn giữa, thường đi kèm một "Kicker" (text nhỏ màu xanh viết hoa ở trên) để định hướng nội dung.
  - **Body Text:** Kích thước tiêu chuẩn (khoảng 16px), line-height thoáng (khoảng 1.5 - 1.6) giúp dễ đọc các đoạn mô tả dài.

## 3. Cấu trúc Layout & Grid System
- **Container:** Thiết kế theo dạng Max-width container, nội dung được căn giữa màn hình (thường là `max-w-7xl` kết hợp `mx-auto`).
- **Khoảng trắng (Whitespace/Padding):** Padding giữa các section lớn (khoảng `py-20` hoặc `py-24`), tạo cảm giác "thở" cho trang web, không bị nhồi nhét thông tin.
- **Lưới (Grid):** Sử dụng hệ thống CSS Grid linh hoạt:
  - 3 cột cho phần Pain points (Thực trạng) và Testimonials (Đánh giá).
  - 2 hoặc 3 cột cho Pricing (Bảng giá).
  - Bố cục Split (50-50) ở Hero Section (Trái: Nội dung, Phải: Mockup).
  - 4 cột cho dải số liệu (Stats).

## 4. Ngôn ngữ Thiết kế Component (Component Architecture)
Giao diện có thể được bóc tách thành các UI Components độc lập, tuân thủ nguyên tắc thiết kế Atomic:

### 4.1. Cards (Thẻ nội dung)
- **Kiểu dáng:** Nền trắng, bo góc lớn (Large Border Radius - `rounded-2xl` hoặc `rounded-3xl`), sử dụng bóng đổ mềm (Soft Drop Shadow - `shadow-sm` hoặc `shadow-md`), viền mỏng nhẹ (`border border-gray-100`).
- **Trạng thái:** Các card Pricing có sự phân biệt rõ ràng. Card "Premium" được làm nổi bật (Highlight) với viền vàng và nhãn "Phổ biến nhất", áp dụng hiệu ứng nổi cao hơn.

### 4.2. Buttons (Nút bấm)
- **Primary Button:** Nền xanh ngọc, text trắng, bo góc tròn (Pill shape - `rounded-full`). Thường có icon đi kèm.
- **Secondary Button:** Dạng viền (Outline) hoặc nền trắng có viền xám nhạt (`bg-white border border-gray-200`), text đen. Nổi bật như nút "Đăng nhập hệ thống".

### 4.3. Interactive Widgets (Thành phần tương tác)
- **AI Simulator (Khối thử nghiệm AI):** Được thiết kế giống một cửa sổ Terminal/IDE của developer (Mac-style window controls ở góc trái). Sử dụng dark mode bên trong khối này để làm nổi bật các tag màu sắc bóc tách thực thể (Hành động, Tên sản phẩm, Hạn sử dụng).
- **ROI Calculator (Bộ tính toán tiết kiệm):** UI dạng Range Slider tùy chỉnh thanh trượt, kết hợp một bảng kết quả (Result Board) màu tối, dùng chữ nổi màu đỏ (lãng phí) và xanh (tiết kiệm) để tác động mạnh vào tâm lý người dùng.

## 5. Đánh giá tổng quan
Phong cách thiết kế của HomeMind tuân theo chuẩn mực của một SaaS Landing Page hiện đại: Clean, Trustworthy (Đáng tin cậy) và Conversion-focused (Tập trung vào chuyển đổi). Việc sử dụng xen kẽ các khối nền sáng/tối và các công cụ tương tác trực tiếp (Simulator, Calculator) giúp giữ chân người dùng lâu hơn và minh họa tính năng một cách trực quan thay vì chỉ dùng văn bản dài dòng.
