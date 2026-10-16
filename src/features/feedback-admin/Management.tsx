"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Confirmation } from "../../components/admin/confirmation";
import { Empty, Failure, Loading, PageHeading, Snapshot } from "../../components/admin/feedback";
import { ApiError } from "../../lib/admin-api/client";
import { withAdminCsrf } from "../../lib/auth/admin-session";
import { date } from "../../lib/formatting/admin";
import { useFeedbackQuery } from "./use-query";
import { filterQuery, pageCounts, readConfig, readDetail, readList, stateLabel, states, updateConfig, type Filters } from "./api";
import styles from "./management.module.css";

function ConfigPanel() {
  const load = useCallback((signal: AbortSignal) => readConfig(signal), []);
  const query = useFeedbackQuery("config", load);
  const [confirmation, setConfirmation] = useState<{ enabled: boolean; revision: number }>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<Error>();
  const flight = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; flight.current?.abort(); }; }, []);
  async function confirm() {
    if (!confirmation || flight.current) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    flight.current = controller;
    setBusy(true); setError(undefined); setMessage("");
    try {
      await withAdminCsrf(token => {
        controller.signal.throwIfAborted();
        return updateConfig(confirmation.enabled, confirmation.revision, token, controller.signal);
      }, controller.signal);
      if (mounted.current) setMessage("Máy chủ đã xác nhận cập nhật cấu hình.");
    } catch (failure) {
      if (mounted.current) {
        if (failure instanceof ApiError && [400, 401, 403, 409, 429].includes(failure.status)) {
          setError(failure);
          if (failure.status === 409 && failure.code === "CONFIG_REVISION_CONFLICT") setMessage("Cấu hình đã thay đổi. Xem dữ liệu mới và xác nhận lại nếu cần.");
        } else setError(new Error("Chưa xác định kết quả cập nhật. Hãy xem lại cấu hình máy chủ trước khi thao tác tiếp."));
      }
    } finally {
      clearTimeout(timeout);
      flight.current = null;
      if (mounted.current) { setBusy(false); setConfirmation(undefined); query.retry(); }
    }
  }
  const config = query.data?.data;
  return <section className="hm-panel" aria-labelledby="campaign-config-heading">
    <h2 id="campaign-config-heading">Campaign Premium 30 ngày</h2>
    <p>Mỗi tài khoản chỉ được nhận quà một lần. Gửi lại góp ý không cấp thêm quà, gia hạn hoặc bắt đầu lại thời gian dùng thử.</p>
    {query.loading && <Loading />}
    {query.error && <Failure error={query.error} retry={query.retry} />}
    {config && <>
      <dl className={styles.facts}>
        <div><dt>Trạng thái</dt><dd><strong>{config.enabled ? "Đang bật" : "Đang tắt"}</strong></dd></div>
        <div><dt>Phiên bản cấu hình</dt><dd>{config.revision}</dd></div>
        <div><dt>Gói dùng thử</dt><dd>HomeMind Premium · 30 ngày (2.592.000 giây)</dd></div>
        <div><dt>Cập nhật</dt><dd>{date(config.updatedAt)}</dd></div>
        <div><dt>Người cập nhật</dt><dd className="hm-id">{config.updatedBy || "Chưa có thông tin"}</dd></div>
      </dl>
      <button className="hm-button hm-primary" disabled={busy} onClick={event => { event.currentTarget.focus({ preventScroll: true }); setError(undefined); setMessage(""); setConfirmation({ enabled: !config.enabled, revision: config.revision }); }}>
        {config.enabled ? "Tắt campaign" : "Bật campaign"}
      </button>
      {config.lastChange && <p className={styles.note}>Thay đổi gần nhất: {config.lastChange.previousEnabled ? "bật" : "tắt"} → {config.lastChange.enabled ? "bật" : "tắt"}, revision {config.lastChange.previousRevision} → {config.lastChange.revision}, {date(config.lastChange.occurredAt)}.</p>}
      <Snapshot meta={query.data!.meta} />
    </>}
    {message && <p role="status" className={styles.note}>{message}</p>}
    {error && <Failure error={error} />}
    {confirmation && <Confirmation title={confirmation.enabled ? "Bật campaign Premium 30 ngày?" : "Tắt campaign Premium 30 ngày?"}
      description={confirmation.enabled ? "Khách truy cập homepage sẽ có thể đăng ký và gửi góp ý. Thay đổi này được máy chủ kiểm tra quyền và ghi nhật ký." : "Homepage sẽ ngừng mời đăng ký mới. Các quà đã cấp không bị thu hồi bởi thao tác này."}
      busy={busy} onCancel={() => setConfirmation(undefined)} onConfirm={() => void confirm()} />}
  </section>;
}
const initialFilters: Filters = { limit: "25", sort: "newest" };
export default function FeedbackManagement() {
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [history, setHistory] = useState<Array<string | undefined>>([undefined]);
  const [filterError, setFilterError] = useState("");
  const cursor = history.at(-1);
  const key = JSON.stringify({ ...filters, cursor });
  const load = useCallback((signal: AbortSignal) => readList(JSON.parse(key), signal), [key]);
  const query = useFeedbackQuery(key, load);
  const list = query.data?.data;
  const counts = list ? pageCounts(list.items) : undefined;
  const change = (field: keyof Filters, value: string) => setDraft(current => ({ ...current, [field]: value }));
  return <>
    <PageHeading title="Phản hồi và quà tặng" description="Quản lý campaign homepage và xem dữ liệu đăng ký, liên kết tài khoản, vòng đời quà từ máy chủ." />
    <ConfigPanel />
    <section className="hm-panel" aria-labelledby="feedback-list-heading">
      <h2 id="feedback-list-heading">Thông tin đăng ký và góp ý</h2>
      <form className={styles.filters} onSubmit={event => {
        event.preventDefault();
        try { filterQuery(draft); setFilters({ ...draft }); setHistory([undefined]); setFilterError(""); query.retry(); }
        catch { setFilterError("Bộ lọc chưa hợp lệ: tìm kiếm tối đa 120 ký tự, mã tài khoản UUID và khoảng UTC tăng dần không quá 366 ngày."); }
      }}>
        <label><span>Tìm tên, email hoặc số điện thoại</span><input value={draft.q || ""} onChange={event => change("q", event.target.value)} autoComplete="off" /></label>
        <label><span>Trạng thái lượt gửi</span><select value={draft.benefitState || ""} onChange={event => change("benefitState", event.target.value)}><option value="">Tất cả</option>{states.map(state => <option key={state} value={state}>{stateLabel(state)}</option>)}</select></label>
        <label><span>Lượt gửi</span><select value={draft.duplicate || ""} onChange={event => change("duplicate", event.target.value)}><option value="">Tất cả</option><option value="false">Không phải lượt gửi lại</option><option value="true">Gửi lại</option></select></label>
        <label><span>Mã tài khoản</span><input value={draft.userId || ""} onChange={event => change("userId", event.target.value)} autoComplete="off" /></label>
        <label><span>Từ thời điểm (UTC)</span><input value={draft.from || ""} onChange={event => change("from", event.target.value)} placeholder="2026-10-01T00:00:00Z" /></label>
        <label><span>Đến thời điểm (UTC, không bao gồm)</span><input value={draft.to || ""} onChange={event => change("to", event.target.value)} placeholder="2026-11-01T00:00:00Z" /></label>
        <label><span>Sắp xếp</span><select value={draft.sort} onChange={event => change("sort", event.target.value)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select></label>
        <label><span>Số bản ghi mỗi trang</span><select value={draft.limit} onChange={event => change("limit", event.target.value)}>{[10, 25, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label>
        <div className={styles.actions}><button className="hm-button hm-primary" type="submit">Áp dụng bộ lọc</button><button className="hm-button hm-secondary" type="button" onClick={() => { setDraft(initialFilters); setFilters(initialFilters); setHistory([undefined]); setFilterError(""); query.retry(); }}>Xóa bộ lọc</button></div>
      </form>
      {filterError && <p role="alert">{filterError}</p>}
      {query.loading && <Loading />}
      {query.error && <Failure error={query.error} retry={query.retry} />}
      {list && <>
        <p className={styles.note}>Trong trang đang xem: {counts!.submissions} lượt gửi hợp lệ · {counts!.repeats} lượt gửi lại · {list.items.every(item => item.lifecycle) ? `${counts!.issuedRewards} mã quà đã cấp khác nhau` : "chưa đủ thông tin mã quà"}. Đây không phải tổng toàn campaign. API chưa cung cấp thống kê tổng.</p>
        {!list.items.length ? <Empty filtered={Object.keys(filters).some(key => !["limit", "sort"].includes(key))} /> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Danh sách đăng ký, có thể cuộn ngang">
          <table className={styles.table}><thead><tr><th>Người gửi</th><th>Thời điểm</th><th>Góp ý</th><th>Quà và tài khoản</th><th>Chi tiết</th></tr></thead><tbody>{list.items.map(item => <tr key={item.id}>
            <td><strong>{item.fullName}</strong><br />{item.email}<br />{item.phoneNumber}</td>
            <td>{date(item.submittedAt)}<br />{item.duplicate ? "Gửi lại" : "Lượt gửi gốc"}</td>
            <td>{item.reviewPreview}<br /><small>{item.reviewLength} ký tự</small></td>
            <td>{stateLabel(item.benefit.state)}<br />{item.lifecycle && item.lifecycle.state !== item.benefit.state && <><small>Quà gốc: {stateLabel(item.lifecycle.state)}</small><br /></>}{(item.lifecycle?.accountId || item.benefit.userId) ? "Đã liên kết tài khoản" : "Chưa có liên kết tài khoản"}<br />{item.benefit.postponed && "Có thay đổi lịch do quyền hiện có"}</td>
            <td><Link prefetch={false} className="hm-link" href={`/bang-dieu-khien/phan-hoi-qua-tang/${item.id}`}>Xem chi tiết<span className="sr-only"> đăng ký của {item.fullName}</span></Link></td>
          </tr>)}</tbody></table>
        </div>}
        <div className={styles.actions}>
          <button className="hm-button hm-secondary" disabled={history.length <= 1} onClick={() => setHistory(values => values.slice(0, -1))}>Trang trước</button>
          <span>Trang {history.length}</span>
          <button className="hm-button hm-secondary" disabled={!list.page.hasMore || !list.page.nextCursor} onClick={() => setHistory(values => [...values, list.page.nextCursor!])}>Trang sau</button>
          <button className="hm-button hm-secondary" onClick={query.retry}>Tải lại</button>
        </div>
        <Snapshot meta={query.data!.meta} />
      </>}
    </section>
  </>;
}

export function FeedbackDetail({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => readDetail(id, signal), [id]);
  const query = useFeedbackQuery(id, load);
  const item = query.data?.data;
  const life = item?.lifecycle;
  const facts = item ? [
    ["Họ và tên", item.fullName], ["Email", item.email], ["Số điện thoại", item.phoneNumber],
    ["Đã gửi", date(item.submittedAt)], ["Loại lượt gửi", item.duplicate ? "Gửi lại; không cấp thêm quà" : "Lượt gửi gốc"],
    ["Trạng thái quà gốc", stateLabel(life?.state || item.benefit.state)],
    ["Trạng thái lượt gửi", stateLabel(item.benefit.state)],
    ["Mã lý do từ máy chủ", item.benefit.reason || "Chưa có thông tin"],
    ["Mã trạng thái lượt gửi / quà gốc", `${item.benefit.state} / ${life?.state || "Chưa có thông tin"}`],
    ["Tài khoản liên kết", life?.accountId || item.benefit.userId || "Chưa có liên kết"],
    ["Workspace", item.benefit.workspaceId || "Chưa có thông tin"],
    ["Tài khoản được tạo", date(life?.accountCreatedAt ?? null)], ["Liên kết", date(life?.linkedAt || item.benefit.boundAt)],
    ["Cấp quà lần đầu", date(life?.awardedAt || item.benefit.grantedAt)],
    ["Bắt đầu dự kiến", date(life?.expectedStartsAt || item.benefit.startsAt)], ["Kết thúc dự kiến", date(life?.expectedEndsAt || item.benefit.endsAt)],
    ["Đã bắt đầu thực tế", date(life?.actualStartedAt ?? null)], ["Hoàn tất thời gian", date(life?.completedAt ?? null)],
    ["Mã quà đã cấp", life?.rewardId || "Chưa có thông tin quà đã cấp"],
    ["Đã dùng suất nhận quà", life ? (life.allotmentConsumed ? "Có" : "Chưa") : "Chưa có thông tin"],
    ["Số quà logic của tài khoản", life?.logicalRewardCount ?? "Chưa có thông tin"],
    ["Số lượt gửi trong phạm vi", life?.submissionCount ?? "Chưa có thông tin"],
    ["Lượt đầu / cuối", life ? `${date(life.firstSubmittedAt)} / ${date(life.lastSubmittedAt)}` : "Chưa có thông tin"],
    ["Số giai đoạn quyền", life?.segmentCount ?? "Chưa có thông tin"],
    ["Thời lượng đã phân bổ (giây)", life?.allocatedSeconds ?? "Chưa có thông tin"],
    ["Thời lượng đã trôi qua (giây)", life?.elapsedSeconds ?? "Chưa xác định"],
    ["Thời lượng còn lại (giây)", life?.remainingSeconds ?? "Chưa xác định"],
    ["Sử dụng tính năng Premium", life?.featureUsage.status === "NOT_TRACKED" ? "Không được theo dõi" : "Chưa có dữ liệu được hỗ trợ"],
    ["Thay đổi lịch do quyền hiện có", item.benefit.postponed ? "Có" : "Không"],
  ] : [];
  return <>
    <Link prefetch={false} className="hm-back" href="/bang-dieu-khien/phan-hoi-qua-tang">← Danh sách phản hồi</Link>
    <PageHeading title="Chi tiết đăng ký và quà" description="Dữ liệu riêng tư dành cho SYSTEM_ADMIN. Thời điểm không có trên API được để chưa xác định." />
    {query.loading && <Loading />}{query.error && <Failure error={query.error} retry={query.retry} />}
    {item && <>
      <section className="hm-panel"><h2>Thông tin và vòng đời</h2><dl className={styles.facts}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className={styles.note}>Số lượt gửi thuộc tài khoản sau khi liên kết, hoặc đề cử trước khi liên kết. Thời lượng trôi qua không chứng minh người dùng đã sử dụng tính năng. API không có trạng thái “tạm dừng” riêng.</p>
        {life && life.sourceSubmissionId !== id && <Link prefetch={false} className="hm-link" href={`/bang-dieu-khien/phan-hoi-qua-tang/${life.sourceSubmissionId}`}>Xem lượt gửi gốc và các giai đoạn quyền</Link>}
      </section>
      <section className="hm-panel"><h2>Nội dung góp ý</h2><p className={styles.review}>{item.review}</p></section>
      <section className="hm-panel"><h2>Các giai đoạn quyền Premium</h2>{!item.segments.length ? <Empty>Chưa có giai đoạn quyền tại bản ghi này. Với lượt gửi lại, xem lượt gửi gốc.</Empty> : <dl className={styles.facts}>{item.segments.map(segment => <div key={segment.id}><dt className="hm-id">{segment.id}</dt><dd>Bắt đầu {date(segment.startsAt)} · kết thúc {date(segment.endsAt)} · kết thúc theo lịch {date(segment.plannedEndsAt)}<br />{segment.supersededAt && `Đã thay thế lúc ${date(segment.supersededAt)}`}</dd></div>)}</dl>}</section>
      <Snapshot meta={query.data!.meta} />
    </>}
  </>;
}
