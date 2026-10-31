import Container from "@/components/common/Container";
import LegalContents from "@/components/legal/LegalContents";
import { siteConfig } from "@/config/site";
import styles from "./legal-document.module.css";

export const policyDate = "2026-10-28";
export const legalContentVersion = "2026.10.28.1";

export function PrivacyContact() {
  return (
    <>
      <a href={`mailto:${siteConfig.supportEmail}`} className="break-words font-semibold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:decoration-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
        {siteConfig.supportEmail}
      </a>
      {" hoặc "}
      <a href={siteConfig.links.facebook} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:decoration-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
        Facebook chính thức của HomeMind
      </a>
    </>
  );
}

export interface LegalSection { id: string; title: string; content: React.ReactNode }

export default function LegalDocument({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <article aria-labelledby="policy-title" className={styles.document}>
      <div className="grid-pattern-light bg-[#f0fdf4]/50 pb-12 pt-32 sm:pb-16">
        <Container>
          <div className="max-w-5xl">
            <h1 id="policy-title" className="text-balance text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-4 text-xs font-bold tracking-widest text-emerald-700">THÔNG TIN PHÁP LÝ · HOMEMIND</p>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{intro}</p>
            <dl aria-label="Phiên bản nội dung pháp lý" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm leading-6 text-slate-600">
              <div><dt className="inline font-semibold">Ngày hiệu lực: </dt><dd className="inline"><time dateTime={policyDate}>28/10/2026</time></dd></div>
              <div><dt className="inline font-semibold">Cập nhật lần cuối: </dt><dd className="inline"><time dateTime="2026-10-28">28/10/2026</time></dd></div>
              <div><dt className="inline font-semibold">Phiên bản: </dt><dd className="inline">{legalContentVersion}</dd></div>
            </dl>
          </div>
        </Container>
      </div>
      <Container className="py-12 sm:py-16 lg:py-20">
        <LegalContents sections={sections.map(({ id, title }) => ({ id, title }))} />
        <div className="mt-12 max-w-3xl space-y-10 sm:mt-16 sm:space-y-12">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id} className="scroll-mt-24">
              <h2 className="mb-4 text-xl font-bold leading-7 text-slate-800 sm:text-2xl sm:leading-8"><span className="text-emerald-700">{index + 1}.</span> {section.title}</h2>
              <div className="space-y-4 text-base leading-7 text-slate-600 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-slate-700">{section.content}</div>
            </section>
          ))}
        </div>
      </Container>
    </article>
  );
}
