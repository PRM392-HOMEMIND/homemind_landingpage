import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/common/Container";
import { bentoFeatures, siteConfig } from "@/config/site";
import { APP_STORE_URL } from "@/config/app-links";

const title = "Giới thiệu HomeMind";
const description = "Tìm hiểu HomeMind: quản lý thực phẩm và đồ dùng gia đình bằng AI giọng nói, nhắc hạn dùng, danh sách mua sắm và đội ngũ phát triển.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/gioi-thieu" },
  openGraph: { title: `${title} | HomeMind`, description, url: "/gioi-thieu", type: "website", locale: "vi_VN" },
  twitter: { title: `${title} | HomeMind`, description },
};

const problems = [
  {
    title: "Quên hạn dùng",
    problem: "Thực phẩm và đồ dùng dễ bị bỏ quên trong tủ, đến khi cần mới nhận ra đã quá hạn.",
    solution: "Theo dõi hạn sử dụng và nhận nhắc nhở để chủ động kiểm tra, sử dụng đồ trong nhà.",
  },
  {
    title: "Mua trùng, thiếu món cần thiết",
    problem: "Khi đi mua sắm, bạn khó nhớ chính xác món nào còn và món nào đã hết ở nhà.",
    solution: "Tra cứu tủ đồ từ xa và dùng danh sách mua sắm để chuẩn bị những món cần bổ sung.",
  },
  {
    title: "Ghi chép rời rạc",
    problem: "Nhập liệu thủ công mất thời gian; các thành viên có thể giữ những danh sách khác nhau.",
    solution: "Nhập thông tin bằng giọng nói tiếng Việt và chia sẻ tủ đồ trong không gian gia đình.",
  },
];

const featureSummaries = [
  "Nói tự nhiên để AI hỗ trợ tách tên món, số lượng, danh mục và hạn sử dụng.",
  "Theo dõi những món sắp hết hạn và nhận thông báo trong ứng dụng.",
  "Gom những món cần bổ sung vào danh sách mua sắm của bạn.",
  "Cùng thành viên gia đình theo dõi tủ đồ và danh sách mua sắm.",
  "Kiểm tra đồ đang còn trong nhà ngay khi đang đi mua sắm.",
  "Hỗ trợ cửa hàng nhỏ theo dõi tồn kho và các món cận hạn.",
];

const team = [
  { name: "Vũ Minh Quang", role: "Trưởng nhóm · Phát triển sản phẩm" },
  { name: "Lê Phạm Hoài Bảo", role: "Phát triển sản phẩm" },
  { name: "Phạm Thị Ánh", role: "Phát triển sản phẩm" },
  { name: "Nguyễn Minh Thành", role: "Phát triển sản phẩm" },
  { name: "Trương Đinh Hồng Nhung", role: "Marketing" },
  { name: "Thái Hải Yến", role: "Marketing" },
];

const linkStyle = "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600";

export default function AboutHomeMind() {
  return (
    <article aria-labelledby="about-title">
      <div className="grid-pattern-light bg-[#f0fdf4]/50 pb-12 pt-32 sm:pb-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold tracking-widest text-emerald-700">SMART PANTRY, FRESH LIFE</p>
            <h1 id="about-title" className="text-balance text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">Về HomeMind</h1>
            <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              HomeMind giúp hộ gia đình quản lý thực phẩm, đồ dùng, hạn sử dụng và danh sách mua sắm trong một nơi. AI giọng nói tiếng Việt hỗ trợ việc nhập liệu, để bạn dễ theo dõi những gì đang có trong nhà và chủ động hơn khi mua sắm.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Từ căn bếp gia đình đến cửa hàng nhỏ, HomeMind hướng tới việc giảm bỏ quên đồ dùng, hạn chế mua trùng và phối hợp thuận tiện hơn trong sinh hoạt hằng ngày.
            </p>
          </div>
        </Container>
      </div>

      <Container className="space-y-12 py-12 sm:space-y-16 sm:py-16 lg:space-y-20 lg:py-20">
        <section aria-labelledby="about-solutions">
          <h2 id="about-solutions" className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Những việc nhỏ, bớt phải lo</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">HomeMind kết nối những công việc quen thuộc, từ sắp xếp tủ đồ đến chuẩn bị cho lần đi chợ tiếp theo.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {problems.map(({ title: problemTitle, problem, solution }) => (
              <section key={problemTitle} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-slate-800">{problemTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{problem}</p>
                <p className="mt-4 text-sm font-medium leading-6 text-emerald-800">{solution}</p>
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="about-features">
          <h2 id="about-features" className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Các tính năng chính</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Khả năng sử dụng cụ thể phụ thuộc vào gói, quyền tài khoản và phiên bản ứng dụng.</p>
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bentoFeatures.map((feature, index) => (
              <li key={feature.title} className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-slate-800">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{featureSummaries[index]}</p>
              </li>
            ))}
          </ul>
          <Link href="/#features" className="mt-6 inline-flex rounded-sm py-2 text-sm font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">Xem tính năng trên trang chủ</Link>
        </section>

        <section aria-labelledby="about-team" className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="about-team" className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Đội ngũ phát triển HomeMind</h2>
            <span className="text-sm font-semibold text-emerald-700">6 thành viên</span>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">HomeMind là sản phẩm được phát triển bởi một nhóm sinh viên đến từ Trường Đại học FPT, TP. Hồ Chí Minh. Nhóm gồm 4 thành viên phụ trách phát triển sản phẩm và 2 thành viên phụ trách Marketing, cùng phối hợp xây dựng và từng bước hoàn thiện HomeMind.</p>
          <ol aria-label="Thành viên HomeMind" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {team.map(({ name, role }) => (
              <li key={name} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-base font-bold leading-6 text-slate-800">{name}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{role}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="about-start" className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
          <h2 id="about-start" className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Bắt đầu cùng HomeMind</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Đăng ký trong ứng dụng HomeMind. Bạn có thể xem hướng dẫn tài khoản, tải HomeMind từ App Store hoặc liên hệ nhóm để được hỗ trợ.</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div>
              <Link href="/terms-of-service#tai-khoan" aria-describedby="about-register-purpose" className={`${linkStyle} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}>Đăng ký</Link>
              <p id="about-register-purpose" className="mt-3 text-sm leading-6 text-slate-600">Xem hướng dẫn tài khoản; việc đăng ký được thực hiện trong ứng dụng.</p>
            </div>
            <div>
              <a href={`mailto:${siteConfig.supportEmail}`} aria-describedby="about-contact-purpose" className={`${linkStyle} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}>Liên hệ</a>
              <p id="about-contact-purpose" className="mt-3 break-words text-sm leading-6 text-slate-600">Gửi email hỗ trợ đến {siteConfig.supportEmail}.</p>
            </div>
            <div>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-describedby="about-free-purpose" className={`${linkStyle} bg-emerald-700 text-white shadow-sm hover:bg-emerald-800`}>Dùng thử miễn phí</a>
              <p id="about-free-purpose" className="mt-3 text-sm leading-6 text-slate-600">Mở trang HomeMind trên App Store trong tab mới; đăng ký và sử dụng trong ứng dụng.</p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-600">Phiên bản trên CH Play đang được phát triển; liên kết sẽ được cập nhật sau. Bạn có thể <Link href="/#pricing" className="rounded-sm font-semibold text-emerald-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">xem thông tin gói Free trên trang chủ</Link>.</p>
        </section>
      </Container>
    </article>
  );
}
