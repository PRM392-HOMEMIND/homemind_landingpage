"use client";

export default function LegalContents({ sections }: { sections: { id: string; title: string }[] }) {
  return (
    // Keep native fragment navigation and scroll margins on long legal pages.
    // The global scroll handler can use an outdated position after touch/focus scrolling.
    <nav aria-label="Mục lục" onClickCapture={(event) => event.stopPropagation()} className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 text-lg font-bold text-slate-800 sm:text-xl">Nội dung chính</h2>
      <ol className="grid gap-x-10 gap-y-2 md:grid-cols-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="inline-flex gap-2 rounded-lg py-1 text-sm leading-6 text-emerald-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 sm:text-base">
              <span className="min-w-5 font-semibold text-emerald-700">{index + 1}.</span>
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
