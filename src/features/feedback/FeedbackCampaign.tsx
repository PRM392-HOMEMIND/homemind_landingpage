"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { publicApiOrigin } from "@/config/public-api";
import { FeedbackExperience } from "./FeedbackExperience";
import { createFeedbackAdapter, type FeedbackOperation } from "./http-adapter";
import { FeedbackSession } from "./session";
import { startFeedbackInvitations } from "./invitation";
import { feedbackFields, fieldLabels, validateFeedback, type FeedbackDraft, type FieldErrors } from "./validation";
import styles from "./feedback-popup.module.css";

const emptyDraft: FeedbackDraft = { fullName: "", phoneNumber: "", email: "", review: "" };
export default function FeedbackCampaign() {
  const [session] = useState(() => {
    try { return new FeedbackSession(createFeedbackAdapter(publicApiOrigin)); }
    catch { return new FeedbackSession<FeedbackOperation>(); }
  });
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const mounted = useRef(false);
  const composing = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const id = useId();
  useEffect(() => {
    mounted.current = true;
    let active = true;
    let stopInvitations: (() => void) | undefined;
    // React's development probe cleans up synchronously. Start after that
    // probe, so it cannot issue a redundant GET or own an invitation timer.
    queueMicrotask(() => { if (active) stopInvitations = startFeedbackInvitations(session, document, window); });
    return () => {
      active = false;
      mounted.current = false;
      stopInvitations?.();
      // StrictMode probes effects using the same session. Dispose only after
      // real unmount; a replacement effect owns its initialization.
      queueMicrotask(() => { if (!mounted.current) session.dispose(); });
    };
  }, [session]);
  function submit() {
    if (composing.current || state.submission !== "idle") return;
    const found = validateFeedback(draft);
    setErrors(found);
    const first = feedbackFields.find(field => found[field]);
    if (first) { form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    // An operation owns its immutable snapshot/UUID, independent of account.
    void session.submit({ draft: { ...draft }, key: crypto.randomUUID() });
  }
  return <>
    <FeedbackExperience session={session} onSubmit={submit} formId={`${id}-form`} guidance={
      <details className={styles.guide}>
        <summary>Xem cách nhận quà</summary>
        <ol>
          <li>Điền thông tin và chia sẻ góp ý.</li>
          <li>Đăng ký hoặc đăng nhập HomeMind bằng thông tin liên hệ tương ứng. Form này không tạo tài khoản.</li>
          <li>Làm mới thông tin gói trong tài khoản để xem quyền lợi khi đủ điều kiện.</li>
        </ol>
      </details>
    }>
      <form id={`${id}-form`} ref={form} className={styles.form} noValidate onSubmit={event => { event.preventDefault(); submit(); }}
        onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={event => { if (event.key === "Enter" && (event.nativeEvent.isComposing || composing.current) && (event.target as HTMLElement).tagName !== "TEXTAREA") event.preventDefault(); }}>
        {feedbackFields.map(field => {
          const error = errors[field] || state.error?.fields[field];
          const attrs = { id: `${id}-${field}`, name: field, value: draft[field], required: true, "aria-required": true as const, "aria-invalid": !!error, "aria-describedby": error ? `${id}-${field}-error` : field === "review" ? `${id}-review-hint` : undefined,
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setDraft(current => ({ ...current, [field]: event.target.value })); setErrors(current => ({ ...current, [field]: undefined })); } };
          return <div key={field} className={`${styles.field} ${field === "email" || field === "review" ? styles.fullField : ""}`}>
            <label htmlFor={attrs.id}>{fieldLabels[field]} <span className={styles.required} aria-hidden="true">*</span></label>
            {field === "review" ? <textarea {...attrs} rows={4} /> : <input {...attrs} type={field === "email" ? "email" : field === "phoneNumber" ? "tel" : "text"} autoComplete={field === "fullName" ? "name" : field === "phoneNumber" ? "tel" : "email"} />}
            {field === "review" && <p id={`${id}-review-hint`} className={styles.help}>Tối đa 5.000 ký tự. Bạn muốn HomeMind cải thiện điều gì?</p>}
            {error && <p id={`${id}-${field}-error`} className={styles.fieldError} role="alert">{error}</p>}
          </div>;
        })}
      </form>
    </FeedbackExperience>
  </>;
}
