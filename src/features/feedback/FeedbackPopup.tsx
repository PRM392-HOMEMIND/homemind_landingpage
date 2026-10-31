"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Gift, X } from "lucide-react";
import Image from "next/image";
import logo from "@/app/logo.png";
import { lockPageScroll } from "./scroll-lock";
import styles from "./feedback-popup.module.css";
import { rewardPolicy } from "./policy";

/** Keep mounted when closed. The caller owns the draft and any pending operation. */
export function FeedbackPopup({ open, onRequestClose, children, actions, guidance }: {
  open: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  guidance?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current!;
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll(document);
    const viewport = window.visualViewport;
    const syncViewport = () => {
      element.style.setProperty("--popup-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      element.style.setProperty("--popup-viewport-top", `${viewport?.offsetTop ?? 0}px`);
      element.style.setProperty("--popup-viewport-bottom", `${Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))}px`);
    };
    syncViewport();
    element.showModal();
    heading.current?.focus({ preventScroll: true });
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    return () => {
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      element.close();
      unlock();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      data-feedback-dialog
      className={styles.dialog}
      data-lenis-prevent
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); onRequestClose(); }}
      onKeyDown={(event) => {
        // A queued key event can arrive after close(), when all controls are hidden.
        if (event.key !== "Tab" || !event.currentTarget.open) return;
        const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button, input, textarea, select, summary, [tabindex]"))
          .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement;
        // The initial heading is outside the tab order; start at the close button.
        if (event.shiftKey && (active === first || !focusable.includes(active))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (active === last || !focusable.includes(active))) {
          event.preventDefault(); first.focus();
        }
      }}
    >
      <button className={styles.close} type="button" onClick={onRequestClose} aria-label="Đóng cửa sổ góp ý">
        <X size={20} aria-hidden="true" />
      </button>
      {/* Firefox otherwise inserts a scroll container into the native Tab order. */}
      <div className={styles.content} data-lenis-prevent tabIndex={-1}>
        <header className={styles.header}>
          <div className={styles.badge}><Image src={logo} alt="" width={20} height={20} sizes="20px" className={styles.badgeLogo} /> HomeMind Premium</div>
          <div className={styles.giftMark} aria-hidden="true"><Gift size={40} strokeWidth={1.5} /></div>
          <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>
            <span className={styles.titleLead}>30 Ngày</span>{" "}
            <span className={styles.titleLine}><span className={styles.titlePhrase}>Đặc Quyền</span>{" "}Premium</span>
          </h2>
          <p id={`${id}-description`}>Chia sẻ góp ý của bạn để đăng ký trải nghiệm HomeMind Premium.</p>
          <p className={styles.policy}>{rewardPolicy}</p>
          {guidance}
          <div className={styles.legalLinks}>
            <a className={styles.privacy} tabIndex={0} href="/terms-of-service#premium-30-ngay" target="_blank" rel="noopener noreferrer">Điều khoản chương trình<span className={styles.linkHint}> (mở trong thẻ mới)</span></a>
            <a className={styles.privacy} tabIndex={0} href="/privacy-policy#gop-y-nhan-qua-premium" target="_blank" rel="noopener noreferrer">Chính sách bảo mật<span className={styles.linkHint}> (mở trong thẻ mới)</span></a>
          </div>
        </header>
        <div className={styles.formContent}>{children}</div>
        {actions && <footer className={styles.actions}>{actions}</footer>}
      </div>
    </dialog>
  );
}
