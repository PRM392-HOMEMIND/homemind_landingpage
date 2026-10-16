"use client";
import { useEffect, useState } from "react";
import { useSession } from "../admin-auth/use-session";
import type { Envelope } from "../../lib/admin-api/client";

export function useFeedbackQuery<T>(key: string, load: (signal: AbortSignal) => Promise<Envelope<T>>) {
  const session = useSession();
  const [attempt, setAttempt] = useState(0);
  const identity = `${session.revision}:${attempt}:${key}`;
  const [result, setResult] = useState<{ key: string; data?: Envelope<T>; error?: Error }>();
  useEffect(() => {
    if (session.phase !== "authenticated") return;
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal)).then(
      data => { if (!controller.signal.aborted) setResult({ key: identity, data }); },
      error => { if (!controller.signal.aborted) setResult({ key: identity, error }); },
    );
    return () => controller.abort();
  }, [identity, load, session.phase]);
  const current = session.phase === "authenticated" && result?.key === identity ? result : undefined;
  return { data: current?.data, error: current?.error, loading: !current, retry: () => setAttempt(value => value + 1) };
}
