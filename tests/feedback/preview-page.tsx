"use client";

// Mounted ONLY by the H: test workspace. Never copied into src/app in the FE repo.
import { useEffect, useRef, useState } from "react";
import { FeedbackExperience } from "../../src/features/feedback/FeedbackExperience";
import { FeedbackPopup } from "../../src/features/feedback/FeedbackPopup";
import ThemeButton from "../../src/components/common/ThemeButton";
import { FeedbackSession } from "../../src/features/feedback/session";
import { FeedbackSubmissionError, type FeedbackAdapter } from "../../src/features/feedback/adapter";

type SyntheticDraft = { fixtureText: string };
const modes = ["normal", "checking", "pending", "rejected", "network", "timeout", "malformed-success", "disabled", "malformed-config", "config-error", "config-loading", "long", "no-actions"];

class PreviewAdapter implements FeedbackAdapter<SyntheticDraft> {
  private scenario = "normal";
  private reads = 0;
  constructor(private countOperation: () => void) {}
  setScenario(value: string) { this.scenario = value; this.reads = 0; }
  async loadCampaign(): Promise<"enabled" | "disabled"> {
    this.reads++;
    if (this.scenario === "checking" && this.reads > 1) return new Promise(resolve => document.addEventListener("fixture-config", () => resolve("enabled"), { once: true }));
    if (this.scenario === "disabled") return "disabled";
    if (this.scenario === "malformed-config") return { enabled: true } as unknown as "enabled";
    if (this.scenario === "config-error") throw new Error("synthetic config error");
    if (this.scenario === "config-loading") return new Promise(() => {});
    return "enabled";
  }
  async submit(): Promise<"submitted"> {
    this.countOperation();
    if (this.scenario === "rejected") throw new FeedbackSubmissionError();
    if (this.scenario === "network") throw new Error('<img src=x onerror="alert(1)">' + "x".repeat(10_000));
    if (this.scenario === "malformed-success") return { success: true } as unknown as "submitted";
    // Presentation fixture for an unknown timeout outcome. Real client timer,
    // cancellation and late-result races are tested in session.unit.spec.ts.
    if (this.scenario === "timeout") throw new Error("Synthetic timeout: outcome unknown");
    if (this.scenario === "pending") return new Promise(resolve => document.addEventListener("fixture-receipt", () => resolve("submitted"), { once: true }));
    return "submitted";
  }
}

export default function FeedbackPreviewPage() {
  const mounted = useRef(false);
  const [text, setText] = useState("");
  const [calls, setCalls] = useState(0);
  const [show, setShow] = useState(true);
  const [scenario, setScenario] = useState("normal");
  const [shellOpen, setShellOpen] = useState(false);
  const [adapter] = useState(() => new PreviewAdapter(() => setCalls(value => value + 1)));
  // Pending is manually completed by the test, independent of browser speed.
  const [session] = useState(() => new FeedbackSession(adapter, 120_000));

  useEffect(() => {
    mounted.current = true;
    void session.refreshCampaign();
    return () => {
      mounted.current = false;
      queueMicrotask(() => { if (!mounted.current) session.dispose(); });
    };
  }, [session]);

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg sm:left-auto sm:max-w-md" aria-label="Điều khiển bản xem thử">
      <p className="mb-3 text-sm font-bold text-slate-800">BẢN XEM THỬ — dữ liệu mô phỏng, không gọi API</p>
      <label className="block text-sm text-slate-700" htmlFor="fixture-mode">Kịch bản mô phỏng</label>
      <select id="fixture-mode" value={scenario} className="mb-3 w-full rounded-lg border border-slate-300 p-2" onChange={event => { adapter.setScenario(event.target.value); setScenario(event.target.value); }}>
        {modes.map(value => <option key={value}>{value}</option>)}
      </select>
      <button className="mr-3 rounded-lg border p-2" type="button" onClick={() => void session.refreshCampaign()}>Tải config mô phỏng</button>
      <button className="rounded-lg border p-2" type="button" onClick={() => { session.dispose(); setShow(false); }}>Unmount mô phỏng</button>
      <output className="my-3 block" data-testid="fixture-calls">{calls}</output>
      {show && scenario === "no-actions" && <>
        <ThemeButton type="button" onClick={() => setShellOpen(true)}>Góp ý và tìm hiểu quà Premium 30 ngày (fixture khung)</ThemeButton>
        <FeedbackPopup open={shellOpen} onRequestClose={() => setShellOpen(false)}>
          <p>BẢN XEM THỬ: khung presentation chưa có form hoặc action slot.</p>
        </FeedbackPopup>
      </>}
      {show && scenario !== "no-actions" && <FeedbackExperience session={session} onSubmit={() => void session.submit({ fixtureText: text })}>
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">BẢN XEM THỬ: dữ liệu và kết quả dưới đây là mô phỏng, chưa tích hợp backend.</p>
        <form onSubmit={event => { event.preventDefault(); void session.submit({ fixtureText: text }); }}>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="fixture-draft">Nội dung mô phỏng (không phải DTO)</label>
          <textarea id="fixture-draft" className="w-full rounded-xl border border-slate-300 p-3 text-base outline-emerald-700" rows={3} value={text} onChange={event => setText(event.target.value)} />
          <output data-testid="fixture-draft-preview" className="block text-sm text-slate-600">{text}</output>
          <button className="sr-only" type="submit">Gửi fixture bằng Enter</button>
        </form>
        {scenario === "long" && <p className="mt-3 text-sm text-slate-700">{"Nội dung kiểm thử dài với tiếng Việt và ký tự đặc biệt &<>. ".repeat(60)}</p>}
      </FeedbackExperience>}
    </aside>
  );
}
