"use client";
import { useState } from "react";
import { DataRegion } from "@/components/admin/data-region";
import { PageHeading, Tabs } from "@/components/admin/feedback";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import { Failure, Loading, Snapshot } from "@/components/admin/feedback";
import { RecordDetails } from "@/components/admin/records";
export function WorkspaceDirectory() {
  return (
    <>
      <PageHeading
        title="Không gian"
        description="Gói, giới hạn sản phẩm và quota thuộc từng không gian, không nhân theo thành viên."
      />
      <DataRegion operation="adminWorkspaces" />
    </>
  );
}
export function CurrentQuota({ workspaceId }: { workspaceId: string }) {
  const result = useAdminQuery("adminCurrentUsage", { query: { workspaceId } });
  return (
    <section className="hm-panel">
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <Failure error={result.error} retry={result.retry} />
      ) : (
        result.response && (
          <>
            {(!result.response.data.entitlementKnown ||
              !result.response.data.quota.entitlementKnown) && (
              <p className="hm-warning-box" role="status">
                Thiếu dữ liệu quyền lợi. Quota dự kiến không chứng minh dữ liệu
                đầy đủ.
              </p>
            )}
            <h2>{result.response.data.name}</h2>
            <p className="hm-scope-note">
              Quota dùng chung theo kỳ cố định 30 ngày. Quyền truy cập Free trọn
              đời vẫn có hạn mức AI hữu hạn.
            </p>
            {result.response.data.quota.projectionOnly && (
              <p className="hm-warning-box">
                Kỳ được dự kiến, chưa có row persisted. Việc xem dữ liệu không
                tạo hoặc reset kỳ.
              </p>
            )}
            <RecordDetails schema="Workspace" value={result.response.data} />
            <Snapshot meta={result.response.meta} />
          </>
        )
      )}
    </section>
  );
}
export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const [tab, setTab] = useState("overview");
  return (
    <>
      <PageHeading
        title="Chi tiết không gian"
        description="Bao phủ hiện tại là nguồn xác định quyền lợi; lịch sử grant không tự được coi là đang hiệu lực."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "overview", label: "Gói & quota hiện tại" },
          { id: "profile", label: "Thông tin không gian" },
          { id: "members", label: "Thành viên" },
          { id: "inventory", label: "Tồn kho" },
          { id: "shopping", label: "Danh sách mua" },
          { id: "grants", label: "Lịch sử quyền lợi" },
          { id: "periods", label: "Kỳ sử dụng" },
          { id: "requests", label: "Yêu cầu AI" },
        ]}
      />
      {tab === "overview" && <CurrentQuota workspaceId={workspaceId} />}{" "}
      {tab === "profile" && (
        <DataRegion operation="adminWorkspace" params={{ workspaceId }} />
      )}
      {tab === "members" && (
        <>
          <p className="hm-scope-note">
            API thành viên trả mã khách hàng và vai trò. Mở hồ sơ để xem tên đã
            được xác minh; không tải riêng từng hồ sơ hàng loạt.
          </p>
          <DataRegion
            operation="adminWorkspaceMembers"
            params={{ workspaceId }}
            locked={["workspaceId"]}
          />
        </>
      )}
      {tab === "inventory" && (
        <DataRegion
          operation="adminWorkspaceInventory"
          params={{ workspaceId }}
          locked={["workspaceId"]}
        />
      )}{" "}
      {tab === "shopping" && (
        <DataRegion
          operation="adminWorkspaceShopping"
          params={{ workspaceId }}
          locked={["workspaceId"]}
        />
      )}{" "}
      {tab === "grants" && (
        <DataRegion
          operation="adminEntitlements"
          initial={{ workspaceId }}
          locked={["workspaceId"]}
        />
      )}{" "}
      {tab === "periods" && (
        <DataRegion
          operation="adminUsagePeriods"
          initial={{ workspaceId }}
          locked={["workspaceId"]}
        />
      )}{" "}
      {tab === "requests" && (
        <DataRegion
          operation="adminUsageRequests"
          initial={{ workspaceId }}
          locked={["workspaceId"]}
        />
      )}
    </>
  );
}
