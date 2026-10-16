"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeading, Loading, Failure } from "@/components/admin/feedback";
import { Confirmation } from "@/components/admin/confirmation";
import { requestIapAdmin } from "@/lib/admin-api/client";
import { buildUrl } from "@/lib/admin-api/validation";
import { withAdminCsrf } from "@/lib/auth/admin-session";
import type { Schema } from "@/lib/admin-api/schema";

const listSchema: Schema = { type: "object", required: ["items"], properties: { items: { type: "array", items: { type: "object" } } } };
const objectSchema: Schema = { type: "object" };
const reportSchema: Schema = { type: "object", required: ["definition", "groups", "creditUnits", "recovery", "netProceeds"], properties: {
  definition: { enum: ["iap-recorded-gross-v1"] }, groups: { type: "array", items: { type: "object" } },
  creditUnits: objectSchema, recovery: objectSchema, netProceeds: { enum: [null] },
} };
type Row = Record<string, unknown>;
const url = (path: string) => new URL(`/v1/admin/iap/${path}`, new URL(buildUrl("adminMe")).origin).href;
const text = (value: unknown) => value === null || value === undefined ? "Chưa có nguồn" : String(value);
export function milliunits(value: unknown) {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) return "Chưa có nguồn";
  const n = BigInt(value), sign = n < 0 ? "-" : "", a = n < 0 ? -n : n;
  return sign + (a / BigInt(1000)).toString() + "." + (a % BigInt(1000)).toString().padStart(3, "0");
}

