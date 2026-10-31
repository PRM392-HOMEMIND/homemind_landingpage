"use client";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import {
  Failure,
  Loading,
  PageHeading,
  Snapshot,
} from "@/components/admin/feedback";
export default function OperationsPage() {
  const result = useAdminQuery("adminOperations", {});
  return (
    <>
      <PageHeading
        title="Vận hành hệ thống"
        description="Các ngoại lệ từ snapshot cơ sở dữ liệu. Phạm vi toàn hệ thống hiện tại; không có bộ lọc ngày hoặc provenance."
      />
      <section className="hm-panel">
        {result.loading ? (
          <Loading />
        ) : result.error ? (
          <Failure error={result.error} retry={result.retry} />
        ) : (
          result.response && (
            <>
              <div className="hm-metric-grid hm-operations-grid">
                {(
                  [
                    [
                      "undeliveredNotifications",
                      "Thông báo chưa giao",
                      "Chưa có thời điểm giao",
                    ],
                    [
                      "exhaustedDeliveryAttempts",
                      "Đã cạn lượt giao",
                      "Chưa giao, đã thử ít nhất 8 lần",
                    ],
                    [
                      "staleReservations",
                      "Giữ chỗ quá hạn",
                      "Đang giữ chỗ nhưng đã hết thời hạn",
                    ],
                    [
                      "missingEntitlements",
                      "Thiếu quyền lợi",
                      "Không gian thiếu dữ liệu quyền lợi",
                    ],
                    [
                      "quotaAnomalies",
                      "Bất thường quota",
                      "Lượt kỳ khác số yêu cầu đã tính lượt",
                    ],
                  ] as const
                ).map(([field, label, note]) => (
                  <article className="hm-metric" key={field}>
                    <p>{label}</p>
                    <strong>
                      {result.response!.data[field].toLocaleString("vi-VN")}
                    </strong>
                    <span>{note}</span>
                  </article>
                ))}
              </div>
              <p className="hm-scope-note">
                Phạm vi: chỉ snapshot cơ sở dữ liệu. Mỗi cảnh báo cần được kiểm
                tra theo quy trình vận hành riêng.
              </p>
              <Snapshot meta={result.response.meta} />
            </>
          )
        )}
      </section>
      <section className="hm-panel">
        <h2>Khả năng quan sát</h2>
        <p>
          Hiện diện online: <strong>Chưa có dữ liệu.</strong>
        </p>
        <p>
          Sức khỏe nhà cung cấp: <strong>Chưa được hỗ trợ.</strong>
        </p>
        <p className="hm-muted">
          Hợp đồng chưa cung cấp phép kiểm tra trạng thái nhà cung cấp.
        </p>
      </section>
    </>
  );
}
