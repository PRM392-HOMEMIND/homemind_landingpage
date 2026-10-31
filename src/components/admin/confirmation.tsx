"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
export function Confirmation({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="hm-admin hm-dialog"
      aria-labelledby="hm-confirm-title"
      aria-describedby="hm-confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="hm-confirm-title">{title}</h2>
      <p id="hm-confirm-description">{description}</p>
      <div className="hm-dialog-actions">
        <button
          ref={cancel}
          className="hm-button hm-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          className="hm-button hm-danger"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Đang xử lý…" : "Xác nhận"}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
