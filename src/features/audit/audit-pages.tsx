"use client";
import { DataRegion } from "@/components/admin/data-region";
import { PageHeading } from "@/components/admin/feedback";
export function AuditDirectory() {
  return (
    <>
      <PageHeading
        title="Nhật ký quản trị"
        description="Đọc nhật ký cũng tạo một bản ghi kiểm toán. Trang chỉ tải khi được mở hoặc theo thao tác của bạn, không tự polling."
      />
      <DataRegion operation="adminAuditLogs" />
    </>
  );
}
export function AuditDetail({ entryId }: { entryId: string }) {
  return (
    <>
      <PageHeading
        title="Chi tiết nhật ký"
        description="Metadata an toàn: mã yêu cầu, endpoint template, kết quả và mã băm phạm vi. Không hiển thị truy vấn thô."
      />
      <DataRegion operation="adminAuditLog" params={{ entryId }} />
    </>
  );
}
