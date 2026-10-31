import {
  ApiError,
  clearClient,
  configureClient,
  observeRead,
  request,
} from "../admin-api/client";
import type { Identity, Vocabulary, Refresh } from "../admin-api/types";
import { normalizeLogin } from "../admin-api/validation";
import { ContractError } from "../admin-api/schema";
type SessionState = {
  phase: "checking" | "authenticated" | "guest" | "error";
  identity: Identity | null;
  vocabulary: Vocabulary | null;
  error: Error | null;
  revision: number;
};
let state: SessionState = {
  phase: "checking",
  identity: null,
  vocabulary: null,
  error: null,
  revision: 0,
};
const listeners = new Set<() => void>();
let initializeFlight: Promise<void> | undefined;
let refreshFlight: Promise<Refresh> | undefined;
let csrf: string | undefined;
let channel: BroadcastChannel | undefined;
let lastReadAt = 0;
let refreshResult: Refresh | undefined;
let refreshedAt = 0;
let started = false;
export const sessionStore = {
  getSnapshot: () => state,
  getServerSnapshot: () => serverState,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
const serverState = state;
function publish(next: Partial<SessionState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}
function clear(error: Error | null, announce = true) {
  csrf = undefined;
  refreshResult = undefined;
  clearClient();
  publish({
    phase:
      error instanceof ApiError && error.status === 403 ? "error" : "guest",
    identity: null,
    vocabulary: null,
    error,
    revision: state.revision + 1,
  });
  if (announce)
    channel?.postMessage({
      type: "cleared",
      forbidden: error instanceof ApiError && error.status === 403,
    });
}
function configure(vocabulary?: Vocabulary) {
  configureClient({
    onAuthorizationFailure: (error) => clear(error),
    paymentStatuses: vocabulary?.orderStatuses,
    announceRead: (time) => channel?.postMessage({ type: "read", time }),
    onReadSuccess: () => {
      lastReadAt = Date.now();
      channel?.postMessage({ type: "activity", time: lastReadAt });
    },
  });
}
export function startSessionCoordinator() {
  if (started || typeof window === "undefined") return;
  started = true;
  configure();
  channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("homemind-admin-session-v1")
      : undefined;
  if (channel)
    channel.onmessage = (event) => {
      const message = event.data;
      if (message?.type === "cleared")
        clear(
          message.forbidden ? new ApiError(403, "ADMIN_FORBIDDEN") : null,
          false,
        );
      if (message?.type === "read" && typeof message.time === "number")
        observeRead(message.time);
      if (
        message?.type === "activity" &&
        typeof message.time === "number" &&
        state.identity &&
        message.time <= Date.now() &&
        message.time > lastReadAt
      )
        lastReadAt = message.time;
      if (message?.type === "refresh" && typeof message.time === "number") {
        // CSRF stays in each tab's memory and is recovered under the shared lock.
        csrf = undefined;
        refreshedAt = message.time;
        if (state.phase === "authenticated" || state.phase === "guest")
          void revalidate();
      }
    };
  setInterval(() => {
    if (
      state.identity &&
      (Date.now() >= Date.parse(state.identity.expiresAt) ||
        Date.now() - lastReadAt >= state.identity.idleSeconds * 1000)
    )
      clear(new ApiError(401, "CLIENT_SESSION_EXPIRED"));
  }, 10000); // Local expiry check only; no polling or keep-alive HTTP.
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 60000 && state.identity)
      void revalidate();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && state.identity) void revalidate();
  });
}
async function exclusive<T>(action: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  startSessionCoordinator();
  if (!navigator.locks)
    throw new Error(
      "Trình duyệt chưa hỗ trợ điều phối phiên an toàn. Vui lòng dùng trình duyệt mới hơn.",
    );
  return navigator.locks.request(
    "homemind-admin-auth-v1",
    { mode: "exclusive", ...(signal ? { signal } : {}) },
    action,
  );
}
async function recoverCsrf(signal?: AbortSignal) {
  const result = await request("adminCsrf", {}, { signal });
  csrf = result.data.csrfToken;
  return csrf;
}
async function establish() {
  const identity = (await request("adminMe", {})).data;
  const vocabulary = (await request("adminMeta", {})).data;
  if (
    vocabulary.version !== "admin-v1" ||
    vocabulary.role !== "SYSTEM_ADMIN" ||
    !vocabulary.readOnly
  )
    throw new ContractError("vocabulary");
  configure(vocabulary);
  lastReadAt = Date.now();
  publish({ phase: "authenticated", identity, vocabulary, error: null });
}
export function initializeSession(): Promise<void> {
  startSessionCoordinator();
  if (state.phase !== "checking") return Promise.resolve();
  if (!initializeFlight)
    initializeFlight = exclusive(async () => {
      try {
        await establish();
        await recoverCsrf();
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401))
          publish({
            phase: "error",
            identity: null,
            vocabulary: null,
            error: error as Error,
          });
      }
    })
      .catch((error) => publish({ phase: "error", error }))
      .finally(() => {
        initializeFlight = undefined;
      });
  return initializeFlight;
}
export async function revalidate() {
  if (initializeFlight) return initializeFlight;
  publish({ phase: "checking" });
  return initializeSession();
}
export async function login(email: string, password: string) {
  const body = normalizeLogin(email, password);
  return exclusive(async () => {
    clearClient();
    csrf = await recoverCsrf();
    const result = await request("adminLogin", { body }, { csrf });
    csrf = result.data.csrfToken;
    await establish();
    channel?.postMessage({ type: "refresh", time: Date.now() });
  });
}
export function refreshSession(): Promise<Refresh> {
  if (refreshFlight) return refreshFlight;
  const requestedAt = Date.now();
  const observedSession = state.identity?.sessionId;
  refreshFlight = exclusive(async () => {
    const current = (await request("adminMe", {})).data;
    await recoverCsrf();
    if (current.sessionId !== observedSession || refreshedAt > requestedAt) {
      refreshResult = {
        sessionId: current.sessionId,
        expiresAt: current.expiresAt,
        csrfToken: csrf!,
      };
    } else {
      refreshResult = (await request("adminRefresh", {}, { csrf })).data;
      csrf = refreshResult.csrfToken;
      refreshedAt = Date.now();
      channel?.postMessage({ type: "refresh", time: refreshedAt });
    }
    await establish();
    return refreshResult;
  }).finally(() => {
    refreshFlight = undefined;
  });
  return refreshFlight;
}
export async function logout(all = false) {
  await exclusive(async () => {
    await recoverCsrf();
    const result = await request(
      all ? "adminLogoutAll" : "adminLogout",
      {},
      { csrf },
    );
    if (!result.data.revoked)
      throw new Error(
        "Máy chủ chưa xác nhận đã thu hồi phiên. Hãy kiểm tra lại.",
      );
    clear(null);
  });
}
export async function revokeSession(sessionId: string, current: boolean) {
  return exclusive(async () => {
    await recoverCsrf();
    const result = await request(
      "adminRevokeSession",
      { params: { sessionId } },
      { csrf },
    );
    if (!result.data.revoked)
      throw new Error("Máy chủ chưa xác nhận đã thu hồi phiên.");
    if (current) clear(null);
    return result;
  });
}

export async function withAdminCsrf<T>(action: (token: string) => Promise<T>, signal?: AbortSignal): Promise<T> {
  return exclusive(async () => {
    signal?.throwIfAborted();
    if (state.phase !== "authenticated") throw new ApiError(401, "ADMIN_UNAUTHORIZED");
    const revision = state.revision;
    const token = await recoverCsrf(signal);
    if (state.phase !== "authenticated" || state.revision !== revision)
      throw new DOMException("Session cleared", "AbortError");
    return action(token);
  }, signal);
}
