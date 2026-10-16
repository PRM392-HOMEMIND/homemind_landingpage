"use client";
import { useState } from "react";
import { Users, House, CreditCard, AudioLines } from "lucide-react";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import type { TrendItem } from "@/lib/admin-api/types";
import { money, moneyCoordinate, date } from "@/lib/formatting/admin";
import type { Query } from "@/lib/admin-api/validation";
import { Filters } from "@/components/admin/filters";
import {
  Failure,
  Loading,
  Empty,
  PageHeading,
  Snapshot,
  Tabs,
} from "@/components/admin/feedback";
import { RecordTable, word } from "@/components/admin/records";
function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon?: typeof Users;
}) {
  return (
    <article className="hm-metric">
      {Icon && <Icon className="hm-metric-icon" size={20} aria-hidden="true" />}
      <p>{label}</p>
      <strong>
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </strong>
      <span>{note}</span>
    </article>
  );
}
export function TrendChart({ items }: { items: TrendItem[] }) {
  const [metric, setMetric] = useState("sales");
  const max = items
    .reduce(
      (maximum, item) =>
        BigInt(item.completedSales.amount) > maximum
          ? BigInt(item.completedSales.amount)
          : maximum,
      BigInt(0),
    )
    .toString();
  const counts = items.map((item) =>
    metric === "signups" ? item.signups : item.committedUsage,
  );
  const countMax = Math.max(1, ...counts);
  const values = items.map((item) =>
    metric === "sales"
      ? moneyCoordinate(item.completedSales.amount, max)
      : (metric === "signups" ? item.signups : item.committedUsage) / countMax,
  );
  const points = values
    .map(
      (value, index) =>
        `${40 + (index * 820) / Math.max(1, values.length - 1)},${210 - value * 170}`,
    )
    .join(" ");
  return (
    <>
      <Tabs
        items={[
          { id: "sales", label: "Doanh số hoàn tất" },
          { id: "signups", label: "Đăng ký mới" },
          { id: "usage", label: "Lượt AI committed" },
        ]}
        value={metric}
        onChange={setMetric}
      />
      {!items.length ? (
        <Empty />
      ) : (
        <>
          <svg
            className="hm-chart"
            viewBox="0 0 900 245"
            role="img"
            aria-label={`Xu hướng ${metric === "sales" ? "doanh số hoàn tất" : metric === "signups" ? "đăng ký mới" : "lượt AI committed"}. Bảng dữ liệu bên dưới cung cấp giá trị chính xác.`}
          >
            <line x1="40" y1="210" x2="860" y2="210" stroke="#cbd5e1" />
            <line
              x1="40"
              y1="40"
              x2="860"
              y2="40"
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text x="40" y="30">
              {metric === "sales"
                ? money({ currency: "VND", amount: max })
                : countMax.toLocaleString("vi-VN")}
            </text>
            <text x="12" y="215">
              0
            </text>
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              points={points}
            />
            {items.map((item, index) => (
              <circle
                key={item.bucketLocalStart}
                cx={40 + (index * 820) / Math.max(1, values.length - 1)}
                cy={210 - values[index] * 170}
                r="4"
                fill="#059669"
              >
                <title>
                  {item.bucketLocalStart.replace("T", " ")}:{" "}
                  {metric === "sales"
                    ? money(item.completedSales)
                    : (metric === "signups"
                        ? item.signups
                        : item.committedUsage
                      ).toLocaleString("vi-VN")}
                </title>
              </circle>
            ))}
            <text x="40" y="239">
              {items[0].bucketLocalStart.slice(0, 10)}
            </text>
            <text x="860" y="239" textAnchor="end">
              {items.at(-1)!.bucketLocalStart.slice(0, 10)}
            </text>
          </svg>
          <details className="hm-chart-data">
            <summary>Xem bảng số liệu chính xác</summary>
            <RecordTable schema="TrendItem" items={items} />
          </details>
        </>
      )}
    </>
  );
}
export default function DashboardPage() {
  const [query, setQuery] = useState<Query>({
    provenance: "REAL",
    timezone: "Asia/Ho_Chi_Minh",
    bucket: "day",
  });
  const { from, to, provenance, timezone, bucket } = query;
  const scope = { from, to, provenance, timezone };
  const overview = useAdminQuery("adminOverview", { query: scope });
  const trends = useAdminQuery("adminTrends", { query: { ...scope, bucket } });
  const plans = useAdminQuery("adminPlanDistribution", {});
  const payers = useAdminQuery("adminTopPayingUsers", { query: scope });
  const current = overview.response?.data;
  return (
    <>
      <PageHeading
        title="Tổng quan hệ thống"
        description="Số liệu tài chính chỉ từ đơn legacy, không gồm Apple/Google IAP. Xem Store và đối soát cho giao dịch Store; thống kê khách hàng và mức sử dụng giữ phạm vi bộ lọc."
      />
      <section className="hm-panel">
        <Filters operation="adminTrends" query={query} onChange={setQuery} />
        <p className="hm-scope-note">
          Mặc định: 30 ngày theo máy chủ. Bộ lọc áp dụng cho tổng quan, xu hướng
          và người trả tiền; phân bố gói dùng trạng thái hiện tại riêng.
        </p>
      </section>
      <section className="hm-region" aria-label="Chỉ số tổng quan">
        {overview.loading ? (
          <Loading />
        ) : overview.error ? (
          <Failure error={overview.error} retry={overview.retry} />
        ) : (
          current && (
            <>
              <div className="hm-section-heading">
                <h2>Trong kỳ báo cáo</h2>
                <span>
                  {word(current.provenance)} · {current.timezone}
                </span>
              </div>
              <p className="hm-muted">
                [{date(current.from, current.timezone)},{" "}
                {date(current.to, current.timezone)})
              </p>
              <div className="hm-metric-grid">
                <Metric
                  label="Doanh số hoàn tất"
                  value={money(current.completedSales)}
                  note={`${current.completedPurchases} đơn PAID + GRANTED; giá snapshot theo paid_at`}
                  icon={CreditCard}
                />
                <Metric
                  label="Tiền nhận đã xác minh"
                  value={money(current.verifiedReceipts)}
                  note="Giao dịch duy nhất theo thời điểm nhận tiền"
                />
                <Metric
                  label="Khách hàng đăng ký mới"
                  value={current.customers.newInWindow}
                  note="Theo created_at trong kỳ"
                  icon={Users}
                />
                <Metric
                  label="Lượt AI đã dùng"
                  value={current.committedUsageInWindow}
                  note="COMMITTED theo completed_at; không gồm giữ chỗ"
                  icon={AudioLines}
                />
              </div>
              <div className="hm-section-heading">
                <h2>Trạng thái hiện tại</h2>
                <span>Theo provenance; không lọc theo ngày</span>
              </div>
              <div className="hm-metric-grid">
                <Metric
                  label="Khách hàng trong phạm vi"
                  value={current.customers.total}
                  note={`${current.customers.active} ACTIVE; trạng thái tài khoản, không phải online`}
                  icon={Users}
                />
                <Metric
                  label="Không gian trong phạm vi"
                  value={current.workspaces.total}
                  note={`${current.workspaces.active} chưa lưu trữ · ${current.workspaces.archived} đã lưu trữ`}
                  icon={House}
                />
                <Metric
                  label="Khách hàng đang trả phí"
                  value={current.currentlyPayingCustomers}
                  note="Người trả tiền gốc của bao phủ đang hiệu lực"
                />
                <Metric
                  label="Khách hàng được bao phủ"
                  value={current.currentlyCoveredCustomers}
                  note="Thành viên hưởng bao phủ; khác người trả tiền"
                />
              </div>
              <div className="hm-panel hm-provenance">
                <h3>Toàn bộ bản ghi và nguồn dữ liệu</h3>
                <p>
                  Tất cả nguồn:{" "}
                  <strong>
                    {current.customers.allRecords.toLocaleString("vi-VN")} khách
                    hàng
                  </strong>{" "}
                  ·{" "}
                  <strong>
                    {current.workspaces.allRecords.toLocaleString("vi-VN")}{" "}
                    không gian
                  </strong>
                  . Phạm vi {word(current.customers.scopeProvenance)} có thể nhỏ
                  hơn tổng bản ghi.
                </p>
                <div className="hm-provenance-grid">
                  {[
                    ["Khách hàng", current.customers.provenanceCounts],
                    ["Không gian", current.workspaces.provenanceCounts],
                    ["Đơn thanh toán (lifetime)", current.provenanceCounts],
                  ].map(([label, counts]) => (
                    <div key={String(label)}>
                      <h4>{String(label)}</h4>
                      {Object.entries(counts).map(([key, value]) => (
                        <p key={key}>
                          {word(key)}:{" "}
                          <strong>
                            {Number(value).toLocaleString("vi-VN")}
                          </strong>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="hm-warning-text">
                  Bản ghi lịch sử chưa phân loại không tự được coi là REAL.
                  Nguồn tài chính và nguồn báo cáo khách hàng/không gian là các
                  chiều riêng.
                </p>
              </div>
              <div className="hm-metric-grid hm-compact-metrics">
                <Metric
                  label="Đơn cần kiểm tra"
                  value={current.attention.orders}
                  note={`Hiện tại / lifetime · nhận ${money(current.attention.receivedAmount)}; chưa tự tính vào doanh số`}
                />
                <Metric
                  label="Không gian hết quota"
                  value={current.exhaustedWorkspaces}
                  note="Remaining bằng 0 tại snapshot"
                />
                <Metric
                  label="Bao phủ sắp hết"
                  value={current.upcomingPaidWorkspaces}
                  note="Bao phủ trả phí trong 7 ngày tới"
                />
                <Metric
                  label="Quyền lợi đã hết hạn"
                  value={current.expiredUnsupersededGrants}
                  note="Quyền lợi lịch sử chưa bị thay thế; không phải Free hết hạn"
                />
              </div>
              <section className="hm-panel">
                <h3>Lượt sử dụng theo gói của kỳ lịch sử</h3>
                {Object.entries(current.usageByPlan).length ? (
                  Object.entries(current.usageByPlan).map(([plan, count]) => (
                    <p key={plan}>
                      {word(plan)}:{" "}
                      <strong>{count.toLocaleString("vi-VN")}</strong>
                    </p>
                  ))
                ) : (
                  <Empty />
                )}
              </section>
              <Snapshot meta={overview.response!.meta} />
            </>
          )
        )}
      </section>
      <div className="hm-dashboard-grid">
        <section className="hm-panel hm-chart-panel">
          <h2>Xu hướng trong kỳ</h2>
          <p className="hm-muted">
            Mốc lịch địa phương được giữ nguyên; không thêm bucket hoặc kỳ so
            sánh.
          </p>
          {trends.loading ? (
            <Loading />
          ) : trends.error ? (
            <Failure error={trends.error} retry={trends.retry} />
          ) : (
            trends.response && (
              <>
                <p className="hm-scope-note">
                  {word(trends.response.data.provenance)} ·{" "}
                  {trends.response.data.timezone}
                </p>
                <TrendChart items={trends.response.data.items} />
                <Snapshot meta={trends.response.meta} />
              </>
            )
          )}
        </section>
        <section className="hm-panel">
          <h2>Phân bố gói hiện tại</h2>
          <p className="hm-muted">
            Không áp dụng bộ lọc phía trên. Mỗi không gian được đếm một lần.
          </p>
          {plans.loading ? (
            <Loading />
          ) : plans.error ? (
            <Failure error={plans.error} retry={plans.retry} />
          ) : (
            plans.response && (
              <>
                <p className="hm-scope-note">
                  Nguồn: {word(plans.response.data.provenance)} ·{" "}
                  {plans.response.data.timezone}
                </p>
                {plans.response.data.items.length ? (
                  <>
                    <div className="hm-distribution">
                      {plans.response.data.items.map((item) => (
                        <div key={`${item.segment}-${item.plan}`}>
                          <div>
                            <span>
                              {word(item.segment)} · {word(item.plan)}
                            </span>
                            <strong>
                              {item.workspaces.toLocaleString("vi-VN")}
                            </strong>
                          </div>
                          <progress
                            value={item.workspaces}
                            max={Math.max(
                              1,
                              ...plans.response!.data.items.map(
                                (row) => row.workspaces,
                              ),
                            )}
                            aria-label={`${word(item.segment)} ${word(item.plan)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <details>
                      <summary>Xem bảng phân bố</summary>
                      <RecordTable
                        schema="PlanDistributionItem"
                        items={plans.response.data.items}
                      />
                    </details>
                  </>
                ) : (
                  <Empty />
                )}
                <Snapshot meta={plans.response.meta} />
              </>
            )
          )}
        </section>
      </div>
      <section className="hm-panel">
        <h2>Người trả tiền nhiều nhất</h2>
        <p className="hm-muted">
          Người tạo đơn legacy gốc, theo doanh số hoàn tất trong kỳ và nguồn đã chọn; không gồm Apple/Google IAP.
        </p>
        {payers.loading ? (
          <Loading />
        ) : payers.error ? (
          <Failure error={payers.error} retry={payers.retry} />
        ) : (
          payers.response && (
            <>
              {payers.response.data.items.length ? (
                <RecordTable
                  schema="TopPayingItem"
                  items={payers.response.data.items}
                />
              ) : (
                <Empty />
              )}
              <Snapshot meta={payers.response.meta} />
            </>
          )
        )}
      </section>
      <p className="hm-unavailable">
        Hoàn tiền, doanh thu ròng, tỷ lệ tăng trưởng và hiện diện online: chưa
        được hỗ trợ trong admin-v1. Các response có snapshot riêng, không đảm
        bảo cùng thời điểm.
      </p>
    </>
  );
}
