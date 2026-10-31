"use client";
import { useState } from "react";
import { useSession } from "@/features/admin-auth/use-session";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import {
  logout,
  refreshSession,
  revokeSession,
} from "@/lib/auth/admin-session";
import {
  Empty,
  Failure,
  Loading,
  PageHeading,
  Snapshot,
} from "@/components/admin/feedback";
import { ActionMenu } from "@/components/admin/action-menu";
import { Confirmation } from "@/components/admin/confirmation";
import { RecordDetails, Value } from "@/components/admin/records";
import type { Session } from "@/lib/admin-api/types";
export default function SessionsPage() {
  const session = useSession();
  const result = useAdminQuery("adminSessions", {});
  const [action, setAction] = useState<{
    all?: boolean;
    session?: Session;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [message, setMessage] = useState("");
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (action?.all) await logout(true);
      else if (action?.session)
        await revokeSession(action.session.id, action.session.current);
      setMessage("Máy chủ đã xác nhận thu hồi phiên.");
      result.retry();
    } catch (failure) {
      setError(failure as Error);
    } finally {
      setBusy(false);
      setAction(null);
    }
  }
  return (
    <>
      <PageHeading
        title="Bảo mật phiên đăng nhập"
        description="Chỉ quản lý phiên của tài khoản quản trị hiện tại. Không suy đoán IP hoặc dấu vân tay thiết bị."
      />
      <section className="hm-panel">
        <h2>Tài khoản hiện tại</h2>
        {session.identity && (
          <RecordDetails schema="Identity" value={session.identity} />
        )}
        <div className="hm-page-actions">
          <button
            className="hm-button hm-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await refreshSession();
                setMessage(
                  "Phiên đã được làm mới. Hạn tuyệt đối không được kéo dài.",
                );
                result.retry();
              } catch (failure) {
                setError(failure as Error);
              } finally {
                setBusy(false);
              }
            }}
          >
            Làm mới phiên theo yêu cầu
          </button>
          <button
            className="hm-button hm-secondary hm-danger-text"
            disabled={busy}
            onClick={() => setAction({ all: true })}
          >
            Đăng xuất tất cả phiên
          </button>
        </div>
        <p className="hm-muted">
          Không tự làm mới khi bạn vắng mặt. Thời hạn không hoạt động 15 phút;
          tối đa 8 giờ.
        </p>
        {error && <Failure error={error} />}{" "}
        {message && (
          <p role="status" className="hm-success">
            {message}
          </p>
        )}
      </section>
      <section className="hm-panel">
        <div className="hm-section-heading">
          <h2>Các phiên của bạn</h2>
          <button
            className="hm-button hm-secondary"
            disabled={result.loading || busy}
            onClick={result.retry}
          >
            Tải lại danh sách
          </button>
        </div>
        {result.loading ? (
          <Loading />
        ) : result.error ? (
          <Failure error={result.error} retry={result.retry} />
        ) : (
          result.response && (
            <>
              {result.response.data.length ? (
                <div
                  className="hm-table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Danh sách phiên"
                >
                  <table className="hm-table">
                    <thead>
                      <tr>
                        {[
                          "Phiên",
                          "Client",
                          "Ngày tạo",
                          "Hoạt động gần nhất",
                          "Hết hạn",
                          "Thao tác",
                        ].map((label) => (
                          <th scope="col" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.response.data.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="hm-id">
                              {item.id.slice(0, 8)}…
                            </span>
                            {item.current && (
                              <span className="hm-badge">Phiên hiện tại</span>
                            )}
                          </td>
                          <td>
                            <Value field="client" value={item.client} />
                          </td>
                          <td>
                            <Value field="createdAt" value={item.createdAt} />
                          </td>
                          <td>
                            <Value field="lastSeenAt" value={item.lastSeenAt} />
                          </td>
                          <td>
                            <Value field="expiresAt" value={item.expiresAt} />
                          </td>
                          <td>
                            <ActionMenu
                              label={
                                item.current
                                  ? "Thao tác phiên hiện tại"
                                  : "Thao tác phiên của bạn"
                              }
                              actions={[
                                {
                                  label: item.current
                                    ? "Đăng xuất phiên này"
                                    : "Thu hồi phiên này",
                                  danger: true,
                                  onClick: () => setAction({ session: item }),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty />
              )}
              <Snapshot meta={result.response.meta} />
            </>
          )
        )}
      </section>
      {action && (
        <Confirmation
          title={
            action.all
              ? "Đăng xuất tất cả phiên?"
              : action.session?.current
                ? "Đăng xuất phiên hiện tại?"
                : "Thu hồi phiên đã chọn?"
          }
          description={
            action.all
              ? "Tất cả phiên của tài khoản này, bao gồm phiên đang dùng, sẽ kết thúc. Mọi tab sẽ cần đăng nhập lại."
              : action.session?.current
                ? "Bạn sẽ được đưa về trang đăng nhập. Dữ liệu quản trị trong bộ nhớ sẽ được xóa."
                : "Phiên được chọn sẽ mất quyền truy cập ngay. Các phiên khác không được chọn vẫn giữ nguyên."
          }
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={() => void confirm()}
        />
      )}
    </>
  );
}
