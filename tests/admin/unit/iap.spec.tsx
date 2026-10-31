import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { milliunits } from "../../../src/features/payments/iap-management";
import { requestIapAdmin } from "../../../src/lib/admin-api/client";
const schema = { type: "object" };
const origin = "https://api.homemind.vn";
test("money remains exact, null is unknown and no floating-point currency conversion",()=>{
  expect(milliunits(null)).toBe("Chưa có nguồn");expect(milliunits("9007199254740993123")).toBe("9007199254740993.123");expect(milliunits("-999")).toBe("-0.999");expect(milliunits(0)).toBe("Chưa có nguồn");
});
test("IAP client refuses cross-origin, arbitrary routes and writes without CSRF before fetch",async()=>{
  const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error("EGRESS_FORBIDDEN");};
  try {
    await expect(requestIapAdmin("https://evil.invalid/v1/admin/iap/report","GET",schema)).rejects.toThrow();
    await expect(requestIapAdmin(origin+"/v1/admin/iap/mark-paid","POST",schema,{csrf:"fixture"})).rejects.toThrow();
    await expect(requestIapAdmin(origin+"/v1/admin/iap/cases/12345678-1234-4123-8123-123456789abc/actions","POST",schema)).rejects.toThrow();
    expect(calls).toBe(0);
  } finally { globalThis.fetch=old; }
});
test("read uses session cookies and no provider request; nullable money survives",async()=>{
  const old=globalThis.fetch;const calls: Array<{url:string;init?:RequestInit}>=[];
  globalThis.fetch=async(input,init)=>{calls.push({url:String(input),init});return new Response(JSON.stringify({data:{groups:[{currency:"USD",recordedGrossMilliunits:null}],netProceeds:null},meta:{requestId:"12345678-1234-4123-8123-123456789abc",asOf:new Date().toISOString(),version:"admin-v1",freshness:"database_snapshot"}}),{status:200});};
  try { const response=await requestIapAdmin<{netProceeds:null}>(origin+"/v1/admin/iap/report?from=2026-10-01T00%3A00%3A00Z&to=2026-10-27T00%3A00%3A00Z","GET",schema);expect(response.data.netProceeds).toBeNull();expect(calls).toHaveLength(1);expect(calls[0].init?.credentials).toBe("include"); }
  finally { globalThis.fetch=old; }
});
test("legal wording distinguishes voluntary cancellation from Store refunds and paid-unfulfilled recovery",()=>{
  const source=readFileSync("src/app/(legal)/terms-of-service/page.tsx","utf8");
  // Authorized consumer-language revision: preserve the payment boundaries,
  // rather than freezing the previous engineering wording verbatim.
  expect(source).toContain("HomeMind không tạo ví tiền");
  expect(source).toContain("tự chuyển thời gian chưa dùng thành Credit");
  expect(source).toContain("Điều này không loại trừ khoản điều chỉnh");
  expect(source).toContain("không loại trừ quyền hoàn tiền theo luật");
  expect(source).toContain("đã bị thu tiền nhưng quyền lợi chưa được cập nhật");
  expect(source).toContain("Hiện tính năng mua Subscription, Credit và chuyển gói chưa được mở.");
  expect(source).toContain("không tự cấp lại các đơn vị đã sử dụng");
});