export default function IapManagement() {
  const [report, setReport] = useState<Row>();
  const [cases, setCases] = useState<Row[]>([]), [intake, setIntake] = useState<Row[]>([]);
  const [caseOffset, setCaseOffset] = useState(0), [intakeOffset, setIntakeOffset] = useState(0);
  const [error, setError] = useState<Error>(), [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<{ row: Row; intake: boolean }>();
  const [action, setAction] = useState("RECHECK"), [rationale, setRationale] = useState("");
  const [confirmation, setConfirmation] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [detail, setDetail] = useState<Row>();
  const [window] = useState(() => ({ from: new Date(Date.now()-30*86400000).toISOString(), to: new Date().toISOString() }));
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);setError(undefined);
    try {
      const [r, c, i] = await Promise.all([
        requestIapAdmin<Row>(url(`report?from=${encodeURIComponent(window.from)}&to=${encodeURIComponent(window.to)}`), "GET", reportSchema, { signal }),
        requestIapAdmin<{ items: Row[] }>(url(`cases?offset=${caseOffset}`), "GET", listSchema, { signal }),
        requestIapAdmin<{ items: Row[] }>(url(`intake?offset=${intakeOffset}`), "GET", listSchema, { signal }),
      ]);
      if (signal?.aborted) return;
      setReport(r.data);setCases(c.data.items);setIntake(i.data.items);
    } catch (e) { if (!signal?.aborted) setError(e as Error); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [window, caseOffset, intakeOffset]);
  useEffect(() => { const c = new AbortController();void Promise.resolve().then(()=>{ if (!c.signal.aborted) return load(c.signal); });return () => c.abort(); }, [load]);
  async function submit() {
    if (!selection || rationale.trim().length < 10) return;
    setBusy(true);setError(undefined);
    try {
      const path = selection.intake ? `intake/${selection.row.id}/retry` : `cases/${selection.row.id}/actions`;
      await withAdminCsrf(csrf => requestIapAdmin(url(path), "POST", objectSchema, { csrf, body: {
        requestId: crypto.randomUUID(), expectedVersion: selection.row.version, rationale: rationale.trim(),
        ...(selection.intake ? {} : { action }),
      } }));
      setMessage("Đã lưu quyết định để đối soát. Chưa xác nhận Store hoàn tiền hay thao tác tài chính nào.");
      setSelection(undefined);setRationale("");await load();
    } catch (e) { setError(e as Error); }
    finally { setBusy(false);setConfirmation(false); }
  }
  const groups = (report?.groups as Row[] | undefined) ?? [];
  return <>
    <PageHeading title="Store và đối soát" description="Sổ giao dịch đã xác minh, quyền sử dụng và nghĩa vụ tài chính là các trạng thái độc lập. Checkout vẫn khóa." />
    <p>Thời gian giao dịch UTC [{window.from}, {window.to}). Legacy ở mục Thanh toán cũ; không cộng với số liệu Store.</p>
    <button className="hm-button" disabled={loading} onClick={() => void load()}>Tải lại</button>
    {loading && <Loading />}{error && <Failure error={error} retry={() => void load()} />}{message && <p role="status">{message}</p>}
    <section className="hm-panel"><h2>Gross đã ghi nhận theo Store / môi trường / tiền tệ</h2>
      <p>Chỉ tiền có nguồn; phí, thuế, settlement và net proceeds chưa có nguồn. Không quy đổi khác tiền tệ, không suy tiền từ Credit thu hồi.</p>
      <div style={{overflowX:"auto"}}><table><thead><tr>{["Store","Môi trường","Tiền tệ","Loại","Giao dịch","Gia hạn","Gross đã biết","Chưa biết giá","Chồng quyền"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{groups.map((g,n)=><tr key={n}><td>{text(g.store)}</td><td>{text(g.environment)}</td><td>{text(g.currency)}</td><td>{text(g.kind)}</td><td>{text(g.transactions)}</td><td>{text(g.renewals)}</td><td>{milliunits(g.recordedGrossMilliunits)}</td><td>{text(g.unknownAmountCount)}</td><td>{text(g.conflictedTransactions)}</td></tr>)}</tbody></table></div>
      {groups.length===0 && <p>Chưa có giao dịch Store trong khoảng thời gian này.</p>}
      <h3>Financial observations và điều chỉnh</h3><pre>{JSON.stringify(report?.adjustments ?? [],null,2)}</pre>
      <p>Đây là observations có provenance; không phải tổng refund tiền khi amount còn null. Reversal là event riêng.</p>
      <h3>Credit units hiện tại, không phải tiền</h3><pre>{JSON.stringify(report?.creditUnits ?? {},null,2)}</pre>
      <h3>Anomalies theo nguồn tài trợ</h3><pre>{JSON.stringify(report?.funding ?? {},null,2)}</pre>
      <h3>Recovery và nghĩa vụ chưa giải quyết</h3><pre>{JSON.stringify(report?.recovery ?? {},null,2)}</pre>
    </section>
    {[{ title:"Cases đã xác minh", rows:cases, offset:caseOffset, set:setCaseOffset, intake:false }, { title:"Receipt intake chưa hoàn tất — actor chỉ là claim", rows:intake, offset:intakeOffset, set:setIntakeOffset, intake:true }].map(group=><section className="hm-panel" key={group.title}>
      <h2>{group.title}</h2><p>Trang {group.offset/50+1}; mỗi trang tối đa 50. Dữ liệu có thể thay đổi trong khi phân trang.</p>
      {group.rows.map(row=><article key={String(row.id)}><p>{text(row.id)} · {text(row.state)} · {text(row.reason ?? row.last_error)} · financial {text(row.financial_status)}</p>
        <button className="hm-button hm-secondary" onClick={() => {setSelection({row,intake:group.intake});setDetail(undefined);setMessage("");}}>Xem và xử lý</button>
        {!group.intake && <button className="hm-button hm-secondary" onClick={() => void requestIapAdmin<Row>(url(`cases/${row.id}`),"GET",listSchema).then(r=>setDetail(r.data)).catch(setError)}>Lịch sử quyết định</button>}
      </article>)}
      <button disabled={group.offset===0||loading} onClick={()=>group.set(Math.max(0,group.offset-50))}>Trang trước</button>
      <button disabled={group.rows.length<50||loading} onClick={()=>group.set(group.offset+50)}>Trang sau</button>
    </section>)}
    {detail && <section className="hm-panel"><h2>Audit trail</h2><pre>{JSON.stringify(detail,null,2)}</pre></section>}
    {selection && <section className="hm-panel"><h2>Quyết định đối soát</h2><p>{text(selection.row.id)} · revision {text(selection.row.version)}</p>
      <p>Không set primary/mark paid, không gửi refund/revoke/consume. Operator phải xử lý provider riêng theo runbook; máy chủ chỉ re-verify facts mới.</p>
      {!selection.intake && <label>Thao tác<select value={action} onChange={e=>setAction(e.target.value)}><option value="RECHECK">Đối soát lại</option><option value="ESCALATE">Chuyển cấp hỗ trợ</option><option value="REQUEST_PROVIDER_REVIEW">Cần operator xử lý với Store</option></select></label>}
      <label>Lý do (10–1000 ký tự)<textarea minLength={10} maxLength={1000} value={rationale} onChange={e=>setRationale(e.target.value)} /></label>
      <button className="hm-button" disabled={busy||rationale.trim().length<10} onClick={()=>setConfirmation(true)}>Lưu quyết định</button>
      <button onClick={()=>setSelection(undefined)}>Đóng</button>
    </section>}
    {confirmation && <Confirmation title="Lưu quyết định đối soát?" description="Quyết định được kiểm tra revision và lưu audit. Không khẳng định đã hoàn tiền ở Store." busy={busy} onCancel={()=>setConfirmation(false)} onConfirm={()=>void submit()} />}
  </>;
}
