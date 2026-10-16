"use client";
import { DataRegion } from "@/components/admin/data-region";
import { PageHeading } from "@/components/admin/feedback";
export default function EntitlementsPage() {
  return (
    <>
      <PageHeading
        title="Lịch sử gói sử dụng"
        description="Grant lịch sử có thể đã hết hạn hoặc bị thay thế. Xem bao phủ của không gian để xác định quyền lợi hiện tại."
      />
      <DataRegion operation="adminEntitlements" />
    </>
  );
}
