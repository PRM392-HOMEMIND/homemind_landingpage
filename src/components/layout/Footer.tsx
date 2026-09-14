import Link from "next/link";
import Brand from "../common/Brand";

import { siteConfig } from "@/config/site";
import Container from "../common/Container";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50 py-12 relative overflow-hidden">
      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
          {/* Logo & Info column */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Brand footer />
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm font-medium">
              Đừng để thực phẩm & đồ dùng gia đình bị lãng phí âm thầm. Giải pháp quản lý thông minh bằng AI giọng nói tiếng Việt, tự động nhắc hạn và chia sẻ gia đình.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-4 mt-2">
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  tabIndex={0}
                  aria-label="Gửi email hỗ trợ HomeMind"
                  title={siteConfig.supportEmail}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-primary-dark flex items-center justify-center hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="#4285F4" d="M1 6.5 5 9.5V20H2.5A1.5 1.5 0 0 1 1 18.5Z" />
                    <path fill="#34A853" d="m19 9.5 4-3v12a1.5 1.5 0 0 1-1.5 1.5H19Z" />
                    <path fill="#EA4335" d="m5 9.5 7 5.25L19 9.5v-5L12 9.75 5 4.5Z" />
                    <path fill="#FBBC04" d="M19 4.5 20.6 3.3A1.5 1.5 0 0 1 23 4.5v2l-4 3Z" />
                    <path fill="#C5221F" d="M1 4.5a1.5 1.5 0 0 1 2.4-1.2L5 4.5v5l-4-3Z" />
                  </svg>
                </a>
                <a
                  href={siteConfig.links.facebook}
                  tabIndex={0}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="HomeMind Facebook"
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-primary-dark flex items-center justify-center hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
                >
                  {/* Lucide has no brand icons; reuse the existing SVG approach. */}
                  <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.24 0-1.63.78-1.63 1.57v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
                  </svg>
                </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <span>&copy; {new Date().getFullYear()} HomeMind. Bản quyền được bảo lưu.</span>
          <nav aria-label="Thông tin pháp lý" className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/privacy-policy" tabIndex={0} className="rounded-sm py-1 text-slate-600 hover:text-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
              Chính sách bảo mật
            </Link>
            <Link href="/terms-of-service" tabIndex={0} className="rounded-sm py-1 text-slate-600 hover:text-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
              Điều khoản sử dụng
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
