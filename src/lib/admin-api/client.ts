import { operations, schemas, type OperationId } from "./contract";
import type { Inputs, Responses, Meta, ErrorEnvelope } from "./types";
import { validateSchema, ContractError, type Schema } from "./schema";
import { buildUrl, type PathParams, type Query } from "./validation";
export type Envelope<T> = { data: T; meta: Meta };
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId = "",
    public retryAt = 0,
  ) {
    super(
      (
        {
          400: "Bộ lọc hoặc thông tin gửi lên không hợp lệ. Hãy kiểm tra và thử lại.",
          401: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
          403: "Không được phép truy cập. Kiểm tra quyền, nguồn truy cập hoặc CSRF.",
          404: "Không tìm thấy tài nguyên.",
          409: "Trạng thái đã thay đổi. Hãy tải lại dữ liệu.",
          429: "Đã đạt giới hạn truy cập. Vui lòng chờ ít nhất 60 giây.",
          503: "Máy chủ đang bận hoặc chưa sẵn sàng. Vui lòng thử lại sau.",
        } as Record<number, string>
      )[status] || "Không thể kết nối máy chủ. Vui lòng thử lại.",
    );
  }
}
const controllers = new Set<AbortController>();
const inflight = new Map<
  string,
  {
    promise: Promise<Envelope<unknown>>;
    controller: AbortController;
    users: number;
  }
>();
const queue: Array<() => void> = [];
const reads: number[] = [];
let active = 0;
let generation = 0;
let cooldown = 0;
let failureHandler: (error: ApiError) => void = () => {};
let paymentStatuses: readonly string[] = [];
let announceRead: (time: number) => void = () => {};
let onReadSuccess: () => void = () => {};
export function configureClient(options: {
  onAuthorizationFailure: typeof failureHandler;
  paymentStatuses?: readonly string[];
  announceRead?: typeof announceRead;
  onReadSuccess?: typeof onReadSuccess;
}) {
  failureHandler = options.onAuthorizationFailure;
  if (options.paymentStatuses) paymentStatuses = options.paymentStatuses;
  if (options.announceRead) announceRead = options.announceRead;
  if (options.onReadSuccess) onReadSuccess = options.onReadSuccess;
}
export function observeRead(time: number) {
  if (Number.isFinite(time)) {
    reads.push(time);
    reads.sort((a, b) => a - b);
  }
}
export function clearClient() {
  generation++;
  for (const controller of controllers) controller.abort();
  controllers.clear();
  inflight.clear();
  paymentStatuses = [];
}
export function retryDeadline() {
  return cooldown;
}
async function slot(signal: AbortSignal) {
  signal.throwIfAborted();
  if (active >= 4) {
    if (queue.length >= 32) throw new ApiError(503, "CLIENT_QUEUE_FULL");
    await new Promise<void>((resolve, reject) => {
      const ready = () => {
        active++;
        signal.removeEventListener("abort", abort);
        resolve();
      };
      const abort = () => {
        const index = queue.indexOf(ready);
        if (index !== -1) queue.splice(index, 1);
        reject(new DOMException("Cancelled", "AbortError"));
      };
      queue.push(ready);
      signal.addEventListener("abort", abort, { once: true });
    });
  } else active++;
  if (signal.aborted) {
    active--;
    queue.shift()?.();
    signal.throwIfAborted();
  }
  return () => {
    active--;
    queue.shift()?.();
  };
}
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
async function execute<T>(
  id: OperationId | undefined,
  url: string,
  body: unknown,
  csrf: string | undefined,
  signal: AbortSignal,
  extension?: { method: "GET" | "PATCH" | "POST"; response: Schema; authenticated: true },
): Promise<Envelope<T>> {
  const op = extension || operations[id!];
  const startedGeneration = generation;
  const release = await slot(signal);
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() < cooldown)
        throw new ApiError(429, "CLIENT_RATE_WAIT", "", cooldown);
      if (op.method === "GET" && op.authenticated) {
        while (reads.length && reads[0] <= Date.now() - 60000) reads.shift();
        if (reads.length >= 100) {
          cooldown = Date.now() + 60000;
          throw new ApiError(429, "CLIENT_READ_BUDGET", "", cooldown);
        }
        const time = Date.now();
        reads.push(time);
        announceRead(time);
      }
      let response: Response;
      try {
        response = await fetch(url, {
          method: op.method,
          credentials: "include",
          cache: "no-store",
          redirect: "error",
          signal,
          headers: {
            ...(body !== undefined
              ? { "Content-Type": "application/json" }
              : {}),
            ...(csrf ? { "X-HomeMind-Admin-CSRF": csrf } : {}),
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) {
        if (signal.aborted) throw error;
        throw new ApiError(0, "NETWORK_UNAVAILABLE");
      }
      let envelope: unknown;
      const invalidateMalformedAuthorization = () => {
        if ((response.status === 401 && id !== "adminLogin") || (response.status === 403 && op.authenticated))
          failureHandler(new ApiError(response.status, "ADMIN_AUTHORIZATION_UNAVAILABLE"));
      };
      try {
        envelope = await response.json();
      } catch {
        invalidateMalformedAuthorization();
        throw new ContractError("response");
      }
      if (!response.ok) {
        try { validateSchema(schemas.Error, envelope, schemas); }
        catch (error) { invalidateMalformedAuthorization(); throw error; }
        const { error } = envelope as ErrorEnvelope;
        let retryAt = 0;
        if (response.status === 429) {
          const header = response.headers.get("Retry-After");
          const duration =
            header && /^\d+$/.test(header)
              ? Number(header) * 1000
              : Math.max(0, Date.parse(header || "") - Date.now());
          retryAt =
            Date.now() +
            Math.max(60000, Number.isFinite(duration) ? duration : 60000);
          cooldown = retryAt;
        }
        const failure = new ApiError(
          response.status,
          error.code,
          error.requestId,
          retryAt,
        );
        if (response.status === 401 && id !== "adminLogin")
          failureHandler(failure);
        if (response.status === 403 && op.authenticated)
          failureHandler(failure);
        if (response.status === 503 && op.method === "GET" && attempt === 0) {
          await wait(700, signal);
          continue;
        }
        throw failure;
      }
      if (extension && response.status !== 200) throw new ContractError("response.status");
      validateSchema(
        {
          type: "object",
          required: ["data", "meta"],
          properties: {
            data: extension?.response || { $ref: `#/components/schemas/${op.response}` },
            meta: { $ref: "#/components/schemas/Meta" },
          },
        },
        envelope,
        schemas,
      );
      const result = envelope as Envelope<T>;
      if (result.meta.version !== "admin-v1")
        throw new ContractError("meta.version");
      if (startedGeneration !== generation)
        throw new DOMException("Session cleared", "AbortError");
      if (op.authenticated && op.method === "GET") onReadSuccess();
      return result;
    }
    throw new ApiError(503, "ADMIN_UNAVAILABLE");
  } finally {
    release();
  }
}
export function request<K extends OperationId>(
  id: K,
  input: Inputs[K],
  options: { signal?: AbortSignal; csrf?: string } = {},
): Promise<Envelope<Responses[K]>> {
  const url = buildUrl(
    id,
    input.params as PathParams,
    input.query as Query,
    paymentStatuses,
  );
  const body = "body" in input ? input.body : undefined;
  if (body !== undefined && id !== "adminLogin")
    throw new ContractError("request.body");
  const key = `${id}:${url}`;
  const isGet = operations[id].method === "GET";
  let entry = isGet ? inflight.get(key) : undefined;
  if (!entry) {
    const controller = new AbortController();
    controllers.add(controller);
    entry = {
      controller,
      users: 0,
      promise: execute<Responses[K]>(id, url, body, options.csrf, controller.signal),
    };
    const own = entry;
    entry.promise = entry.promise.finally(() => {
      controllers.delete(controller);
      if (inflight.get(key) === own) inflight.delete(key);
    });
    if (isGet) inflight.set(key, entry);
  }
  entry.users++;
  const shared = entry;
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return false;
      done = true;
      options.signal?.removeEventListener("abort", abort);
      shared.users--;
      return true;
    };
    const abort = () => {
      if (finish()) {
        if (!shared.users) shared.controller.abort();
        reject(new DOMException("Cancelled", "AbortError"));
      }
    };
    if (options.signal?.aborted) return abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    shared.promise.then(
      (value) => {
        if (finish()) resolve(value as Envelope<Responses[K]>);
      },
      (error) => {
        if (finish()) reject(error);
      },
    );
  });
}

