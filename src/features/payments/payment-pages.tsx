"use client";
import { useState } from "react";
import { DataRegion } from "@/components/admin/data-region";
import {
  Empty,
  Failure,
  Loading,
  PageHeading,
  Snapshot,
  Tabs,
} from "@/components/admin/feedback";
import { RecordDetails, RecordTable } from "@/components/admin/records";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import type { Entitlement } from "@/lib/admin-api/types";
export function PaymentDirectory() {
  return (
    <>
      <PageHeading
        title="Thanh toán"
        description="Chỉ đơn legacy, không gồm Apple/Google IAP. Tiền nhận không tự đồng nghĩa doanh số mua gói hoàn tất; giao dịch Store ở mục Store và đối soát."
      />
      <DataRegion operation="adminPayments" />
    </>
  );
}
function MatchingGrants({
  workspaceId,
  paymentId,
}: {
  workspaceId: string;
  paymentId: string;
}) {
  const [cursor, setCursor] = useState<string | undefined>();
  const [previous, setPrevious] = useState<Entitlement[]>([]);
  const [pages, setPages] = useState(1);
  const result = useAdminQuery("adminEntitlements", {
    query: { workspaceId, limit: "25", cursor },
  });
  const loaded = [...previous, ...(result.response?.data.items || [])];
  const matching = loaded.filter((row) => row.orderId === paymentId);
  return (
    <section className="hm-panel">
      <h2>Quyền lợi liên quan đến đơn</h2>
      <p className="hm-scope-note">
        Đọc grant theo workspaceId và đối chiếu orderId trên từng trang.{" "}
        {previous.length + (result.response?.data.items.length || 0)} grant đã
        được đọc qua {pages} trang.
      </p>
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
                setPages(1);
              }}
            >
              Đọc lại từ trang đầu
            </button>
          )}
        </>
      ) : (
        result.response && (
          <>
            {matching.length ? (
              <RecordTable schema="Entitlement" items={matching} />
            ) : (
              <Empty>
                {result.response.data.page.hasMore
                  ? "Chưa thấy grant khớp trong các trang đã tải. Còn trang chưa được đọc."
                  : "Không có grant khớp trong toàn bộ phạm vi đã duyệt."}
              </Empty>
            )}
            {result.response.data.page.hasMore && (
              <button
                className="hm-button hm-secondary"
                onClick={() => {
                  setPrevious(loaded);
                  setPages((value) => value + 1);
                  setCursor(result.response!.data.page.nextCursor!);
                }}
              >
                Đọc trang quyền lợi tiếp theo
              </button>
            )}
            <Snapshot meta={result.response.meta} />
          </>
        )
      )}
    </section>
  );
}
export function PaymentDetail({ paymentId }: { paymentId: string }) {
  const [tab, setTab] = useState("profile");
  const payment = useAdminQuery("adminPayment", { params: { paymentId } });
  return (
    <>
      <PageHeading
        title="Chi tiết thanh toán"
        description="Đơn legacy và quyền lợi liên quan, không gồm Apple/Google IAP. Doanh số chỉ được ghi nhận khi completedSale là Có."
      />
      {payment.loading ? (
        <Loading />
      ) : payment.error ? (
        <Failure error={payment.error} retry={payment.retry} />
      ) : (
        payment.response && (
          <>
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: "profile", label: "Thông tin đơn" },
                { id: "transactions", label: "Giao dịch xác minh" },
                { id: "grants", label: "Quyền lợi liên quan" },
              ]}
            />
            {tab === "profile" && (
              <section className="hm-panel">
                <RecordDetails schema="Payment" value={payment.response.data} />
                <Snapshot meta={payment.response.meta} />
              </section>
            )}
            {tab === "transactions" && (
              <DataRegion
                operation="adminPaymentTransactions"
                params={{ paymentId }}
              />
            )}
            {tab === "grants" && (
              <MatchingGrants
                key={`${paymentId}-${payment.response.data.workspaceId}`}
                workspaceId={payment.response.data.workspaceId}
                paymentId={paymentId}
              />
            )}
            <p className="hm-unavailable">
              Hoàn tiền và doanh thu ròng chưa có nguồn dữ liệu được hỗ trợ.
            </p>
          </>
        )
      )}
    </>
  );
}
