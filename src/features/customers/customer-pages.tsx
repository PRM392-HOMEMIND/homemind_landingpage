"use client";
import { useState } from "react";
import { DataRegion } from "@/components/admin/data-region";
import { PageHeading, Tabs } from "@/components/admin/feedback";
export function CustomerDirectory() {
  return (
    <>
      <PageHeading
        title="Khách hàng"
        description="Danh bạ gồm mọi trạng thái và nguồn dữ liệu. ACTIVE là trạng thái tài khoản, không phải đang online."
      />
      <DataRegion operation="adminUsers" />
    </>
  );
}
export function CustomerDetail({ userId }: { userId: string }) {
  const [tab, setTab] = useState("profile");
  return (
    <>
      <PageHeading
        title="Chi tiết khách hàng"
        description="Phân biệt số đăng nhập và số liên hệ; thông tin thiếu được giữ nguyên là chưa biết."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "profile", label: "Hồ sơ & chấp thuận" },
          { id: "workspaces", label: "Không gian" },
          { id: "spending", label: "Chi tiêu" },
          { id: "activity", label: "Hoạt động" },
          { id: "payments", label: "Thanh toán" },
          { id: "requests", label: "Sử dụng AI" },
          { id: "turns", label: "Lượt xử lý AI" },
        ]}
      />
      {tab === "profile" && (
        <DataRegion operation="adminUser" params={{ userId }} />
      )}
      {tab === "workspaces" && (
        <DataRegion
          operation="adminUserWorkspaces"
          params={{ userId }}
          locked={["userId"]}
        />
      )}
      {tab === "spending" && (
        <>
          <p className="hm-scope-note">
            Mặc định lifetime và REAL. Chi tiêu của người tạo đơn gốc, không dựa
            vào chủ không gian hiện tại. Hoàn tiền và doanh thu ròng chưa được
            hỗ trợ.
          </p>
          <DataRegion operation="adminUserSpending" params={{ userId }} />
        </>
      )}
      {tab === "activity" && (
        <DataRegion
          operation="adminUserActivity"
          params={{ userId }}
          locked={["userId"]}
        />
      )}
      {tab === "payments" && (
        <>
          <p className="hm-scope-note">userId là người trả tiền gốc.</p>
          <DataRegion
            operation="adminPayments"
            initial={{ userId }}
            locked={["userId"]}
          />
        </>
      )}
      {tab === "requests" && (
        <DataRegion
          operation="adminUsageRequests"
          initial={{ userId }}
          locked={["userId"]}
        />
      )}
      {tab === "turns" && (
        <DataRegion
          operation="adminUsageTurns"
          initial={{ userId }}
          locked={["userId"]}
        />
      )}
    </>
  );
}
