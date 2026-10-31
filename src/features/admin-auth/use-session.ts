'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { initializeSession, sessionStore } from '@/lib/auth/admin-session';
export function useSession() {
  const session=useSyncExternalStore(sessionStore.subscribe,sessionStore.getSnapshot,sessionStore.getServerSnapshot);
  useEffect(() => { void initializeSession(); },[]);
  return session;
}
