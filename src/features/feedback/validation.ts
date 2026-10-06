import isEmail from "validator/lib/isEmail";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// Released BE validation.ts + auth/identifiers.ts at 233e715. Same validators,
// versions and raw caps; contact canonicalization remains the server's work.
export const feedbackFields = ["fullName", "phoneNumber", "email", "review"] as const;
export type FeedbackField = typeof feedbackFields[number];
export type FeedbackDraft = Record<FeedbackField, string>;
export type FieldErrors = Partial<Record<FeedbackField, string>>;
export const fieldLabels: FeedbackDraft = { fullName: "Họ và tên", phoneNumber: "Số điện thoại", email: "Email", review: "Góp ý của bạn" };
export const sentenceLabel = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);
export const limits = { fullName: 120, phoneNumber: 40, email: 254, review: 5000 };
const rawCaps = { fullName: 1000, phoneNumber: 200, email: 1000, review: 20000 };
const loneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
export function validateFeedback(input: unknown): FieldErrors {
  const errors: FieldErrors = {};
  const record = input && typeof input === "object" ? input as Record<string, unknown> : {};
  for (const field of feedbackFields) {
    const raw = record[field];
    const label = fieldLabels[field];
    if (raw === undefined || raw === null || (typeof raw === "string" && !raw.trim())) errors[field] = `Vui lòng nhập ${sentenceLabel(label)}.`;
    else if (typeof raw !== "string") errors[field] = `${label} phải là văn bản.`;
    else if (raw.length > rawCaps[field]) errors[field] = `${label} quá dài.`;
    else if (loneSurrogate.test(raw)) errors[field] = `${label} chứa ký tự không hợp lệ.`;
    else {
      const value = (field === "fullName" || field === "review" ? raw.normalize("NFC") : raw).trim();
      const control = field === "review" ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/ : /[\u0000-\u001F\u007F]/;
      if (control.test(value)) errors[field] = `${label} chứa ký tự điều khiển không hợp lệ.`;
      else if (Array.from(value).length > limits[field]) errors[field] = `${label} tối đa ${limits[field]} ký tự.`;
      else if (field === "email" && (!isEmail(value.toLowerCase()) || value.toLowerCase().length > 254)) errors[field] = "Email không hợp lệ.";
      else if (field === "phoneNumber" && !parsePhoneNumberFromString(value, "VN")?.isValid()) errors[field] = "Số điện thoại không hợp lệ.";
    }
  }
  return errors;
}
