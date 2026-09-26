import { SiteConfig, FeatureItem, MetricItem, TestimonialItem } from "../types";

export const siteConfig: SiteConfig = {
  name: "HomeMind",
  tagline: "Smart Pantry, Fresh Life",
  supportEmail: "homemind.support@gmail.com",
  title: "HomeMind — Smart Pantry, Fresh Life",
  description: "Đừng để thực phẩm & đồ dùng trong nhà bị lãng phí âm thầm. HomeMind giúp bạn nhớ mọi thứ: từ thức ăn, mỹ phẩm, thuốc đến gia vị. Tự động cảnh báo hạn dùng và lập danh sách đi chợ — chỉ bằng 1 câu nói.",
  url: "https://homemind.vn",
  ogImage: "https://homemind.vn/og-image.png",
  keywords: [
    "Quản lý tủ đồ gia đình bằng AI",
    "HomeMind voice AI",
    "Cảnh báo hạn sử dụng thực phẩm",
    "Lập danh sách đi chợ tự động",
    "Quản lý thực phẩm thông minh",
    "Tiết kiệm chi tiêu gia đình",
    "Micro-POS tạp hóa nhỏ"
  ],
  links: {
    facebook: "https://www.facebook.com/profile.php?id=61593227567051"
  }
};

export const bentoFeatures: FeatureItem[] = [
  {
    title: "Nhập giọng nói 3 giây",
    description: "Nói tự nhiên như trò chuyện hàng ngày. AI tự động tách tên món, số lượng, danh mục và ngày hết hạn chỉ trong chớp mắt.",
    icon: "Mic",
    tag: "AI Voice Việt",
    colSpan: "md:col-span-1"
  },
  {
    title: "Nhắc nhở hạn dùng thông minh",
    description: "Tự động gửi thông báo trước từ 1-3 ngày khi đồ ăn, sữa hay thuốc tây sắp hết hạn sử dụng, ngăn chặn việc vứt bỏ lãng phí âm thầm.",
    icon: "BellRing",
    tag: "Chống Lãng Phí",
    colSpan: "md:col-span-2"
  },
  {
    title: "Tự động lập danh sách đi chợ",
    description: "Khi phát hiện một món đồ dùng hết trong nhà, HomeMind sẽ tự động gom món đó vào danh sách cần mua tiếp theo để bạn đi siêu thị tiện lợi nhất.",
    icon: "ClipboardList",
    tag: "Tự Động Hóa",
    colSpan: "md:col-span-2"
  },
  {
    title: "Chia sẻ tủ đồ Family",
    description: "Kết nối tối đa 5 thành viên trong gia đình. Vợ đi chợ mua xong tích chọn, dữ liệu tủ đồ và danh sách ở nhà của chồng/con tự động đồng bộ tức thì.",
    icon: "Users",
    tag: "Đồng Bộ Realtime",
    colSpan: "md:col-span-1"
  },
  {
    title: "Tra cứu từ xa tránh mua trùng",
    description: "Dễ dàng mở ứng dụng kiểm tra nhanh tủ lạnh ở nhà khi đang đứng phân vân ở quầy siêu thị. Biết chính xác món nào đang còn, món nào đã hết sạch.",
    icon: "SearchCode",
    tag: "Tiện Ích Từ Xa",
    colSpan: "md:col-span-1"
  },
  {
    title: "Hỗ trợ Micro-POS Cửa hàng",
    description: "Tính năng quản lý mở rộng chuyên biệt cho các tiệm tạp hóa, cửa hàng thực phẩm nhỏ lẻ để theo dõi tồn kho, cảnh báo cận hạn và quản lý dòng tiền.",
    icon: "Store",
    tag: "Dành Cho B2B",
    colSpan: "md:col-span-2"
  }
];

export const metrics: MetricItem[] = [
  {
    label: "Độ chính xác AI Voice giọng Việt",
    value: 98.6,
    suffix: "%"
  },
  {
    label: "Tiết kiệm trung bình/hộ/tháng",
    value: 123000,
    prefix: "",
    suffix: "đ+"
  },
  {
    label: "Thao tác nhập bằng giọng nói",
    value: 3,
    suffix: " Giây"
  },
  {
    label: "Thành viên gia đình đồng bộ",
    value: 5,
    suffix: " Người"
  }
];

export const testimonials: TestimonialItem[] = [
  {
    name: "Chị Nguyễn Thanh Hằng",
    role: "Nội trợ tại Q.3, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    content: "Từ ngày dùng HomeMind, nhà mình không còn tình trạng vứt đi hũ sốt hay hộp sữa tươi quá hạn nữa. Cực kỳ thích tính năng nói 1 câu là xong!"
  },
  {
    name: "Anh Trần Hoàng Nam",
    role: "Kỹ sư phần mềm & Bố 2 con",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
    content: "Vợ chồng mình dùng gói Family 59k. Đi siêu thị cứ mở app ra xem tủ lạnh ở nhà còn gì, hết gì. Tiết kiệm phải được cả triệu tiền mua dư mỗi tháng."
  },
  {
    name: "Cô Bùi Thu Thảo",
    role: "Chủ tiệm Tạp Hóa Cô Thảo - Đà Nẵng",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    content: "Gói Micro-POS 149k rất hợp lý cho tiệm nhỏ của tôi. Quét voice nhập hàng nhanh, cảnh báo đồ bánh kẹo cận ngày hết hạn rất chuẩn xác!"
  }
];
