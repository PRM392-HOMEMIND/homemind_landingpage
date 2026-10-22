"use client";
import { useEffect, useState } from "react";
import { request, type Envelope } from "./client";
import type { OperationId } from "./contract";
import type { Inputs, Responses } from "./types";
import { useSession } from "@/features/admin-auth/use-session";
export function useAdminQuery<K extends OperationId>(
  id: K,
  input: Inputs[K],
  enabled = true,
) {
  const session = useSession();
  const signature = JSON.stringify(input);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${signature}:${attempt}:${session.revision}`;
  const [result, setResult] = useState<{
    key: string;
    response?: Envelope<Responses[K]>;
    error?: Error;
  }>({ key: "" });
  useEffect(() => {
    if (!enabled || session.phase !== "authenticated") return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await request(id, JSON.parse(signature), {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setResult({ key, response });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({ key, error: error as Error });
      }
    }
    void load();
    return () => controller.abort();
  }, [id, signature, key, enabled, session.phase]);
  const current =
    result.key === key && session.phase === "authenticated"
      ? result
      : undefined;
  return {
    response: current?.response,
    error: current?.error,
    loading: enabled && !current,
    retry: () => setAttempt((value) => value + 1),
  };
}
