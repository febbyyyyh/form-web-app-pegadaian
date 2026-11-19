import { useSyncExternalStore } from "react";

import { createSeed } from "./seed";
import type { Database, User } from "./types";

/*
 * Browser-only demo store. All data lives in localStorage so the app runs with no backend.
 * Swap these functions for real API calls when a backend is connected.
 */
const DB_KEY = "formkanwil:db:v1";
const SESSION_KEY = "formkanwil:session:v1";

const SERVER_SNAPSHOT = createSeed(Date.UTC(2026, 0, 1));
let dbCache: Database | null = null;
let sessionCache: string | null | undefined;
const listeners = new Set<() => void>();

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === DB_KEY) dbCache = null;
    if (e.key === SESSION_KEY) sessionCache = undefined;
    if (e.key === DB_KEY || e.key === SESSION_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getDb(): Database {
  if (!isBrowser()) return SERVER_SNAPSHOT;
  if (dbCache) return dbCache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    dbCache = raw ? (JSON.parse(raw) as Database) : createSeed();
    if (!raw) localStorage.setItem(DB_KEY, JSON.stringify(dbCache));
  } catch {
    dbCache = createSeed();
  }
  return dbCache;
}

export function setDb(next: Database | ((db: Database) => Database)) {
  const value = typeof next === "function" ? next(getDb()) : next;
  dbCache = value;
  if (isBrowser()) localStorage.setItem(DB_KEY, JSON.stringify(value));
  emit();
}

export function resetDemoData() {
  setDb(createSeed());
}

export function getSessionUserId(): string | null {
  if (!isBrowser()) return null;
  if (sessionCache === undefined) sessionCache = localStorage.getItem(SESSION_KEY);
  return sessionCache;
}

export function setSession(userId: string | null) {
  sessionCache = userId;
  if (isBrowser()) {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  }
  emit();
}

export function getCurrentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  const user = getDb().users.find((u) => u.id === id);
  return user && user.active ? user : null;
}

export function useDb(): Database {
  return useSyncExternalStore(subscribe, getDb, () => SERVER_SNAPSHOT);
}

export function useCurrentUser(): User | null {
  const db = useDb();
  const id = useSyncExternalStore(subscribe, getSessionUserId, () => null);
  if (!id) return null;
  const user = db.users.find((u) => u.id === id);
  return user && user.active ? user : null;
}

export function homePathFor(user: User): "/admin" | "/app" {
  return user.role === "admin" ? "/admin" : "/app";
}
