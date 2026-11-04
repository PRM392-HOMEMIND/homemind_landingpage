"use client";

import React, { useState } from "react";

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<"vi" | "en">("vi");

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 p-0.5 text-xs shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setCurrentLang("vi")}
        className={`rounded-full px-2.5 py-1 font-medium transition-all ${
          currentLang === "vi"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
        aria-label="Tiếng Việt"
      >
        🇻🇳 VN
      </button>
      <button
        type="button"
        onClick={() => setCurrentLang("en")}
        className={`rounded-full px-2.5 py-1 font-medium transition-all ${
          currentLang === "en"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