// Released feedback APIs extend, rather than rewrite, the checked-in admin-v1
// catalogue. They share session invalidation, credentials, throttling and CSRF.
export async function requestFeedbackAdmin<T>(
  url: string,
  method: "GET" | "PATCH",
  response: Schema,
  options: { body?: unknown; csrf?: string; signal?: AbortSignal } = {},
): Promise<Envelope<T>> {
  const target = new URL(url);
  if (target.origin !== new URL(buildUrl("adminMe")).origin || target.username || target.password || target.hash ||
      !/^\/v1\/admin\/feedback-popup(?:\/submissions(?:\/[0-9a-f-]+)?)?$/.test(target.pathname) ||
      (method === "PATCH" && (target.pathname !== "/v1/admin/feedback-popup" || target.search)) ||
      (method === "GET" && options.body !== undefined))
    throw new ContractError("request.path");
  if (method === "PATCH" && !options.csrf) throw new ContractError("request.csrf");
  const controller = new AbortController();
  controllers.add(controller);
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 20000);
  try {
    return await execute<T>(undefined, url, options.body, options.csrf, controller.signal,
      { method, response, authenticated: true });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    controllers.delete(controller);
  }
}

/** Additive IAP surface: same session, throttling, CSRF, errors and validation. */
export async function requestIapAdmin<T>(url: string, method: "GET" | "POST", response: Schema,
  options: { body?: unknown; csrf?: string; signal?: AbortSignal } = {}): Promise<Envelope<T>> {
  const target = new URL(url);
  const read = /^\/v1\/admin\/iap\/(?:report|cases(?:\/[0-9a-f-]{36})?|intake)$/.test(target.pathname);
  const write = /^\/v1\/admin\/iap\/(?:cases\/[0-9a-f-]{36}\/actions|intake\/[0-9a-f-]{36}\/retry)$/.test(target.pathname);
  if (target.origin !== new URL(buildUrl("adminMe")).origin || target.username || target.password || target.hash ||
    (method === "GET" && (!read || options.body !== undefined)) ||
    (method === "POST" && (!write || target.search || !options.csrf))) throw new ContractError("request.pathOrCsrf");
  const controller = new AbortController();controllers.add(controller);
  const abort = () => controller.abort();options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 20000);
  try { return await execute<T>(undefined, url, options.body, options.csrf, controller.signal, { method, response, authenticated: true }); }
  finally { clearTimeout(timer); controllers.delete(controller); options.signal?.removeEventListener("abort", abort); }
}
