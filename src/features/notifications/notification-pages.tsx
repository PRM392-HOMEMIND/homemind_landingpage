"use client";
import { DataRegion } from "@/components/admin/data-region";
import { PageHeading } from "@/components/admin/feedback";
export function NotificationDirectory() {
  return (
    <>
      <PageHeading
        title="Thông báo"
        description="Metadata thông báo khách hàng. Việc xem ở đây không thay đổi readAt của người nhận."
      />
      <DataRegion operation="adminNotifications" />
    </>
  );
}
export function NotificationDetail({
  notificationId,
}: {
  notificationId: string;
}) {
  return (
    <>
      <PageHeading
        title="Chi tiết thông báo"
        description="Thông tin người nhận, không gian và trạng thái đọc do khách hàng ghi nhận. Dữ liệu chỉ đọc."
      />
      <DataRegion operation="adminNotification" params={{ notificationId }} />
    </>
  );
}
