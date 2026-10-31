"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import ThemeButton from "@/components/common/ThemeButton";
import { Gift } from "lucide-react";
import { FeedbackPopup } from "./FeedbackPopup";
import type { FeedbackSession } from "./session";
import styles from "./feedback-popup.module.css";

/** The contract-specific form remains an injected slot, not an assumed wire DTO. */
export function FeedbackExperience<Draft>({ session, children, onSubmit, formId, guidance }: {
  session: FeedbackSession<Draft>;
  children: ReactNode;
  onSubmit: () => void;
  formId?: string;
  guidance?: ReactNode;
}) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const busy = state.submission === "checking" || state.submission === "sending";
  const outcome = ["submitted", "rejected", "uncertain"].includes(state.submission);
  const canOpen = state.campaign === "enabled" || state.visited;
  const cooling = state.cooling;
  const retryable = state.submission === "uncertain" || (state.submission === "rejected" && ["RATE_LIMITED", "FEEDBACK_POPUP_BUSY", "FEEDBACK_POPUP_UNAVAILABLE"].includes(state.error?.code ?? ""));
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // A visitor usually submits while the form is scrolled to its last field.
    // Keep the result in sight without moving keyboard focus or animating it.
    if (state.open && state.submission !== "idle") notice.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [state.open, state.submission]);

  return (
    <>
      {canOpen && <ThemeButton type="button" variant="glass" className={`${styles.invitation} focus:!ring-emerald-700`} onClick={event => {
        // WebKit pointer clicks need not focus a button. Establish the opener
        // before the dialog captures it, including after campaign state changes.
        event.currentTarget.focus({ preventScroll: true });
        session.open();
      }} aria-haspopup="dialog" whileHover={undefined} whileTap={undefined}>
        <Gift size={18} aria-hidden="true" />
        {state.submission !== "idle" ? "Xem lượt gửi góp ý" : state.campaign === "enabled" ? "30 Ngày Đặc Quyền Premium" : "Xem thông tin chương trình"}
      </ThemeButton>}
      <FeedbackPopup open={state.open} onRequestClose={session.close} guidance={guidance} actions={
        <ThemeButton
          type={formId && !outcome ? "submit" : "button"}
          form={formId}
          // Firefox otherwise restores this button's dynamic disabled state on reload.
          // This applies to the action button, not the contract-specific form fields.
          {...{ autoComplete: "off" }}
          whileHover={undefined}
          whileTap={undefined}
          className="!bg-emerald-700 hover:!bg-emerald-800 focus:!ring-emerald-700 motion-reduce:!transform-none"
          disabled={busy || cooling || state.campaign !== "enabled"}
          onClick={outcome ? event => { event.preventDefault(); session.newSubmission(); } : formId ? undefined : onSubmit}
        >
          {state.submission === "checking" ? "Đang kiểm tra chương trình…" : state.submission === "sending" ? "Đang gửi…" : outcome ? "Gửi lượt góp ý mới" : "Gửi góp ý & đăng ký trải nghiệm"}
        </ThemeButton>
      }>
        <h3 className={styles.formTitle}>Cùng HomeMind tốt hơn mỗi ngày</h3>
        <div ref={notice}>
        <div role="status" aria-live="polite" aria-atomic="true">
          {busy && <p className={styles.notice}>Đang xử lý lượt gửi. Bạn có thể đóng cửa sổ và mở lại để xem kết quả. Thông tin đang nhập vẫn được giữ.</p>}
          {state.submission === "submitted" && <div className={styles.notice}><h3>Đã gửi thông tin</h3><p>HomeMind đã nhận thông tin và góp ý. Thông báo này không xác nhận quà đã được cấp hoặc Premium đã được kích hoạt.</p></div>}
        </div>
        {(state.submission === "rejected" || state.submission === "uncertain" || state.campaign === "disabled" || state.campaign === "unavailable") &&
          <p className={styles.notice} role="alert">
            {state.submission === "uncertain" ? "Chưa xác nhận được kết quả gửi. Hệ thống có thể đã nhận thông tin. Hãy kiểm tra kết nối và chủ động thử lại nếu cần." :
              state.submission === "rejected" ? state.error?.code === "RATE_LIMITED" ? "Bạn đã gửi nhiều lượt trong thời gian ngắn. Vui lòng chờ hết thời gian giới hạn rồi thử lại; thông tin vẫn được giữ." : state.error?.code === "FEEDBACK_POPUP_BUSY" ? "Máy chủ đang bận và chưa lưu lượt này. Vui lòng chờ rồi thử lại; thông tin vẫn được giữ." : state.error?.code === "FEEDBACK_POPUP_DISABLED" ? "Chương trình đã tạm dừng nhận góp ý mới. Thông tin bạn nhập vẫn được giữ." : "Chưa gửi được thông tin. Thông tin bạn nhập vẫn được giữ; hãy kiểm tra và chủ động thử lại." :
                state.campaign === "disabled" ? "Chương trình hiện không nhận thông tin. Thông tin bạn nhập vẫn được giữ." :
                  "Chưa thể xác nhận chương trình. Thông tin bạn nhập vẫn được giữ; vui lòng thử lại sau."}
          </p>}
        </div>
        {(state.campaign === "disabled" || state.campaign === "unavailable") &&
          <ThemeButton type="button" variant="secondary" onClick={() => void session.refreshCampaign()} whileHover={undefined} whileTap={undefined}>Kiểm tra lại chương trình</ThemeButton>}
        {formId && retryable && <ThemeButton type="button" variant="secondary" disabled={busy || cooling || state.campaign !== "enabled"} onClick={() => void session.retrySubmission()} whileHover={undefined} whileTap={undefined}>Thử lại cùng lượt gửi</ThemeButton>}
        {formId && state.submission === "uncertain" && <p className={styles.help}>“Thử lại cùng lượt gửi” giữ nguyên thông tin của lượt chưa rõ kết quả và không tạo thêm bản ghi khi lượt đó đã được tiếp nhận. Chọn “Gửi lượt góp ý mới” nếu muốn sửa thông tin hoặc gửi góp ý khác.</p>}
        <fieldset disabled={busy || (!!formId && (outcome || state.campaign !== "enabled"))} aria-busy={busy}>{children}</fieldset>
      </FeedbackPopup>
    </>
  );
}
