"use client";
import { useId, useState } from "react";
import { DataRegion } from "@/components/admin/data-region";
import {
  Empty,
  Failure,
  Loading,
  PageHeading,
  Tabs,
  Snapshot,
} from "@/components/admin/feedback";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import { CurrentQuota } from "@/features/workspaces/workspace-pages";
import type { Query } from "@/lib/admin-api/validation";
function WorkspacePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const [cursor, setCursor] = useState<string | undefined>();
  const [previous, setPrevious] = useState<Array<string | undefined>>([]);
  const result = useAdminQuery("adminWorkspaces", {
    query: { limit: "25", cursor },
  });
  return (
    <section className="hm-panel">
      <h2>Chọn không gian thực tế</h2>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <>
          <Failure error={result.error} retry={result.retry} />
          {cursor && (
            <button
              className="hm-button hm-secondary"
              onClick={() => {
                setCursor(undefined);
                setPrevious([]);
              }}
            >
              Về trang danh bạ đầu
            </button>
          )}
        </>
      ) : (
        result.response && (
          <>
            {result.response.data.items.length ? (
              <label className="hm-workspace-picker" htmlFor={id}>
                <span>Không gian trên trang danh bạ</span>
                <select
                  id={id}
                  value={
                    result.response.data.items.some((item) => item.id === value)
                      ? value
                      : ""
                  }
                  onChange={(event) => onChange(event.target.value)}
                >
                  <option value="">Chọn một không gian</option>
                  {result.response.data.items.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name} · {workspace.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Empty />
            )}
            <div className="hm-pagination">
              <span>Danh bạ không gian có phân trang</span>
              <div>
                <button
                  className="hm-button hm-secondary"
                  disabled={!previous.length}
                  onClick={() => {
                    setCursor(previous.at(-1));
                    setPrevious((p) => p.slice(0, -1));
                  }}
                >
                  Trang trước
                </button>
                <button
                  className="hm-button hm-secondary"
                  disabled={!result.response.data.page.hasMore}
                  onClick={() => {
                    setPrevious((p) => [...p, cursor]);
                    setCursor(result.response!.data.page.nextCursor!);
                  }}
                >
                  Trang tiếp
                </button>
              </div>
            </div>
            <Snapshot meta={result.response.meta} />
          </>
        )
      )}
    </section>
  );
}
export default function UsagePage({ initial = {} }: { initial?: Query }) {
  const [tab, setTab] = useState(initial.userId ? "requests" : "current");
  const [workspaceId, setWorkspaceId] = useState(initial.workspaceId || "");
  return (
    <>
      <PageHeading
        title="Sử dụng AI"
        description="Quota dùng chung theo không gian; lịch sử phân loại theo gói của kỳ. Chỉ hiển thị metadata, không có nội dung AI."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "current", label: "Quota hiện tại" },
          { id: "periods", label: "Kỳ lịch sử" },
          { id: "requests", label: "Yêu cầu & giữ chỗ" },
          { id: "turns", label: "Lượt xử lý" },
        ]}
      />
      {tab === "current" && (
        <>
          <WorkspacePicker value={workspaceId} onChange={setWorkspaceId} />
          {workspaceId ? (
            <CurrentQuota key={workspaceId} workspaceId={workspaceId} />
          ) : (
            <p className="hm-scope-note">
              Chọn không gian để tải quota hiện tại. Không có chỉ số tổng hợp
              thay thế.
            </p>
          )}
        </>
      )}
      {tab === "periods" && (
        <DataRegion operation="adminUsagePeriods" initial={initial} />
      )}{" "}
      {tab === "requests" && (
        <>
          <p className="hm-scope-note">
            RESERVED đang giữ chỗ; RELEASED đã giải phóng; COMMITTED đã tính một
            lượt. Xác nhận, hủy và replay không tự tính thêm lượt.
          </p>
          <DataRegion operation="adminUsageRequests" initial={initial} />
        </>
      )}{" "}
      {tab === "turns" && (
        <DataRegion operation="adminUsageTurns" initial={initial} />
      )}
    </>
  );
}
